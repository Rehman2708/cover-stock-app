import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Cover,
  DashboardData,
  Device,
  InventoryTransaction,
  StockMutation,
} from "../types/domain";

const cacheChunkSize = 1_800;
const cacheCountKey = (key: string) => `${key}.chunk-count`;
const cacheChunkKey = (key: string, index: number) => `${key}.chunk-${index}`;

// SecureStore is already part of the app for authentication. Its individual
// entries are intentionally small, so split the cache instead of relying on a
// second native storage module that may not exist in an older dev client.
const cacheStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    try {
      const count = Number(
        await SecureStore.getItemAsync(cacheCountKey(key)),
      );
      if (!Number.isInteger(count) || count < 1) return null;
      const chunks = await Promise.all(
        Array.from({ length: count }, (_, index) =>
          SecureStore.getItemAsync(cacheChunkKey(key, index)),
        ),
      );
      return chunks.every((chunk): chunk is string => chunk !== null)
        ? chunks.join("")
        : null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {}
      return;
    }
    try {
      const previousCount = Number(
        await SecureStore.getItemAsync(cacheCountKey(key)),
      );
      const chunks =
        value.match(new RegExp(`.{1,${cacheChunkSize}}`, "g")) ?? [""];
      await Promise.all(
        chunks.map((chunk, index) =>
          SecureStore.setItemAsync(cacheChunkKey(key, index), chunk),
        ),
      );
      if (Number.isInteger(previousCount) && previousCount > chunks.length)
        await Promise.all(
          Array.from(
            { length: previousCount - chunks.length },
            (_, index) =>
              SecureStore.deleteItemAsync(
                cacheChunkKey(key, chunks.length + index),
              ),
          ),
        );
      await SecureStore.setItemAsync(cacheCountKey(key), String(chunks.length));
    } catch {}
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {}
      return;
    }
    try {
      const count = Number(
        await SecureStore.getItemAsync(cacheCountKey(key)),
      );
      await Promise.all([
        SecureStore.deleteItemAsync(cacheCountKey(key)),
        ...Array.from(
          { length: Number.isInteger(count) && count > 0 ? count : 0 },
          (_, index) => SecureStore.deleteItemAsync(cacheChunkKey(key, index)),
        ),
      ]);
    } catch {}
  },
};

const isLowStock = (cover: Cover) =>
  cover.quantityOnHand > 0 &&
  cover.quantityOnHand <= cover.reorderThreshold;

const replaceAttentionCover = (
  covers: Cover[],
  cover: Cover,
  matches: boolean,
) => {
  const next = covers.filter((item) => item.id !== cover.id);
  if (!matches) return next;
  return [...next, cover]
    .sort((left, right) => left.quantityOnHand - right.quantityOnHand)
    .slice(0, 3);
};

const updateDashboard = (dashboard: DashboardData, mutation: StockMutation) => {
  const { cover, transaction } = mutation;
  const previousQuantity = transaction.quantityBefore ?? cover.quantityOnHand;
  const wasLowStock =
    previousQuantity > 0 && previousQuantity <= cover.reorderThreshold;
  const wasOutOfStock = previousQuantity === 0;
  const metrics = {
    totalUnits:
      dashboard.metrics.totalUnits + (cover.quantityOnHand - previousQuantity),
    lowStock:
      dashboard.metrics.lowStock + Number(isLowStock(cover)) - Number(wasLowStock),
    outOfStock:
      dashboard.metrics.outOfStock +
      Number(cover.quantityOnHand === 0) -
      Number(wasOutOfStock),
  };
  return {
    ...dashboard,
    metrics,
    lowStock: replaceAttentionCover(dashboard.lowStock, cover, isLowStock(cover)),
    outOfStock: replaceAttentionCover(
      dashboard.outOfStock,
      cover,
      cover.quantityOnHand === 0,
    ),
    recentActivity: [
      transaction,
      ...dashboard.recentActivity.filter((item) => item.id !== transaction.id),
    ].slice(0, 8),
  };
};

interface DataSyncState {
  dashboard: DashboardData | null;
  activity: InventoryTransaction[];
  latestStockMutation: StockMutation | null;
  latestDevice: Device | null;
  stockRevision: number;
  deviceRevision: number;
  cacheDashboard: (dashboard: DashboardData) => void;
  cacheActivity: (activity: InventoryTransaction[]) => void;
  publishStockMutation: (mutation: StockMutation) => void;
  publishDevice: (device: Device) => void;
  clear: () => void;
}

export const useDataSyncStore = create<DataSyncState>()(
  persist(
    (set) => ({
      dashboard: null,
      activity: [],
      latestStockMutation: null,
      latestDevice: null,
      stockRevision: 0,
      deviceRevision: 0,
      cacheDashboard: (dashboard) => set({ dashboard }),
      cacheActivity: (activity) => set({ activity }),
      publishStockMutation: (mutation) =>
        set((current) => ({
          activity: [
            mutation.transaction,
            ...current.activity.filter(
              (item) => item.id !== mutation.transaction.id,
            ),
          ].slice(0, 100),
          dashboard: current.dashboard
            ? updateDashboard(current.dashboard, mutation)
            : null,
          latestStockMutation: mutation,
          stockRevision: current.stockRevision + 1,
        })),
      publishDevice: (device) =>
        set((current) => ({
          latestDevice: device,
          deviceRevision: current.deviceRevision + 1,
        })),
      clear: () =>
        set({
          dashboard: null,
          activity: [],
          latestStockMutation: null,
          latestDevice: null,
          stockRevision: 0,
          deviceRevision: 0,
        }),
    }),
    {
      name: "coverstock.data-cache.v2",
      storage: createJSONStorage(() => cacheStorage),
      partialize: (state) => ({
        dashboard: state.dashboard,
        activity: state.activity,
      }),
    },
  ),
);
