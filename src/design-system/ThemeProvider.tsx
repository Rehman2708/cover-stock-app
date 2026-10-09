import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { colors as defaultColors } from "./tokens";

export type ThemeColors = Record<keyof typeof defaultColors, string>;

export const themeOptions = [
  {
    id: "forest",
    name: "Forest",
    description: "Calm and grounded",
    primary: "#176B4D",
    primaryPressed: "#10543C",
    primarySoft: "#DDEFE7",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Clear and focused",
    primary: "#14739B",
    primaryPressed: "#0E5878",
    primarySoft: "#DCEFF7",
  },
  {
    id: "violet",
    name: "Violet",
    description: "Confident and creative",
    primary: "#7251B5",
    primaryPressed: "#573A90",
    primarySoft: "#EEE8FA",
  },
  {
    id: "coral",
    name: "Coral",
    description: "Warm and energetic",
    primary: "#C1573A",
    primaryPressed: "#99422C",
    primarySoft: "#FBE7E0",
  },
  {
    id: "teal",
    name: "Teal",
    description: "Fresh and balanced",
    primary: "#087D76",
    primaryPressed: "#05635E",
    primarySoft: "#D9F2F0",
  },
  {
    id: "indigo",
    name: "Indigo",
    description: "Deep and dependable",
    primary: "#465BC0",
    primaryPressed: "#354694",
    primarySoft: "#E4E8FB",
  },
  {
    id: "berry",
    name: "Berry",
    description: "Bold and expressive",
    primary: "#A13F68",
    primaryPressed: "#7E3051",
    primarySoft: "#F8E2EB",
  },
  {
    id: "amber",
    name: "Amber",
    description: "Bright and welcoming",
    primary: "#9A6200",
    primaryPressed: "#774B00",
    primarySoft: "#FDF0D5",
  },
] as const;

export type ThemeId = (typeof themeOptions)[number]["id"];

const themeStorageKey = "coverstock.theme";

function isThemeId(value: string | null): value is ThemeId {
  return themeOptions.some((theme) => theme.id === value);
}

function getColors(themeId: ThemeId): ThemeColors {
  const theme = themeOptions.find((option) => option.id === themeId)!;
  return {
    ...defaultColors,
    primary: theme.primary,
    primaryPressed: theme.primaryPressed,
    primarySoft: theme.primarySoft,
  };
}

async function readTheme(): Promise<string | null> {
  if (Platform.OS !== "web") return SecureStore.getItemAsync(themeStorageKey);
  try {
    return globalThis.localStorage?.getItem(themeStorageKey) ?? null;
  } catch {
    return null;
  }
}

async function persistTheme(themeId: ThemeId) {
  if (Platform.OS !== "web") {
    await SecureStore.setItemAsync(themeStorageKey, themeId);
    return;
  }
  try {
    globalThis.localStorage?.setItem(themeStorageKey, themeId);
  } catch {}
}

interface ThemeContextValue {
  colors: ThemeColors;
  themeId: ThemeId;
  themeOptions: typeof themeOptions;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("forest");

  useEffect(() => {
    void readTheme()
      .then((storedTheme) => {
        if (isThemeId(storedTheme)) setThemeId(storedTheme);
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((nextThemeId: ThemeId) => {
    setThemeId(nextThemeId);
    void persistTheme(nextThemeId).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      colors: getColors(themeId),
      setTheme,
      themeId,
      themeOptions,
    }),
    [setTheme, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used within ThemeProvider.");
  return theme;
}

export function useThemedStyles<T>(
  createStyles: (colors: ThemeColors) => T,
) {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
