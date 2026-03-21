import Yoldr from 0x8401ed4fc6788c8a

access(all) struct VaultInfo {
    access(all) let principal: UFix64
    access(all) let yieldBalance: UFix64
    access(all) let accruedYield: UFix64
    access(all) let totalYieldEarned: UFix64
    access(all) let streakCount: UInt64
    access(all) let xpPoints: UInt64
    access(all) let depositTimestamp: UFix64
    access(all) let lastHarvestTimestamp: UFix64

    init(
        principal: UFix64,
        yieldBalance: UFix64,
        accruedYield: UFix64,
        totalYieldEarned: UFix64,
        streakCount: UInt64,
        xpPoints: UInt64,
        depositTimestamp: UFix64,
        lastHarvestTimestamp: UFix64
    ) {
        self.principal = principal
        self.yieldBalance = yieldBalance
        self.accruedYield = accruedYield
        self.totalYieldEarned = totalYieldEarned
        self.streakCount = streakCount
        self.xpPoints = xpPoints
        self.depositTimestamp = depositTimestamp
        self.lastHarvestTimestamp = lastHarvestTimestamp
    }
}

access(all) fun main(user: Address): VaultInfo? {
    if let vault = Yoldr.getVaultState(user: user) {
        let accruedYield = Yoldr.getAccruedYield(user: user)
        return VaultInfo(
            principal: vault.principal,
            yieldBalance: vault.yieldBalance,
            accruedYield: accruedYield,
            totalYieldEarned: vault.totalYieldEarned,
            streakCount: vault.streakCount,
            xpPoints: vault.xpPoints,
            depositTimestamp: vault.depositTimestamp,
            lastHarvestTimestamp: vault.lastHarvestTimestamp
        )
    }
    return nil
}
