import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import Yoldr from 0x8401ed4fc6788c8a

transaction(amount: UFix64) {
    let userAddress: Address

    prepare(signer: auth(BorrowValue) &Account) {
        self.userAddress = signer.address
    }

    execute {
        // Withdraw principal from vault
        let tokens <- Yoldr.withdraw(user: self.userAddress, amount: amount)

        // Deposit back to user's FLOW vault
        let receiverRef = getAccount(self.userAddress)
            .capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow receiver")

        receiverRef.deposit(from: <-tokens)
    }
}
