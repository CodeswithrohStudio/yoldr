import VaultPet from 0x8401ed4fc6788c8a

access(all) struct PetInfo {
    access(all) let id: UInt64
    access(all) let petType: String
    access(all) let level: UInt64
    access(all) let xp: UInt64
    access(all) let health: UFix64
    access(all) let currentSkin: String
    access(all) let shieldType: String
    access(all) let isAnimated: Bool

    init(id: UInt64, petType: String, level: UInt64, xp: UInt64,
         health: UFix64, currentSkin: String, shieldType: String, isAnimated: Bool) {
        self.id = id
        self.petType = petType
        self.level = level
        self.xp = xp
        self.health = health
        self.currentSkin = currentSkin
        self.shieldType = shieldType
        self.isAnimated = isAnimated
    }
}

// Scripts use public capabilities — cannot access storage directly
access(all) fun main(user: Address): PetInfo? {
    if let collection = getAccount(user).capabilities.borrow<&VaultPet.Collection>(VaultPet.CollectionPublicPath) {
        let ids = collection.getIDs()
        if ids.length > 0 {
            if let pet = collection.borrowVaultPet(ids[0]) {
                return PetInfo(id: pet.id, petType: pet.petType, level: pet.level, xp: pet.xp,
                    health: pet.health, currentSkin: pet.currentSkin, shieldType: pet.shieldType,
                    isAnimated: pet.isAnimated)
            }
        }
    }
    return nil
}
