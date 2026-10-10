import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type ThemeColors } from "../../design-system/ThemeProvider";
import { font, radius, shadow, spacing } from "../../design-system/tokens";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: "transparent",
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.muted,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          { bottom: Math.max(insets.bottom + spacing.sm, spacing.lg) },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color as string}
              focused={focused}
              name="grid-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color as string}
              focused={focused}
              name="cube-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color as string}
              focused={focused}
              name="person-outline"
            />
          ),
        }}
      />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({
  color,
  focused,
  name,
}: {
  color: string;
  focused: boolean;
  name: "grid-outline" | "cube-outline" | "person-outline";
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.iconBadge, focused && styles.iconBadgeActive]}>
      <Ionicons color={color} name={name} size={21} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  tabBar: {
    ...shadow,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 6,
    height: 66,
    left: spacing.xxxl * 2 - spacing.xs,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    position: "absolute",
    right: spacing.xxxl * 2 - spacing.xs,
    shadowOpacity: 0.14,
    marginHorizontal: 24,
  },
  tabItem: { borderRadius: radius.pill, marginHorizontal: 2 },
  tabLabel: { fontFamily: font.family.bold, fontSize: 11, fontWeight: "800", marginTop: 0 },
  iconBadge: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  iconBadgeActive: { backgroundColor: colors.primarySoft },
});
