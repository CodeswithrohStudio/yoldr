import NonFungibleToken from 0x631e88ae7f1d7c20
import ShieldPosition from 0x8401ed4fc6788c8a
import BadgeMinter from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a
import MockPriceFeed from 0x8401ed4fc6788c8a

transaction(positionId: UInt64) {
    let userAddress: Address

    prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        self.userAddress = signer.address

        // Setup badge collection if not already present
        if signer.storage.borrow<&BadgeMinter.Collection>(from: BadgeMinter.CollectionStoragePath) == nil {
            let collection <- BadgeMinter.createEmptyCollection(nftType: Type<@BadgeMinter.NFT>())
            signer.storage.save(<-collection, to: BadgeMinter.CollectionStoragePath)
            let cap = signer.capabilities.storage.issue<&BadgeMinter.Collection>(BadgeMinter.CollectionStoragePath)
            signer.capabilities.publish(cap, at: BadgeMinter.CollectionPublicPath)
        }

        // All storage access MUST happen in prepare — execute block cannot call storage.borrow
        // Borrow the shield collection with Withdraw entitlement (needed to remove position)
        let shieldCollection = signer.storage.borrow<auth(NonFungibleToken.Withdraw) &ShieldPosition.Collection>(
            from: ShieldPosition.CollectionStoragePath
        ) ?? panic("Could not borrow shield collection")

        let position = shieldCollection.borrowShieldPosition(positionId)
            ?? panic("Position not found")

        // Calculate current P&L
        let currentPrice = MockPriceFeed.getPrice(asset: position.asset)
        let priceChange = Fix64(currentPrice) - Fix64(position.openPrice)
        let priceChangePct = priceChange / Fix64(position.openPrice)
        let returnPct = priceChangePct * Fix64(position.leverage)

        // Borrow the BadgeMinter via public capability
        let badgeMinterRef = getAccount(0x8401ed4fc6788c8a)
            .capabilities.borrow<&{BadgeMinter.MinterPublic}>(/public/badgeMinter)
            ?? panic("Could not borrow BadgeMinter — run setupMinters.cdc first")

        let badge <- badgeMinterRef.mintBadge(
            recipient: self.userAddress,
            asset: position.asset,
            leverage: position.leverage,
            depositAmount: position.depositAmount,
            openTimestamp: position.openTimestamp,
            returnPct: returnPct,
            shieldType: position.shieldType
        )

        // Store badge in user's collection
        let badgeCollection = signer.storage.borrow<&BadgeMinter.Collection>(from: BadgeMinter.CollectionStoragePath)
            ?? panic("Could not borrow badge collection")
        badgeCollection.deposit(token: <-badge)

        // Award XP to pet and unequip shield
        if let petCollection = signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath) {
            let petIDs = petCollection.getIDs()
            if petIDs.length > 0 {
                if let pet = petCollection.borrowVaultPet(petIDs[0]) {
                    pet.addXP(amount: 75)
                    pet.equipShield(shieldType: "")
                }
            }
        }

        // Burn the closed position NFT
        let closedPosition <- shieldCollection.withdraw(withdrawID: positionId)
        destroy closedPosition
    }

    execute {}
}
