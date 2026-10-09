import type {
  ActivityPage,
  AuthSession,
  AuthUser,
  Cover,
  DeviceCompatibilityLinkResult,
  CreateDeviceInput,
  UpdateDeviceInput,
  CreateCoverInput,
  DashboardData,
  CoverPage,
  Device,
  DevicePage,
  DeviceBrand,
  DeviceDetail,
  InventoryTransaction,
  SearchResults,
  StockMutation,
  StockUpdateInput,
  TransactionType,
} from "../types/domain";
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://cover-stock-backend.onrender.com";

// Android emulators reach the development machine through 10.0.2.2; `localhost`
// would instead point back to the emulator. A configured URL always takes priority.
// Release builds use the deployed API without requiring a build-time environment file.
const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__
    ? Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000"
    : PRODUCTION_API_URL)
).replace(/\/+$/, "");
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error || "Unable to complete that request.");
  return body as T;
}
export const api = {
  register: (input: { name: string; phone: string; password: string }) =>
    request<AuthSession>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  login: (input: { phone: string; password: string }) =>
    request<AuthSession>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getMe: () => request<AuthUser>("/api/auth/me"),
  updateProfile: (input: { name: string }) =>
    request<AuthUser>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("/api/auth/password", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  getDashboard: () => request<DashboardData>("/api/dashboard"),
  getCovers: ({
    filter = "all",
    offset = 0,
    limit = 50,
  }: {
    filter?: "all" | "in_stock" | "low_stock" | "out_of_stock";
    offset?: number;
    limit?: number;
  } = {}) =>
    request<CoverPage>(
      `/api/covers?stock=${filter}&offset=${offset}&limit=${limit}`,
    ),
  createCover: (input: CreateCoverInput) =>
    request<Cover>("/api/covers", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getCover: (id: string) => request<Cover>(`/api/covers/${id}`),
  getCoverTransactions: (id: string) =>
    request<InventoryTransaction[]>(`/api/covers/${id}/transactions`),
  getDevices: ({
    brand,
    offset = 0,
    limit = 50,
  }: { brand?: string; offset?: number; limit?: number } = {}) =>
    request<DevicePage>(
      `/api/devices?offset=${offset}&limit=${limit}${brand ? `&brand=${encodeURIComponent(brand)}` : ""}`,
    ),
  createDevice: (input: CreateDeviceInput) =>
    request<Device>("/api/devices", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateDevice: (id: string, input: UpdateDeviceInput) =>
    request<Device>(`/api/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  getDeviceBrands: () => request<DeviceBrand[]>("/api/devices/brands"),
  getDevice: (id: string) => request<DeviceDetail>(`/api/devices/${id}`),
  removeDevice: (id: string) =>
    request<void>(`/api/devices/${id}`, { method: "DELETE" }),
  linkCompatibleDevice: (deviceId: string, compatibleDeviceId: string) =>
    request<DeviceCompatibilityLinkResult>(
      `/api/devices/${deviceId}/compatible-devices/${compatibleDeviceId}`,
      { method: "POST" },
    ),
  unlinkCompatibleDevice: (deviceId: string, compatibleDeviceId: string) =>
    request<DeviceCompatibilityLinkResult>(
      `/api/devices/${deviceId}/compatible-devices/${compatibleDeviceId}/unlink`,
      { method: "POST" },
    ),
  getTransactions: ({
    before,
    query,
    limit = 50,
  }: { before?: string; query?: string; limit?: number } = {}) =>
    request<ActivityPage>(
      `/api/transactions?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`,
    ),
  getTransaction: (id: string) =>
    request<InventoryTransaction>(`/api/transactions/${id}`),
  search: (query: string, brand?: string, offset = 0) =>
    request<SearchResults>(
      `/api/search?q=${encodeURIComponent(query)}${brand ? `&brand=${encodeURIComponent(brand)}` : ""}&offset=${offset}`,
    ),
  updateStock: (
    coverId: string,
    type: TransactionType,
    input: StockUpdateInput = {},
  ) =>
    request<StockMutation>(`/api/covers/${coverId}/transactions`, {
      method: "POST",
      body: JSON.stringify({ type, quantity: input.quantity ?? 1, ...input }),
    }),
  updateDeviceStock: (
    deviceId: string,
    type: TransactionType,
    input: StockUpdateInput = {},
  ) =>
    request<StockMutation>(`/api/devices/${deviceId}/transactions`, {
      method: "POST",
      body: JSON.stringify({ type, quantity: input.quantity ?? 1, ...input }),
    }),
};
export { API_URL };
