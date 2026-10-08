import { useEffect } from "react";
import { Platform } from "react-native";
import { create } from "zustand";
import { api, setAuthToken } from "../../lib/api";
import type { AuthSession, AuthUser } from "../../types/domain";

const sessionKey = "coverstock.session";
let inMemorySession: string | null = null;
type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let secureStore: SecureStoreModule | null = null;
try {
  // Older development clients may not include this native Expo module yet.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  secureStore = require("expo-secure-store") as SecureStoreModule;
} catch {}

const sessionStorage = {
  get: async () => {
    if (Platform.OS !== "web")
      return secureStore
        ? secureStore.getItemAsync(sessionKey)
        : inMemorySession;
    try {
      return globalThis.localStorage?.getItem(sessionKey) ?? inMemorySession;
    } catch {
      return inMemorySession;
    }
  },
  set: async (value: string) => {
    if (Platform.OS !== "web") {
      if (secureStore) return secureStore.setItemAsync(sessionKey, value);
      inMemorySession = value;
      return;
    }
    inMemorySession = value;
    try {
      globalThis.localStorage?.setItem(sessionKey, value);
    } catch {}
  },
  clear: async () => {
    if (Platform.OS !== "web") {
      if (secureStore) return secureStore.deleteItemAsync(sessionKey);
      inMemorySession = null;
      return;
    }
    inMemorySession = null;
    try {
      globalThis.localStorage?.removeItem(sessionKey);
    } catch {}
  },
};
interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

let initialization: Promise<void> | null = null;

async function saveSession(
  session: AuthSession,
  setUser: (user: AuthUser) => void,
) {
  setAuthToken(session.token);
  try {
    await sessionStorage.set(JSON.stringify(session));
    setUser(session.user);
  } catch {
    setAuthToken(null);
    throw new Error(
      "Unable to save your session on this device. Please try again.",
    );
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  initialize: async () => {
    if (initialization) return initialization;
    initialization = (async () => {
      try {
        const stored = await sessionStorage.get();
        if (!stored) return;
        const session = JSON.parse(stored) as Partial<AuthSession>;
        if (!session.token || typeof session.token !== "string")
          throw new Error("Invalid saved session.");
        setAuthToken(session.token);
        const currentUser = await api.getMe();
        set({ user: currentUser });
      } catch {
        setAuthToken(null);
        await sessionStorage.clear();
      } finally {
        set({ loading: false });
      }
    })();
    return initialization;
  },
  login: async (phone, password) => {
    const session = await api.login({ phone, password });
    await saveSession(session, (user) => set({ user }));
  },
  register: async (name, phone, password) => {
    const session = await api.register({ name, phone, password });
    await saveSession(session, (user) => set({ user }));
  },
  logout: async () => {
    await sessionStorage.clear();
    setAuthToken(null);
    set({ user: null });
  },
  updateUser: (user) => set({ user }),
}));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  return children;
}

export function useAuth() {
  return useAuthStore();
}
