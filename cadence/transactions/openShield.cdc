import ShieldPosition from 0x8401ed4fc6788c8a
import Yoldr from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a

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

        // Harvest accrued yield to use as margin
        // All storage access MUST happen in prepare — execute block cannot call storage.borrow
        let yieldAmount = Yoldr.harvestYield(user: self.userAddress)
        let marginAmount = yieldAmount > 0.0 ? yieldAmount : 1.0

        // Borrow the ShieldPosition minter via public capability
        let minterRef = getAccount(0x8401ed4fc6788c8a)
            .capabilities.borrow<&{ShieldPosition.MinterPublic}>(/public/shieldPositionMinter)
            ?? panic("Could not borrow ShieldPosition minter — run setupMinters.cdc first")

        let position <- minterRef.openShield(
            user: self.userAddress,
            shieldType: shieldType,
            depositAmount: marginAmount
        )

        // Update Vault Pet if one exists
        if let petCollection = signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath) {
            let petIDs = petCollection.getIDs()
            if petIDs.length > 0 {
                if let pet = petCollection.borrowVaultPet(petIDs[0]) {
                    pet.equipShield(shieldType: shieldType)
                    pet.addXP(amount: 50)
                }
            }
        }

        // Deposit position NFT into user's collection
        let collectionRef = signer.storage.borrow<&ShieldPosition.Collection>(from: ShieldPosition.CollectionStoragePath)
            ?? panic("Could not borrow shield collection")
        collectionRef.deposit(token: <-position)
    }

    execute {}
}
