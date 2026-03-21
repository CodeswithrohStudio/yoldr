import MockPriceFeed from 0x8401ed4fc6788c8a

transaction(asset: String, price: UFix64) {
    prepare(signer: auth(BorrowValue) &Account) {
        let admin = signer.storage.borrow<&MockPriceFeed.Admin>(
            from: MockPriceFeed.AdminStoragePath
        ) ?? panic("Could not borrow admin - only contract deployer can update prices")

        admin.updatePrice(asset: asset, price: price)
    }
}
