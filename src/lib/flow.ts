import * as fcl from "@onflow/fcl";

const YOLDR_ADDRESS = "0x8401ed4fc6788c8a";

// FCL Configuration for testnet
fcl.config({
  "flow.network": "testnet",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "walletconnect.projectId": "3eaaad8fa7e823d688f3cf1e21194910",
  "app.detail.title": "Yoldr",
  "app.detail.icon": "https://yoldr.app/icon.png",
  "app.detail.description": "You Only Lose (the) yield, Really — principal-protected DeFi on Flow",
  "app.detail.url": "https://yoldr.app",
  "0xFungibleToken": "0x9a0766d93b6608b7",
  "0xFlowToken": "0x7e60df042a9c0868",
  "0xNonFungibleToken": "0x631e88ae7f1d7c20",
  "0xYoldr": YOLDR_ADDRESS,
  "0xMockPriceFeed": YOLDR_ADDRESS,
  "0xVaultPet": YOLDR_ADDRESS,
  "0xShieldPosition": YOLDR_ADDRESS,
  "0xBadgeMinter": YOLDR_ADDRESS,
});

export { fcl, YOLDR_ADDRESS };

// Cadence scripts (inline)
export const SCRIPTS = {
  getVaultState: `
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

  init(principal: UFix64, yieldBalance: UFix64, accruedYield: UFix64,
       totalYieldEarned: UFix64, streakCount: UInt64, xpPoints: UInt64,
       depositTimestamp: UFix64, lastHarvestTimestamp: UFix64) {
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
    let accrued = Yoldr.getAccruedYield(user: user)
    return VaultInfo(principal: vault.principal, yieldBalance: vault.yieldBalance,
      accruedYield: accrued, totalYieldEarned: vault.totalYieldEarned,
      streakCount: vault.streakCount, xpPoints: vault.xpPoints,
      depositTimestamp: vault.depositTimestamp, lastHarvestTimestamp: vault.lastHarvestTimestamp)
  }
  return nil
}
  `,

  getPrices: `
import MockPriceFeed from 0x8401ed4fc6788c8a

access(all) fun main(): {String: UFix64} {
  return MockPriceFeed.getAllPrices()
}
  `,

  getPet: `
import VaultPet from 0x8401ed4fc6788c8a

access(all) struct PetInfo {
  access(all) let id: UInt64
  access(all) let petType: String
  access(all) let level: UInt64
  access(all) let xp: UInt64
  access(all) let health: UFix64
  access(all) let currentSkin: String
  access(all) let shieldType: String

  init(id: UInt64, petType: String, level: UInt64, xp: UInt64,
       health: UFix64, currentSkin: String, shieldType: String) {
    self.id = id
    self.petType = petType
    self.level = level
    self.xp = xp
    self.health = health
    self.currentSkin = currentSkin
    self.shieldType = shieldType
  }
}

access(all) fun main(user: Address): PetInfo? {
  if let collection = getAccount(user).capabilities.borrow<&VaultPet.Collection>(VaultPet.CollectionPublicPath) {
    let ids = collection.getIDs()
    if ids.length > 0 {
      if let pet = collection.borrowVaultPet(ids[0]) {
        return PetInfo(id: pet.id, petType: pet.petType, level: pet.level, xp: pet.xp,
          health: pet.health, currentSkin: pet.currentSkin, shieldType: pet.shieldType)
      }
    }
  }
  return nil
}
  `,

  getPositions: `
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
  access(all) let returnPct: Fix64

  init(id: UInt64, shieldType: String, asset: String, leverage: UFix64,
       depositAmount: UFix64, openTimestamp: UFix64, openPrice: UFix64,
       currentPrice: UFix64, returnPct: Fix64) {
    self.id = id
    self.shieldType = shieldType
    self.asset = asset
    self.leverage = leverage
    self.depositAmount = depositAmount
    self.openTimestamp = openTimestamp
    self.openPrice = openPrice
    self.currentPrice = currentPrice
    self.returnPct = returnPct
  }
}

access(all) fun main(user: Address): [PositionInfo] {
  let positions: [PositionInfo] = []
  if let collection = getAccount(user).capabilities.borrow<&ShieldPosition.Collection>(ShieldPosition.CollectionPublicPath) {
    for id in collection.getIDs() {
      if let pos = collection.borrowShieldPosition(id) {
        let currentPrice = MockPriceFeed.getPrice(asset: pos.asset)
        let priceChange = Fix64(currentPrice) - Fix64(pos.openPrice)
        let priceChangePct = priceChange / Fix64(pos.openPrice)
        let returnPct = priceChangePct * Fix64(pos.leverage)
        positions.append(PositionInfo(id: id, shieldType: pos.shieldType, asset: pos.asset,
          leverage: pos.leverage, depositAmount: pos.depositAmount, openTimestamp: pos.openTimestamp,
          openPrice: pos.openPrice, currentPrice: currentPrice, returnPct: returnPct))
      }
    }
  }
  return positions
}
  `,

  getBadges: `
import BadgeMinter from 0x8401ed4fc6788c8a

access(all) struct BadgeInfo {
  access(all) let id: UInt64
  access(all) let asset: String
  access(all) let leverage: UFix64
  access(all) let returnPct: Fix64
  access(all) let isRare: Bool
  access(all) let shieldType: String
  access(all) let closeTimestamp: UFix64

  init(id: UInt64, asset: String, leverage: UFix64, returnPct: Fix64,
       isRare: Bool, shieldType: String, closeTimestamp: UFix64) {
    self.id = id
    self.asset = asset
    self.leverage = leverage
    self.returnPct = returnPct
    self.isRare = isRare
    self.shieldType = shieldType
    self.closeTimestamp = closeTimestamp
  }
}

access(all) fun main(user: Address): [BadgeInfo] {
  let badges: [BadgeInfo] = []
  if let collection = getAccount(user).capabilities.borrow<&BadgeMinter.Collection>(BadgeMinter.CollectionPublicPath) {
    for id in collection.getIDs() {
      if let badge = collection.borrowBadge(id) {
        badges.append(BadgeInfo(id: badge.id, asset: badge.asset, leverage: badge.leverage,
          returnPct: badge.returnPct, isRare: badge.isRare, shieldType: badge.shieldType,
          closeTimestamp: badge.closeTimestamp))
      }
    }
  }
  return badges
}
  `,

  // ── Single script that reads ALL vault users in one round-trip ───────────
  // Uses Yoldr.vaults (access(all) public dict) to enumerate every depositor,
  // then borrows VaultPet + BadgeMinter collections per-address in the same script.
  // This avoids N+1 RPC calls and is safe on a free access node.
  getLeaderboard: `
import Yoldr from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a
import BadgeMinter from 0x8401ed4fc6788c8a

access(all) struct LeaderEntry {
  access(all) let addr: Address
  access(all) let xp: UInt64
  access(all) let principal: UFix64
  access(all) let totalYieldEarned: UFix64
  access(all) let streakCount: UInt64
  access(all) let depositTimestamp: UFix64
  access(all) let petType: String
  access(all) let badgeCount: UInt64

  init(
    addr: Address, xp: UInt64, principal: UFix64,
    totalYieldEarned: UFix64, streakCount: UInt64,
    depositTimestamp: UFix64, petType: String, badgeCount: UInt64
  ) {
    self.addr = addr
    self.xp = xp
    self.principal = principal
    self.totalYieldEarned = totalYieldEarned
    self.streakCount = streakCount
    self.depositTimestamp = depositTimestamp
    self.petType = petType
    self.badgeCount = badgeCount
  }
}

access(all) fun main(): [LeaderEntry] {
  let entries: [LeaderEntry] = []

  for user in Yoldr.vaults.keys {
    if let vault = Yoldr.vaults[user] {
      // Skip zero-principal accounts (withdrawn)
      if vault.principal == 0.0 { continue }

      // Pet type — borrow the public VaultPet collection
      var petType = "Griffin"
      if let col = getAccount(user)
          .capabilities.borrow<&VaultPet.Collection>(VaultPet.CollectionPublicPath) {
        let ids = col.getIDs()
        if ids.length > 0 {
          if let pet = col.borrowVaultPet(ids[0]) {
            petType = pet.petType
          }
        }
      }

      // Badge count — borrow the public BadgeMinter collection
      var badgeCount: UInt64 = 0
      if let bc = getAccount(user)
          .capabilities.borrow<&BadgeMinter.Collection>(BadgeMinter.CollectionPublicPath) {
        badgeCount = UInt64(bc.getLength())
      }

      entries.append(LeaderEntry(
        addr: user,
        xp: vault.xpPoints,
        principal: vault.principal,
        totalYieldEarned: vault.totalYieldEarned,
        streakCount: vault.streakCount,
        depositTimestamp: vault.depositTimestamp,
        petType: petType,
        badgeCount: badgeCount
      ))
    }
  }

  return entries
}
  `,
};

