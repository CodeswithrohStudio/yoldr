import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract Yoldr {

    // Events
    access(all) event Deposited(user: Address, amount: UFix64, timestamp: UFix64)
    access(all) event Withdrawn(user: Address, amount: UFix64, yieldEarned: UFix64, timestamp: UFix64)
    access(all) event YieldHarvested(user: Address, yieldAmount: UFix64, timestamp: UFix64)
    access(all) event RebalanceComplete(timestamp: UFix64, totalUsers: Int)

    // Storage paths
    access(all) let AdminStoragePath: StoragePath

    // Simulated APY: 5% per year for testnet
    access(all) let SIMULATED_APY: UFix64

    // Vault state per user - using full constructor to avoid direct field assignment
    access(all) struct VaultState {
        access(all) let principal: UFix64
        access(all) let depositTimestamp: UFix64
        access(all) let yieldBalance: UFix64
        access(all) let lastHarvestTimestamp: UFix64
        access(all) let totalYieldEarned: UFix64
        access(all) let streakCount: UInt64
        access(all) let lastStreakPing: UFix64
        access(all) let xpPoints: UInt64

        init(
            principal: UFix64,
            depositTimestamp: UFix64,
            yieldBalance: UFix64,
            lastHarvestTimestamp: UFix64,
            totalYieldEarned: UFix64,
            streakCount: UInt64,
            lastStreakPing: UFix64,
            xpPoints: UInt64
        ) {
            self.principal = principal
            self.depositTimestamp = depositTimestamp
            self.yieldBalance = yieldBalance
            self.lastHarvestTimestamp = lastHarvestTimestamp
            self.totalYieldEarned = totalYieldEarned
            self.streakCount = streakCount
            self.lastStreakPing = lastStreakPing
            self.xpPoints = xpPoints
        }
    }

    // Global vault storage
    access(all) var vaults: {Address: VaultState}
    access(all) var totalDeposited: UFix64
    access(all) var lastRebalanceTimestamp: UFix64

    // Admin resource
    access(all) resource Admin {
        access(all) fun forceRebalance() {
            Yoldr.rebalanceAll()
        }

        access(all) fun updateStreak(user: Address) {
            if let vault = Yoldr.vaults[user] {
                let now = getCurrentBlock().timestamp
                let dayInSeconds: UFix64 = 86400.0
                if now - vault.lastStreakPing >= dayInSeconds {
                    let updatedVault = VaultState(
                        principal: vault.principal,
                        depositTimestamp: vault.depositTimestamp,
                        yieldBalance: vault.yieldBalance,
                        lastHarvestTimestamp: vault.lastHarvestTimestamp,
                        totalYieldEarned: vault.totalYieldEarned,
                        streakCount: vault.streakCount + 1,
                        lastStreakPing: now,
                        xpPoints: vault.xpPoints + 10
                    )
                    Yoldr.vaults[user] = updatedVault
                }
            }
        }
    }

    // Calculate accrued yield using simple interest (testnet simulation)
    access(all) fun calculateAccruedYield(principal: UFix64, lastHarvest: UFix64, now: UFix64): UFix64 {
        if now <= lastHarvest { return 0.0 }
        let elapsed = now - lastHarvest
        let yearInSeconds: UFix64 = 31536000.0
        let yieldRate = self.SIMULATED_APY / yearInSeconds
        return principal * yieldRate * elapsed
    }

    // Public deposit function
    access(all) fun deposit(payment: @{FungibleToken.Vault}, user: Address) {
        let amount = payment.balance
        let now = getCurrentBlock().timestamp

        let receiverRef = self.account.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow flow token receiver")
        receiverRef.deposit(from: <-payment)

        if let existingVault = self.vaults[user] {
            let accruedYield = self.calculateAccruedYield(
                principal: existingVault.principal,
                lastHarvest: existingVault.lastHarvestTimestamp,
                now: now
            )
            let updatedVault = VaultState(
                principal: existingVault.principal + amount,
                depositTimestamp: existingVault.depositTimestamp,
                yieldBalance: existingVault.yieldBalance + accruedYield,
                lastHarvestTimestamp: now,
                totalYieldEarned: existingVault.totalYieldEarned + accruedYield,
                streakCount: existingVault.streakCount,
                lastStreakPing: existingVault.lastStreakPing,
                xpPoints: existingVault.xpPoints + 50
            )
            self.vaults[user] = updatedVault
        } else {
            let newVault = VaultState(
                principal: amount,
                depositTimestamp: now,
                yieldBalance: 0.0,
                lastHarvestTimestamp: now,
                totalYieldEarned: 0.0,
                streakCount: 0,
                lastStreakPing: now,
                xpPoints: 100
            )
            self.vaults[user] = newVault
        }

        self.totalDeposited = self.totalDeposited + amount
        emit Deposited(user: user, amount: amount, timestamp: now)
    }

    // Withdraw with principal guarantee
    access(all) fun withdraw(user: Address, amount: UFix64): @{FungibleToken.Vault} {
        let now = getCurrentBlock().timestamp
        let vault = self.vaults[user] ?? panic("No vault found for user")
        assert(amount <= vault.principal, message: "Cannot withdraw more than principal")

        let accruedYield = self.calculateAccruedYield(
            principal: vault.principal,
            lastHarvest: vault.lastHarvestTimestamp,
            now: now
        )
        let totalYield = vault.yieldBalance + accruedYield

        let updatedVault = VaultState(
            principal: vault.principal - amount,
            depositTimestamp: vault.depositTimestamp,
            yieldBalance: totalYield,
            lastHarvestTimestamp: now,
            totalYieldEarned: vault.totalYieldEarned + accruedYield,
            streakCount: vault.streakCount,
            lastStreakPing: vault.lastStreakPing,
            xpPoints: vault.xpPoints
        )
        self.vaults[user] = updatedVault
        self.totalDeposited = self.totalDeposited - amount

        emit Withdrawn(user: user, amount: amount, yieldEarned: totalYield, timestamp: now)

        let contractVaultRef = self.account.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow contract flow vault")

        return <- contractVaultRef.withdraw(amount: amount)
    }

    // Harvest yield
    access(all) fun harvestYield(user: Address): UFix64 {
        let now = getCurrentBlock().timestamp
        let vault = self.vaults[user] ?? panic("No vault found for user")

        let accruedYield = self.calculateAccruedYield(
            principal: vault.principal,
            lastHarvest: vault.lastHarvestTimestamp,
            now: now
        )
        let totalYield = vault.yieldBalance + accruedYield

        let updatedVault = VaultState(
            principal: vault.principal,
            depositTimestamp: vault.depositTimestamp,
            yieldBalance: 0.0,
            lastHarvestTimestamp: now,
            totalYieldEarned: vault.totalYieldEarned + accruedYield,
            streakCount: vault.streakCount,
            lastStreakPing: vault.lastStreakPing,
            xpPoints: vault.xpPoints
        )
        self.vaults[user] = updatedVault

        emit YieldHarvested(user: user, yieldAmount: totalYield, timestamp: now)
        return totalYield
    }

    // Internal rebalance function
    access(all) fun rebalanceAll() {
        let now = getCurrentBlock().timestamp
        let userCount = self.vaults.keys.length

        for user in self.vaults.keys {
            if let vault = self.vaults[user] {
                let accruedYield = self.calculateAccruedYield(
                    principal: vault.principal,
                    lastHarvest: vault.lastHarvestTimestamp,
                    now: now
                )
                let updatedVault = VaultState(
                    principal: vault.principal,
                    depositTimestamp: vault.depositTimestamp,
                    yieldBalance: vault.yieldBalance + accruedYield,
                    lastHarvestTimestamp: now,
                    totalYieldEarned: vault.totalYieldEarned + accruedYield,
                    streakCount: vault.streakCount,
                    lastStreakPing: vault.lastStreakPing,
                    xpPoints: vault.xpPoints
                )
                self.vaults[user] = updatedVault
            }
        }

        self.lastRebalanceTimestamp = now
        emit RebalanceComplete(timestamp: now, totalUsers: userCount)
    }

    // Getters
    access(all) fun getVaultState(user: Address): VaultState? {
        return self.vaults[user]
    }

    access(all) fun getTotalDeposited(): UFix64 {
        return self.totalDeposited
    }

    access(all) fun getAccruedYield(user: Address): UFix64 {
        let now = getCurrentBlock().timestamp
        if let vault = self.vaults[user] {
            return self.calculateAccruedYield(
                principal: vault.principal,
                lastHarvest: vault.lastHarvestTimestamp,
                now: now
            ) + vault.yieldBalance
        }
        return 0.0
    }

    init() {
        self.AdminStoragePath = /storage/yoldrAdmin
        self.SIMULATED_APY = 0.05
        self.vaults = {}
        self.totalDeposited = 0.0
        self.lastRebalanceTimestamp = getCurrentBlock().timestamp

        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
    }
}
