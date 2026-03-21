import MockPriceFeed from 0x8401ed4fc6788c8a

access(all) fun main(): {String: UFix64} {
    return MockPriceFeed.getAllPrices()
}
