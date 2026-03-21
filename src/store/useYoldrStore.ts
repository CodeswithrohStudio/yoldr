import { create } from "zustand";

export interface VaultState {
  principal: number;
  yieldBalance: number;
  accruedYield: number;
  totalYieldEarned: number;
  streakCount: number;
  xpPoints: number;
  depositTimestamp: number;
  lastHarvestTimestamp: number;
}

export interface PetState {
  id: number;
  petType: string;
  level: number;
  xp: number;
  health: number;
  currentSkin: string;
  shieldType: string;
}

export interface PositionState {
  id: number;
  shieldType: string;
  asset: string;
  leverage: number;
  depositAmount: number;
  openTimestamp: number;
  openPrice: number;
  currentPrice: number;
  returnPct: number;
}

export interface BadgeState {
  id: number;
  asset: string;
  leverage: number;
  returnPct: number;
  isRare: boolean;
  shieldType: string;
  closeTimestamp: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "xp";
  xpAmount?: number;
}

interface YoldrStore {
  // User state
  user: { addr: string; loggedIn: boolean } | null;
  vault: VaultState | null;
  pet: PetState | null;
  positions: PositionState[];
  badges: BadgeState[];
  prices: Record<string, number>;

  // UI state
  toasts: Toast[];
  isLoading: boolean;
  activeTab: string;

  // Actions
  setUser: (user: { addr: string; loggedIn: boolean } | null) => void;
  setVault: (vault: VaultState | null) => void;
  setPet: (pet: PetState | null) => void;
  setPositions: (positions: PositionState[]) => void;
  setBadges: (badges: BadgeState[]) => void;
  setPrices: (prices: Record<string, number>) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  addXP: (amount: number, reason: string) => void;
}

export const useYoldrStore = create<YoldrStore>((set, get) => ({
  user: null,
  vault: null,
  pet: null,
  positions: [],
  badges: [],
  prices: { GOLD: 2650, BTC: 67500, ETH: 3200, FLOW: 0.85 },
  toasts: [],
  isLoading: false,
  activeTab: "home",

  setUser: (user) => set({ user }),
  setVault: (vault) => set({ vault }),
  setPet: (pet) => set({ pet }),
  setPositions: (positions) => set({ positions }),
  setBadges: (badges) => set({ badges }),
  setPrices: (prices) => set({ prices }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveTab: (activeTab) => set({ activeTab }),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  addXP: (amount, reason) => {
    const store = get();
    store.addToast({
      message: `+${amount} XP — ${reason}`,
      type: "xp",
      xpAmount: amount,
    });
  },
}));
