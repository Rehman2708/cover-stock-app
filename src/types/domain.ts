export type StockTone = "success" | "warning" | "danger";
export type TransactionType =
  | "sale"
  | "restock"
  | "adjustment"
  | "return"
  | "damaged"
  | "opening_balance"
  | "compatibility_link";

export interface Cover {
  id: string;
  quantityOnHand: number;
  reorderThreshold: number;
  compatibleModels: string[];
  displayDevice?: Pick<Device, "brand" | "model" | "images">;
  compatibleDevices?: Pick<Device, "id" | "brand" | "model" | "images">[];
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}
export interface CoverPage {
  items: Cover[];
  nextOffset: number | null;
  total: number;
}

export interface Device {
  id: string;
  brand: string;
  model: string;
  aliases?: string[];
  images?: { primary?: string | null; back?: string | null };
  inventory?: { unitsOnHand: number; coverVariants: number };
  compatibleDevices?: Pick<Device, "id" | "brand" | "model" | "images">[];
}
export interface DevicePage {
  items: Device[];
  nextOffset: number | null;
  total: number;
}

export interface DeviceBrand {
  brand: string;
  modelCount: number;
}
export interface CreateDeviceInput {
  brand: string;
  model: string;
  imageUrl?: string;
}
export interface UpdateDeviceInput {
  brand: string;
  model: string;
  imageUrl?: string;
}

export interface InventoryTransaction {
  id: string;
  coverId?: string;
  type: TransactionType;
  quantityDelta: number;
  quantityBefore?: number;
  quantityAfter?: number;
  reason?: string | null;
  note?: string | null;
  actor?: string | null;
  createdAt: string;
  compatibleModels?: string[];
  displayDevice?: Pick<Device, "brand" | "model" | "images">;
  compatibleDevices?: Pick<Device, "id" | "brand" | "model" | "images">[];
}

export interface DashboardData {
  metrics: { totalUnits: number; lowStock: number; outOfStock: number };
  dailySales: { date: string; label: string; quantity: number }[];
  lowStock: Cover[];
  outOfStock: Cover[];
  recentActivity: InventoryTransaction[];
}

export interface SearchResults {
  covers: Cover[];
  devices: Device[];
  hasMore?: boolean;
  nextOffset?: number | null;
}
export interface DeviceDetail {
  device: Device;
  covers: Cover[];
  compatibleDevices: Device[];
}
export interface StockMutation {
  cover: Cover;
  transaction: InventoryTransaction;
}
export interface DeviceCompatibilityLinkResult {
  compatibleDevices: Device[];
  linked: boolean;
}
export interface CreateCoverInput {
  startingQuantity: number;
  compatibleModels: string[];
}
export interface StockUpdateInput {
  quantity?: number;
  quantityDelta?: number;
  reason?: string;
  note?: string;
}
export interface ActivityPage {
  items: InventoryTransaction[];
  nextCursor: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