// Cadence transactions (inline)
export const TRANSACTIONS = {
  pingStreak: `
import Yoldr from 0x8401ed4fc6788c8a

transaction(user: Address) {
  prepare(signer: auth(BorrowValue) &Account) {}

  execute {
    Yoldr.pingStreak(user: user)
  }
}
`,

  deposit: `
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import Yoldr from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a

transaction(amount: UFix64, petType: String) {
  let payment: @{FungibleToken.Vault}
  let userAddress: Address

  prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
    self.userAddress = signer.address

    // Withdraw from user FLOW vault
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow flow token vault")
    self.payment <- vaultRef.withdraw(amount: amount)

    // Setup VaultPet collection if not already present
    if signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath) == nil {
      let collection <- VaultPet.createEmptyCollection(nftType: Type<@VaultPet.NFT>())
      signer.storage.save(<-collection, to: VaultPet.CollectionStoragePath)
      let cap = signer.capabilities.storage.issue<&VaultPet.Collection>(VaultPet.CollectionStoragePath)
      signer.capabilities.publish(cap, at: VaultPet.CollectionPublicPath)
    }

    // Mint a Vault Pet if user doesn't have one yet
    // All storage access MUST happen in prepare — execute block cannot call storage.borrow
    let collectionRef = signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath)
      ?? panic("Could not borrow pet collection")

    if collectionRef.getLength() == 0 {
      let minterRef = getAccount(0x8401ed4fc6788c8a)
        .capabilities.borrow<&{VaultPet.MinterPublic}>(/public/vaultPetMinter)
        ?? panic("Could not borrow VaultPet minter — run setupMinters.cdc first")
      let pet <- minterRef.mintPet(recipient: self.userAddress, petType: petType)
      collectionRef.deposit(token: <-pet)
    }
  }

  execute {
    Yoldr.deposit(payment: <-self.payment, user: self.userAddress)
  }
}
  `,

  withdraw: `
import FungibleToken from 0x9a0766d93b6608b7
import Yoldr from 0x8401ed4fc6788c8a

transaction(amount: UFix64) {
  let userAddress: Address
  prepare(signer: auth(BorrowValue) &Account) {
    self.userAddress = signer.address
  }
  execute {
    let tokens <- Yoldr.withdraw(user: self.userAddress, amount: amount)
    let receiverRef = getAccount(self.userAddress)
      .capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      ?? panic("Could not borrow receiver")
    receiverRef.deposit(from: <-tokens)
  }
}
  `,

  openShield: `
import ShieldPosition from 0x8401ed4fc6788c8a
import Yoldr from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a

transaction(shieldType: String) {
  let userAddress: Address

  prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
    self.userAddress = signer.address

    // Setup ShieldPosition collection if not already present
    if signer.storage.borrow<&ShieldPosition.Collection>(from: ShieldPosition.CollectionStoragePath) == nil {
      let collection <- ShieldPosition.createEmptyCollection(nftType: Type<@ShieldPosition.NFT>())
      signer.storage.save(<-collection, to: ShieldPosition.CollectionStoragePath)
      let cap = signer.capabilities.storage.issue<&ShieldPosition.Collection>(ShieldPosition.CollectionStoragePath)
      signer.capabilities.publish(cap, at: ShieldPosition.CollectionPublicPath)
    }

    // All storage access MUST happen in prepare — execute block cannot call storage.borrow
    let yieldAmount = Yoldr.harvestYield(user: self.userAddress)
    let marginAmount = yieldAmount > 0.0 ? yieldAmount : 1.0

    let minterRef = getAccount(0x8401ed4fc6788c8a)
      .capabilities.borrow<&{ShieldPosition.MinterPublic}>(/public/shieldPositionMinter)
      ?? panic("Could not borrow ShieldPosition minter — run setupMinters.cdc first")

    let position <- minterRef.openShield(user: self.userAddress, shieldType: shieldType, depositAmount: marginAmount)

    if let petCollection = signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath) {
      let petIDs = petCollection.getIDs()
      if petIDs.length > 0 {
        if let pet = petCollection.borrowVaultPet(petIDs[0]) {
          pet.equipShield(shieldType: shieldType)
          pet.addXP(amount: 50)
        }
      }
    }

    let collectionRef = signer.storage.borrow<&ShieldPosition.Collection>(from: ShieldPosition.CollectionStoragePath)
      ?? panic("Could not borrow shield collection")
    collectionRef.deposit(token: <-position)
  }

  execute {}
}
  `,

  closeShield: `
import NonFungibleToken from 0x631e88ae7f1d7c20
import ShieldPosition from 0x8401ed4fc6788c8a
import BadgeMinter from 0x8401ed4fc6788c8a
import VaultPet from 0x8401ed4fc6788c8a
import MockPriceFeed from 0x8401ed4fc6788c8a

transaction(positionId: UInt64) {
  let userAddress: Address

  prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
    self.userAddress = signer.address

    // Setup badge collection if not already present
    if signer.storage.borrow<&BadgeMinter.Collection>(from: BadgeMinter.CollectionStoragePath) == nil {
      let collection <- BadgeMinter.createEmptyCollection(nftType: Type<@BadgeMinter.NFT>())
      signer.storage.save(<-collection, to: BadgeMinter.CollectionStoragePath)
      let cap = signer.capabilities.storage.issue<&BadgeMinter.Collection>(BadgeMinter.CollectionStoragePath)
      signer.capabilities.publish(cap, at: BadgeMinter.CollectionPublicPath)
    }

    // All storage access MUST happen in prepare — execute block cannot call storage.borrow
    // Borrow shield collection with Withdraw entitlement to remove position
    let shieldCollection = signer.storage.borrow<auth(NonFungibleToken.Withdraw) &ShieldPosition.Collection>(
      from: ShieldPosition.CollectionStoragePath
    ) ?? panic("Could not borrow shield collection")

    let position = shieldCollection.borrowShieldPosition(positionId)
      ?? panic("Position not found")

    let currentPrice = MockPriceFeed.getPrice(asset: position.asset)
    let priceChange = Fix64(currentPrice) - Fix64(position.openPrice)
    let priceChangePct = priceChange / Fix64(position.openPrice)
    let returnPct = priceChangePct * Fix64(position.leverage)

    let badgeMinterRef = getAccount(0x8401ed4fc6788c8a)
      .capabilities.borrow<&{BadgeMinter.MinterPublic}>(/public/badgeMinter)
      ?? panic("Could not borrow BadgeMinter — run setupMinters.cdc first")

    let badge <- badgeMinterRef.mintBadge(
      recipient: self.userAddress, asset: position.asset, leverage: position.leverage,
      depositAmount: position.depositAmount, openTimestamp: position.openTimestamp,
      returnPct: returnPct, shieldType: position.shieldType
    )

    let badgeCollection = signer.storage.borrow<&BadgeMinter.Collection>(from: BadgeMinter.CollectionStoragePath)
      ?? panic("Could not borrow badge collection")
    badgeCollection.deposit(token: <-badge)

    if let petCollection = signer.storage.borrow<&VaultPet.Collection>(from: VaultPet.CollectionStoragePath) {
      let petIDs = petCollection.getIDs()
      if petIDs.length > 0 {
        if let pet = petCollection.borrowVaultPet(petIDs[0]) {
          pet.addXP(amount: 75)
          pet.equipShield(shieldType: "")
        }
      }
    }

    let closedPosition <- shieldCollection.withdraw(withdrawID: positionId)
    destroy closedPosition
  }

  execute {}
}
  `,

  updatePrice: `
import MockPriceFeed from 0x8401ed4fc6788c8a

transaction(asset: String, price: UFix64) {
  prepare(signer: auth(BorrowValue) &Account) {
    let admin = signer.storage.borrow<&MockPriceFeed.Admin>(
      from: MockPriceFeed.AdminStoragePath
    ) ?? panic("Only admin can update prices")
    admin.updatePrice(asset: asset, price: price)
  }
}
  `,
};

