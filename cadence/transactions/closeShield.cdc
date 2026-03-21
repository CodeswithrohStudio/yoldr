import ShieldPosition from 0x8401ed4fc6788c8a
import BadgeMinter from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a
import MockPriceFeed from 0x8401ed4fc6788c8a

transaction(positionId: UInt64) {
    let userAddress: Address

    prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        self.userAddress = signer.address

        // Setup badge collection if needed
        if signer.storage.borrow<&BadgeMinter.Collection>(from: BadgeMinter.CollectionStoragePath) == nil {
            let collection <- BadgeMinter.createEmptyCollection(nftType: Type<@BadgeMinter.NFT>())
            signer.storage.save(<-collection, to: BadgeMinter.CollectionStoragePath)
            let cap = signer.capabilities.storage.issue<&BadgeMinter.Collection>(BadgeMinter.CollectionStoragePath)
            signer.capabilities.publish(cap, at: BadgeMinter.CollectionPublicPath)
        }
    }

    execute {
        // Get position from user's collection
        let shieldCollection = getAccount(self.userAddress).storage.borrow<&ShieldPosition.Collection>(
            from: ShieldPosition.CollectionStoragePath
        ) ?? panic("Could not borrow shield collection")

        let position = shieldCollection.borrowShieldPosition(positionId)
            ?? panic("Position not found")

        // Calculate current P&L
        let currentPrice = MockPriceFeed.getPrice(asset: position.asset)
        let priceChange = Fix64(currentPrice) - Fix64(position.openPrice)
        let priceChangePct = priceChange / Fix64(position.openPrice)
        let leveragedPct = priceChangePct * Fix64(position.leverage)
        let returnPct = leveragedPct

        // Mint Badge NFT
        let badgeMinterRef = getAccount(0x8401ed4fc6788c8a).storage.borrow<&BadgeMinter.Minter>(
            from: BadgeMinter.MinterStoragePath
        ) ?? panic("Could not borrow badge minter")

        let badge <- badgeMinterRef.mintBadge(
            recipient: self.userAddress,
            asset: position.asset,
            leverage: position.leverage,
            depositAmount: position.depositAmount,
            openTimestamp: position.openTimestamp,
            returnPct: returnPct,
            shieldType: position.shieldType
        )

        // Store badge
        let badgeCollection = getAccount(self.userAddress).storage.borrow<&BadgeMinter.Collection>(
            from: BadgeMinter.CollectionStoragePath
        ) ?? panic("Could not borrow badge collection")
        badgeCollection.deposit(token: <-badge)

        // Update pet XP on position close
        if let petCollection = getAccount(self.userAddress).storage.borrow<&VaultPet.Collection>(
            from: VaultPet.CollectionStoragePath
        ) {
            let petIDs = petCollection.getIDs()
            if petIDs.length > 0 {
                if let pet = petCollection.borrowVaultPet(petIDs[0]) {
                    pet.addXP(amount: 75)
                    pet.equipShield(shieldType: "")
                }
            }
        }

        // Burn the position NFT
        let closedPosition <- shieldCollection.withdraw(withdrawID: positionId)
        destroy closedPosition
    }
}
