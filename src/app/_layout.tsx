import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../design-system/ThemeProvider";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { SkeletonList } from "../components/common/Skeleton";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  if (loading)
    return (
      <View
        style={{
          backgroundColor: colors.canvas,
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <SkeletonList count={3} variant="app" />
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="activity" options={{ headerShown: false }} />
        <Stack.Screen name="activity/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="cover/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="device/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="brand/[brand]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
