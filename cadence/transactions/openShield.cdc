import ShieldPosition from 0x8401ed4fc6788c8a
import Yoldr from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a

transaction(shieldType: String) {
    let userAddress: Address

    prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        self.userAddress = signer.address

        // Setup ShieldPosition collection if needed
        if signer.storage.borrow<&ShieldPosition.Collection>(from: ShieldPosition.CollectionStoragePath) == nil {
            let collection <- ShieldPosition.createEmptyCollection(nftType: Type<@ShieldPosition.NFT>())
            signer.storage.save(<-collection, to: ShieldPosition.CollectionStoragePath)
            let cap = signer.capabilities.storage.issue<&ShieldPosition.Collection>(ShieldPosition.CollectionStoragePath)
            signer.capabilities.publish(cap, at: ShieldPosition.CollectionPublicPath)
        }
    }

    execute {
        // Harvest current yield to use as margin
        let yieldAmount = Yoldr.harvestYield(user: self.userAddress)
        let marginAmount = yieldAmount > 0.0 ? yieldAmount : 1.0 // Minimum 1 FLOW for demo

        // Mint the shield position NFT
        let minterRef = getAccount(0x8401ed4fc6788c8a).storage.borrow<&ShieldPosition.Minter>(
            from: ShieldPosition.MinterStoragePath
        ) ?? panic("Could not borrow shield minter")

        let position <- minterRef.openShield(
            user: self.userAddress,
            shieldType: shieldType,
            depositAmount: marginAmount
        )

        // Store position in user's collection
        let collectionRef = getAccount(self.userAddress).storage.borrow<&ShieldPosition.Collection>(
            from: ShieldPosition.CollectionStoragePath
        ) ?? panic("Could not borrow shield collection")

        // Update pet to equip shield
        if let petCollection = getAccount(self.userAddress).storage.borrow<&VaultPet.Collection>(
            from: VaultPet.CollectionStoragePath
        ) {
            let petIDs = petCollection.getIDs()
            if petIDs.length > 0 {
                if let pet = petCollection.borrowVaultPet(petIDs[0]) {
                    pet.equipShield(shieldType: shieldType)
                    pet.addXP(amount: 50)
                }
            }
        }

        collectionRef.deposit(token: <-position)
    }
}
