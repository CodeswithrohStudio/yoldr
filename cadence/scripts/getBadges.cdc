import BadgeMinter from 0x8401ed4fc6788c8a

access(all) struct BadgeInfo {
    access(all) let id: UInt64
    access(all) let asset: String
    access(all) let leverage: UFix64
    access(all) let depositAmount: UFix64
    access(all) let openTimestamp: UFix64
    access(all) let closeTimestamp: UFix64
    access(all) let returnPct: Fix64
    access(all) let isRare: Bool
    access(all) let shieldType: String

    init(id: UInt64, asset: String, leverage: UFix64, depositAmount: UFix64,
         openTimestamp: UFix64, closeTimestamp: UFix64, returnPct: Fix64,
         isRare: Bool, shieldType: String) {
        self.id = id
        self.asset = asset
        self.leverage = leverage
        self.depositAmount = depositAmount
        self.openTimestamp = openTimestamp
        self.closeTimestamp = closeTimestamp
        self.returnPct = returnPct
        self.isRare = isRare
        self.shieldType = shieldType
    }
}

// Scripts use public capabilities — cannot access storage directly
access(all) fun main(user: Address): [BadgeInfo] {
    let badges: [BadgeInfo] = []
    if let collection = getAccount(user).capabilities.borrow<&BadgeMinter.Collection>(BadgeMinter.CollectionPublicPath) {
        for id in collection.getIDs() {
            if let badge = collection.borrowBadge(id) {
                badges.append(BadgeInfo(id: badge.id, asset: badge.asset, leverage: badge.leverage,
                    depositAmount: badge.depositAmount, openTimestamp: badge.openTimestamp,
                    closeTimestamp: badge.closeTimestamp, returnPct: badge.returnPct,
                    isRare: badge.isRare, shieldType: badge.shieldType))
            }
        }
    }
    return badges
}
