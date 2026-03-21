access(all) contract MockPriceFeed {

    // Events
    access(all) event PriceUpdated(asset: String, price: UFix64, timestamp: UFix64)

    // Admin resource for updating prices
    access(all) resource Admin {
        access(all) fun updatePrice(asset: String, price: UFix64) {
            MockPriceFeed.prices[asset] = price
            emit PriceUpdated(asset: asset, price: price, timestamp: getCurrentBlock().timestamp)
        }
    }

    // Storage paths
    access(all) let AdminStoragePath: StoragePath

    // Price storage
    access(all) var prices: {String: UFix64}

    // Initialize with default testnet prices
    init() {
        self.AdminStoragePath = /storage/mockPriceFeedAdmin
        self.prices = {
            "GOLD": 2650.00,
            "BTC": 67500.00,
            "ETH": 3200.00,
            "FLOW": 0.85
        }

        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
    }

    // Public getter for prices
    access(all) fun getPrice(asset: String): UFix64 {
        return self.prices[asset] ?? 0.0
    }

    access(all) fun getAllPrices(): {String: UFix64} {
        return self.prices
    }
}