// Helper to format FLOW amounts
export function formatFlow(amount: number): string {
  return amount.toFixed(4);
}

// Helper to format percentage
export function formatPct(pct: number): string {
  return `${(pct * 100).toFixed(2)}%`;
}

// Shield definitions
export const SHIELDS = {
  GOLD_GUARDIAN: {
    name: "Gold Guardian",
    asset: "GOLD",
    leverage: 5,
    expectedAPY: "5.8%",
    riskLevel: "Low",
    petType: "Griffin",
    description: "Bet on gold with 5x leverage. Your daily earnings hedge against inflation.",
    color: "from-yellow-500 to-amber-600",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  CRYPTO_CRUISER: {
    name: "Crypto Cruiser",
    asset: "BTC",
    leverage: 1,
    expectedAPY: "30%",
    riskLevel: "Low",
    petType: "Dragon",
    description: "1x BTC exposure. No liquidation risk. Pure spot bet with your yield.",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  ETHER_VOYAGER: {
    name: "Ether Voyager",
    asset: "ETH",
    leverage: 2,
    expectedAPY: "20%",
    riskLevel: "Medium",
    petType: "Phoenix",
    description: "2x ETH exposure riding the DeFi wave with your daily yield as margin.",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  FLOW_RIDER: {
    name: "Flow Rider",
    asset: "FLOW",
    leverage: 3,
    expectedAPY: "25%",
    riskLevel: "Medium",
    petType: "Narwhal",
    description: "3x FLOW exposure. Bet on the ecosystem you're already in.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
};

export const PET_EMOJI: Record<string, string> = {
  Griffin: "🦁",
  Dragon: "🐉",
  Phoenix: "🦅",
  Narwhal: "🦄",
};

export const ASSET_EMOJI: Record<string, string> = {
  GOLD: "🥇",
  BTC: "₿",
  ETH: "Ξ",
  FLOW: "◎",
};
