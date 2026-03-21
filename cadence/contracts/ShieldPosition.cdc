import NonFungibleToken from 0x631e88ae7f1d7c20
import MockPriceFeed from 0x8401ed4fc6788c8a

access(all) contract ShieldPosition: NonFungibleToken {

    // Events
    access(all) event ShieldOpened(id: UInt64, user: Address, asset: String, leverage: UFix64, depositAmount: UFix64, openPrice: UFix64)
    access(all) event ShieldClosed(id: UInt64, user: Address, pnl: Fix64, returnPct: Fix64)
    access(all) event PositionHealthUpdated(id: UInt64, health: UFix64)

    // NFT standard events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    // Storage paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) var totalSupply: UInt64

    // Shield types mapping
    access(all) let SHIELDS: {String: ShieldConfig}

    access(all) struct ShieldConfig {
        access(all) let asset: String
        access(all) let leverage: UFix64
        access(all) let expectedAPY: UFix64
        access(all) let petType: String
        access(all) let emoji: String

        init(asset: String, leverage: UFix64, expectedAPY: UFix64, petType: String, emoji: String) {
            self.asset = asset
            self.leverage = leverage
            self.expectedAPY = expectedAPY
            self.petType = petType
            self.emoji = emoji
        }
    }

    // NFT resource representing an open position
    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let shieldType: String
        access(all) let asset: String
        access(all) let leverage: UFix64
        access(all) let depositAmount: UFix64
        access(all) let openTimestamp: UFix64
        access(all) let openPrice: UFix64
        access(all) var currentPnL: Fix64
        access(all) var positionHealth: UFix64
        access(all) var isOpen: Bool

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- ShieldPosition.createEmptyCollection(nftType: Type<@ShieldPosition.NFT>())
        }

        access(all) view fun getViews(): [Type] {
            return []
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            return nil
        }

        access(all) fun updatePnL(currentPrice: UFix64) {
            let priceChange = Fix64(currentPrice) - Fix64(self.openPrice)
            let priceChangePct = priceChange / Fix64(self.openPrice)
            let leveragedPct = priceChangePct * Fix64(self.leverage)
            self.currentPnL = Fix64(self.depositAmount) * leveragedPct

            if self.currentPnL >= 0.0 {
                self.positionHealth = 1.0
            } else {
                let loss = UFix64(-self.currentPnL)
                if loss >= self.depositAmount {
                    self.positionHealth = 0.0
                } else {
                    self.positionHealth = (self.depositAmount - loss) / self.depositAmount
                }
            }
        }

        init(
            id: UInt64,
            shieldType: String,
            asset: String,
            leverage: UFix64,
            depositAmount: UFix64,
            openPrice: UFix64
        ) {
            self.id = id
            self.shieldType = shieldType
            self.asset = asset
            self.leverage = leverage
            self.depositAmount = depositAmount
            self.openTimestamp = getCurrentBlock().timestamp
            self.openPrice = openPrice
            self.currentPnL = 0.0
            self.positionHealth = 1.0
            self.isOpen = true
        }
    }

    // Collection resource
    access(all) resource Collection: NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @ShieldPosition.NFT
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

        access(all) fun borrowShieldPosition(_ id: UInt64): &ShieldPosition.NFT? {
            if let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return ref as? &ShieldPosition.NFT
            }
            return nil
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@ShieldPosition.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@ShieldPosition.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- ShieldPosition.createEmptyCollection(nftType: Type<@ShieldPosition.NFT>())
        }

        init() {
            self.ownedNFTs <- {}
        }
    }

    // Minter resource
    access(all) resource Minter {
        access(all) fun openShield(
            user: Address,
            shieldType: String,
            depositAmount: UFix64
        ): @NFT {
            let config = ShieldPosition.SHIELDS[shieldType]
                ?? panic("Invalid shield type")

            let currentPrice = MockPriceFeed.getPrice(asset: config.asset)

            ShieldPosition.totalSupply = ShieldPosition.totalSupply + 1
            let id = ShieldPosition.totalSupply

            let nft <- create NFT(
                id: id,
                shieldType: shieldType,
                asset: config.asset,
                leverage: config.leverage,
                depositAmount: depositAmount,
                openPrice: currentPrice
            )

            emit ShieldOpened(
                id: id,
                user: user,
                asset: config.asset,
                leverage: config.leverage,
                depositAmount: depositAmount,
                openPrice: currentPrice
            )

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
        self.CollectionStoragePath = /storage/shieldPositionCollection
        self.CollectionPublicPath = /public/shieldPositionCollection
        self.MinterStoragePath = /storage/shieldPositionMinter

        self.SHIELDS = {
            "GOLD_GUARDIAN": ShieldConfig(asset: "GOLD", leverage: 5.0, expectedAPY: 0.058, petType: "Griffin", emoji: "lion"),
            "CRYPTO_CRUISER": ShieldConfig(asset: "BTC", leverage: 1.0, expectedAPY: 0.30, petType: "Dragon", emoji: "dragon"),
            "ETHER_VOYAGER": ShieldConfig(asset: "ETH", leverage: 2.0, expectedAPY: 0.20, petType: "Phoenix", emoji: "bird"),
            "FLOW_RIDER": ShieldConfig(asset: "FLOW", leverage: 3.0, expectedAPY: 0.25, petType: "Narwhal", emoji: "fish")
        }

        let minter <- create Minter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}
