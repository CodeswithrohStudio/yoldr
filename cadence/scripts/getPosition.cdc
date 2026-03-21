import ShieldPosition from 0x8401ed4fc6788c8a
import MockPriceFeed from 0x8401ed4fc6788c8a

access(all) struct PositionInfo {
    access(all) let id: UInt64
    access(all) let shieldType: String
    access(all) let asset: String
    access(all) let leverage: UFix64
    access(all) let depositAmount: UFix64
    access(all) let openTimestamp: UFix64
    access(all) let openPrice: UFix64
    access(all) let currentPrice: UFix64
    access(all) let currentPnL: Fix64
    access(all) let positionHealth: UFix64
    access(all) let returnPct: Fix64

    init(id: UInt64, shieldType: String, asset: String, leverage: UFix64,
         depositAmount: UFix64, openTimestamp: UFix64, openPrice: UFix64,
         currentPrice: UFix64, currentPnL: Fix64, positionHealth: UFix64, returnPct: Fix64) {
        self.id = id
        self.shieldType = shieldType
        self.asset = asset
        self.leverage = leverage
        self.depositAmount = depositAmount
        self.openTimestamp = openTimestamp
        self.openPrice = openPrice
        self.currentPrice = currentPrice
        self.currentPnL = currentPnL
        self.positionHealth = positionHealth
        self.returnPct = returnPct
    }
}

// Scripts use public capabilities — cannot access storage directly
access(all) fun main(user: Address): [PositionInfo] {
    let positions: [PositionInfo] = []
    if let collection = getAccount(user).capabilities.borrow<&ShieldPosition.Collection>(ShieldPosition.CollectionPublicPath) {
        for id in collection.getIDs() {
            if let pos = collection.borrowShieldPosition(id) {
                let currentPrice = MockPriceFeed.getPrice(asset: pos.asset)
                let priceChange = Fix64(currentPrice) - Fix64(pos.openPrice)
                let priceChangePct = priceChange / Fix64(pos.openPrice)
                let returnPct = priceChangePct * Fix64(pos.leverage)
                let pnl = Fix64(pos.depositAmount) * returnPct

                var health: UFix64 = 1.0
                if pnl < 0.0 {
                    let loss = UFix64(-pnl)
                    if loss >= pos.depositAmount {
                        health = 0.0
                    } else {
                        health = (pos.depositAmount - loss) / pos.depositAmount
                    }
                }

                positions.append(PositionInfo(id: id, shieldType: pos.shieldType, asset: pos.asset,
                    leverage: pos.leverage, depositAmount: pos.depositAmount,
                    openTimestamp: pos.openTimestamp, openPrice: pos.openPrice,
                    currentPrice: currentPrice, currentPnL: pnl, positionHealth: health, returnPct: returnPct))
            }
        }
    }
    return positions
}
