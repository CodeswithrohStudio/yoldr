import Yoldr from 0x8401ed4fc6788c8a

transaction(user: Address) {
    prepare(signer: auth(BorrowValue) &Account) {}

    execute {
        Yoldr.pingStreak(user: user)
    }
}
