import ShieldPosition from 0x8401ed4fc6788c8a
import Yoldr from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a
import BadgeMinter from 0x8401ed4fc6788c8a

transaction(shieldType: String) {
    let userAddress: Address

    prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        self.userAddress = signer.address

        // Setup ShieldPosition collection if not already present
        if signer.storage.borrow<&ShieldPosition.Collection>(from: ShieldPosition.CollectionStoragePath) == nil {
            let collection <- ShieldPosition.createEmptyCollection(nftType: Type<@ShieldPosition.NFT>())
            signer.storage.save(<-collection, to: ShieldPosition.CollectionStoragePath)
            let cap = signer.capabilities.storage.issue<&ShieldPosition.Collection>(ShieldPosition.CollectionStoragePath)
            signer.capabilities.publish(cap, at: ShieldPosition.CollectionPublicPath)
        }

        // Setup BadgeMinter collection if not already present
        if signer.storage.borrow<&BadgeMinter.Collection>(from: BadgeMinter.CollectionStoragePath) == nil {
            let badgeCollection <- BadgeMinter.createEmptyCollection(nftType: Type<@BadgeMinter.NFT>())
            signer.storage.save(<-badgeCollection, to: BadgeMinter.CollectionStoragePath)
            let badgeCap = signer.capabilities.storage.issue<&BadgeMinter.Collection>(BadgeMinter.CollectionStoragePath)
            signer.capabilities.publish(badgeCap, at: BadgeMinter.CollectionPublicPath)
        }

        // Harvest accrued yield to use as margin
        // All storage access MUST happen in prepare — execute block cannot call storage.borrow
        let yieldAmount = Yoldr.harvestYield(user: self.userAddress)
        let marginAmount = yieldAmount > 0.0 ? yieldAmount : 1.0

        // Borrow the ShieldPosition minter via public capability
        let minterRef = getAccount(0x8401ed4fc6788c8a)
            .capabilities.borrow<&{ShieldPosition.MinterPublic}>(/public/shieldPositionMinter)
            ?? panic("Could not borrow ShieldPosition minter — run setupMinters.cdc first")

        let config = ShieldPosition.SHIELDS[shieldType]
            ?? panic("Unknown shield type")

        let position <- minterRef.openShield(
            user: self.userAddress,
            shieldType: shieldType,
            depositAmount: marginAmount
        )

        let openTimestamp = getCurrentBlock().timestamp

        // Update Vault Pet if one exists
        if let petCollection = signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath) {
            let petIDs = petCollection.getIDs()
            if petIDs.length > 0 {
                if let pet = petCollection.borrowVaultPet(petIDs[0]) {
                    pet.equipShield(shieldType: shieldType)
                    // VRF Lucky Roll — Flow native randomness, no oracle needed
                    let rand = revertibleRandom<UInt64>() % 3
                    let xpBonus: UInt64 = rand == 0 ? 50 : (rand == 1 ? 100 : 150)
                    pet.addXP(amount: xpBonus)
                }
            }
        }

        // Deposit position NFT into user's collection
        let collectionRef = signer.storage.borrow<&ShieldPosition.Collection>(from: ShieldPosition.CollectionStoragePath)
            ?? panic("Could not borrow shield collection")
        collectionRef.deposit(token: <-position)

        // Mint "Shield Activated" opener badge NFT
        let badgeMinterRef = getAccount(0x8401ed4fc6788c8a)
            .capabilities.borrow<&{BadgeMinter.MinterPublic}>(/public/badgeMinter)
            ?? panic("Could not borrow BadgeMinter capability")

        let badge <- badgeMinterRef.mintOpenBadge(
            recipient: self.userAddress,
            asset: config.asset,
            leverage: config.leverage,
            depositAmount: marginAmount,
            openTimestamp: openTimestamp,
            shieldType: shieldType
        )

        let badgeCollectionRef = signer.storage.borrow<&BadgeMinter.Collection>(from: BadgeMinter.CollectionStoragePath)
            ?? panic("Could not borrow badge collection")
        badgeCollectionRef.deposit(token: <-badge)
    }

    execute {}
}
