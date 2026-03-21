import NonFungibleToken from 0x631e88ae7f1d7c20

access(all) contract BadgeMinter: NonFungibleToken {

    // Events
    access(all) event BadgeMinted(id: UInt64, owner: Address, asset: String, leverage: UFix64, returnPct: Fix64, isRare: Bool)
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    // MinterPublicPath is /public/badgeMinter — published via setupMinters.cdc admin transaction

    access(all) var totalSupply: UInt64

    // Public minter interface — callable via capabilities in execute blocks
    access(all) resource interface MinterPublic {
        access(all) fun mintBadge(
            recipient: Address,
            asset: String,
            leverage: UFix64,
            depositAmount: UFix64,
            openTimestamp: UFix64,
            returnPct: Fix64,
            shieldType: String
        ): @BadgeMinter.NFT
    }

    // Shield Badge NFT
    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let asset: String
        access(all) let leverage: UFix64
        access(all) let depositAmount: UFix64
        access(all) let openTimestamp: UFix64
        access(all) let closeTimestamp: UFix64
        access(all) let returnPct: Fix64
        access(all) let isRare: Bool
        access(all) let shieldType: String

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- BadgeMinter.createEmptyCollection(nftType: Type<@BadgeMinter.NFT>())
        }

        access(all) view fun getViews(): [Type] {
            return []
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            return nil
        }

        init(
            id: UInt64,
            asset: String,
            leverage: UFix64,
            depositAmount: UFix64,
            openTimestamp: UFix64,
            closeTimestamp: UFix64,
            returnPct: Fix64,
            shieldType: String
        ) {
            self.id = id
            self.asset = asset
            self.leverage = leverage
            self.depositAmount = depositAmount
            self.openTimestamp = openTimestamp
            self.closeTimestamp = closeTimestamp
            self.returnPct = returnPct
            self.isRare = returnPct > Fix64(0.20)
            self.shieldType = shieldType
        }
    }

    access(all) resource Collection: NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @BadgeMinter.NFT
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

        access(all) fun borrowBadge(_ id: UInt64): &BadgeMinter.NFT? {
            if let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return ref as? &BadgeMinter.NFT
            }
            return nil
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@BadgeMinter.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@BadgeMinter.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- BadgeMinter.createEmptyCollection(nftType: Type<@BadgeMinter.NFT>())
        }

        init() {
            self.ownedNFTs <- {}
        }
    }

    // Minter — implements MinterPublic so it can be published as a capability
    access(all) resource Minter: MinterPublic {
        access(all) fun mintBadge(
            recipient: Address,
            asset: String,
            leverage: UFix64,
            depositAmount: UFix64,
            openTimestamp: UFix64,
            returnPct: Fix64,
            shieldType: String
        ): @BadgeMinter.NFT {
            BadgeMinter.totalSupply = BadgeMinter.totalSupply + 1
            let badge <- create NFT(
                id: BadgeMinter.totalSupply,
                asset: asset,
                leverage: leverage,
                depositAmount: depositAmount,
                openTimestamp: openTimestamp,
                closeTimestamp: getCurrentBlock().timestamp,
                returnPct: returnPct,
                shieldType: shieldType
            )
            emit BadgeMinted(
                id: badge.id,
                owner: recipient,
                asset: asset,
                leverage: leverage,
                returnPct: returnPct,
                isRare: badge.isRare
            )
            return <-badge
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
        self.CollectionStoragePath = /storage/badgeCollection
        self.CollectionPublicPath = /public/badgeCollection
        self.MinterStoragePath = /storage/badgeMinter

        let minter <- create Minter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
        // Capability published separately via setupMinters.cdc admin transaction at /public/badgeMinter

        emit ContractInitialized()
    }
}
