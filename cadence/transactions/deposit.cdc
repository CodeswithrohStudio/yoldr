import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import Yoldr from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a

transaction(amount: UFix64, petType: String) {
    let payment: @{FungibleToken.Vault}
    let userAddress: Address

    prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        self.userAddress = signer.address

        // Withdraw from user's FLOW vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow flow token vault")
        self.payment <- vaultRef.withdraw(amount: amount)

        // Setup VaultPet collection if not already present
        if signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath) == nil {
            let collection <- VaultPet.createEmptyCollection(nftType: Type<@VaultPet.NFT>())
            signer.storage.save(<-collection, to: VaultPet.CollectionStoragePath)
            let cap = signer.capabilities.storage.issue<&VaultPet.Collection>(VaultPet.CollectionStoragePath)
            signer.capabilities.publish(cap, at: VaultPet.CollectionPublicPath)
        }

        // Mint a Vault Pet if user doesn't have one yet
        // All storage access MUST happen in prepare — execute block cannot call storage.borrow
        let collectionRef = signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath)
            ?? panic("Could not borrow pet collection")

        if collectionRef.getLength() == 0 {
            // Borrow the minter via public capability (contract account 0x8401ed4fc6788c8a)
            let minterRef = getAccount(0x8401ed4fc6788c8a)
                .capabilities.borrow<&{VaultPet.MinterPublic}>(/public/vaultPetMinter)
                ?? panic("Could not borrow VaultPet minter — run setupMinters.cdc first")
            let pet <- minterRef.mintPet(recipient: self.userAddress, petType: petType)
            collectionRef.deposit(token: <-pet)
        }
    }

    execute {
        // Deposit principal into the Yoldr vault
        Yoldr.deposit(payment: <-self.payment, user: self.userAddress)
    }
}
