// One-time admin transaction: publishes all three minter resources as public capabilities
// so that user transactions can borrow them via getAccount(0x8401ed4fc6788c8a).capabilities.borrow(...)
// Run once by the contract account after deploying/updating VaultPet, ShieldPosition, BadgeMinter.
import VaultPet from 0x8401ed4fc6788c8a
import ShieldPosition from 0x8401ed4fc6788c8a
import BadgeMinter from 0x8401ed4fc6788c8a

transaction {
    prepare(signer: auth(IssueStorageCapabilityController, PublishCapability, UnpublishCapability) &Account) {

        // -- VaultPet minter at /public/vaultPetMinter --
        signer.capabilities.unpublish(/public/vaultPetMinter)
        let vaultPetCap = signer.capabilities.storage.issue<&{VaultPet.MinterPublic}>(
            VaultPet.MinterStoragePath
        )
        signer.capabilities.publish(vaultPetCap, at: /public/vaultPetMinter)

        // -- ShieldPosition minter at /public/shieldPositionMinter --
        signer.capabilities.unpublish(/public/shieldPositionMinter)
        let shieldCap = signer.capabilities.storage.issue<&{ShieldPosition.MinterPublic}>(
            ShieldPosition.MinterStoragePath
        )
        signer.capabilities.publish(shieldCap, at: /public/shieldPositionMinter)

        // -- BadgeMinter minter at /public/badgeMinter --
        signer.capabilities.unpublish(/public/badgeMinter)
        let badgeCap = signer.capabilities.storage.issue<&{BadgeMinter.MinterPublic}>(
            BadgeMinter.MinterStoragePath
        )
        signer.capabilities.publish(badgeCap, at: /public/badgeMinter)

        log("All minter capabilities published successfully")
    }
}
