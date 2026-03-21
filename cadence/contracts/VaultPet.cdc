import NonFungibleToken from 0x631e88ae7f1d7c20

access(all) contract VaultPet: NonFungibleToken {

    // Events
    access(all) event PetCreated(id: UInt64, owner: Address, petType: String)
    access(all) event PetLeveledUp(id: UInt64, newLevel: UInt64, xp: UInt64)
    access(all) event PetHealthUpdated(id: UInt64, health: UFix64)
    access(all) event PetEvolved(id: UInt64, newSkin: String)

    // NFT standard events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    // Storage paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    // MinterPublicPath is /public/vaultPetMinter — published via setupMinters.cdc admin transaction

    access(all) var totalSupply: UInt64

    // XP thresholds for levels
    access(all) let XP_PER_LEVEL: UInt64

    // Public minter interface — callable via capabilities in execute blocks
    access(all) resource interface MinterPublic {
        access(all) fun mintPet(recipient: Address, petType: String): @VaultPet.NFT
    }

    // Pet NFT resource
    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let petType: String      // "Griffin", "Dragon", "Phoenix", "Narwhal"
        access(all) var level: UInt64
        access(all) var xp: UInt64
        access(all) var health: UFix64       // 0.0 to 1.0
        access(all) var currentSkin: String  // "base", "silver", "gold", "legendary"
        access(all) var shieldType: String   // Current shield equipped
        access(all) var isAnimated: Bool

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- VaultPet.createEmptyCollection(nftType: Type<@VaultPet.NFT>())
        }

        access(all) view fun getViews(): [Type] {
            return []
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            return nil
        }

        access(all) fun addXP(amount: UInt64) {
            self.xp = self.xp + amount
            let newLevel = (self.xp / VaultPet.XP_PER_LEVEL) + 1
            if newLevel > self.level {
                self.level = newLevel
                emit PetLeveledUp(id: self.id, newLevel: newLevel, xp: self.xp)

                if self.level >= 10 && self.currentSkin == "base" {
                    self.currentSkin = "silver"
                    emit PetEvolved(id: self.id, newSkin: "silver")
                } else if self.level >= 25 && self.currentSkin == "silver" {
                    self.currentSkin = "gold"
                    emit PetEvolved(id: self.id, newSkin: "gold")
                } else if self.level >= 50 && self.currentSkin == "gold" {
                    self.currentSkin = "legendary"
                    emit PetEvolved(id: self.id, newSkin: "legendary")
                }
            }
        }

        access(all) fun updateHealth(newHealth: UFix64) {
            self.health = newHealth
            self.isAnimated = newHealth > 0.5
            emit PetHealthUpdated(id: self.id, health: newHealth)
        }

        access(all) fun equipShield(shieldType: String) {
            self.shieldType = shieldType
        }

        init(id: UInt64, petType: String) {
            self.id = id
            self.petType = petType
            self.level = 1
            self.xp = 0
            self.health = 1.0
            self.currentSkin = "base"
            self.shieldType = ""
            self.isAnimated = true
        }
    }

    // Collection
    access(all) resource Collection: NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @VaultPet.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun getLength(): Int {
            return self.ownedNFTs.length
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id]
        }

        access(all) fun borrowVaultPet(_ id: UInt64): &VaultPet.NFT? {
            if let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return ref as? &VaultPet.NFT
            }
            return nil
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@VaultPet.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@VaultPet.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- VaultPet.createEmptyCollection(nftType: Type<@VaultPet.NFT>())
        }

        init() {
            self.ownedNFTs <- {}
        }
    }

    // Minter — implements MinterPublic so it can be published as a capability
    access(all) resource Minter: MinterPublic {
        access(all) fun mintPet(recipient: Address, petType: String): @VaultPet.NFT {
            VaultPet.totalSupply = VaultPet.totalSupply + 1
            let nft <- create NFT(id: VaultPet.totalSupply, petType: petType)
            emit PetCreated(id: nft.id, owner: recipient, petType: petType)
            return <-nft
        }
    }

    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return []
    }

    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        return nil
    }

    init() {
        self.totalSupply = 0
        self.XP_PER_LEVEL = 100
        self.CollectionStoragePath = /storage/vaultPetCollection
        self.CollectionPublicPath = /public/vaultPetCollection
        self.MinterStoragePath = /storage/vaultPetMinter

        let minter <- create Minter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
        // Capability published separately via setupMinters.cdc admin transaction at /public/vaultPetMinter

        emit ContractInitialized()
    }
}
