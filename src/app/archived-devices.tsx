import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppHeader } from "../components/common/AppHeader";
import { BackButton } from "../components/common/BackButton";
import { Button } from "../components/common/Button";
import { DeviceImage } from "../components/common/DeviceImage";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingMore } from "../components/common/LoadingMore";
import { Screen, createRefreshControl } from "../components/common/Screen";
import { SkeletonList } from "../components/common/Skeleton";
import { useTheme } from "../design-system/ThemeProvider";
import { spacing } from "../design-system/tokens";
import { formatDate } from "../lib/format";
import { api } from "../lib/api";
import { useDataSyncStore } from "../lib/dataSync";
import type { Device } from "../types/domain";

const maximumLoadedDevices = 100;

export default function ArchivedDevicesRoute() {
  const { colors } = useTheme();
  const publishDevice = useDataSyncStore((state) => state.publishDevice);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async (offset = 0, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const page = await api.getArchivedDevices({ offset });
      setDevices((current) =>
        offset
          ? [...current, ...page.items].slice(0, maximumLoadedDevices)
          : page.items,
      );
      setNextOffset(
        offset + page.items.length >= maximumLoadedDevices
          ? null
          : page.nextOffset,
      );
      setTotal(page.total);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load archived devices.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const restore = async (device: Device) => {
    setRestoringId(device.id);
    try {
      const restored = await api.restoreDevice(device.id);
      setDevices((current) => current.filter((item) => item.id !== device.id));
      setTotal((current) => Math.max(0, current - 1));
      publishDevice(restored);
      Alert.alert(
        "Device restored",
        `${restored.brand} ${restored.model} is active again. Its previous stock and compatibility links were not restored automatically.`,
      );
    } catch (reason) {
      Alert.alert(
        "Couldn’t restore device",
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.",
      );
    } finally {
      setRestoringId(null);
    }
  };

  const confirmRestore = (device: Device) => {
    Alert.alert(
      "Restore this device?",
      `${device.brand} ${device.model} will return to the catalogue. Its prior stock and compatibility links will remain separate.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Restore", onPress: () => void restore(device) },
      ],
    );
  };

  return (
    <Screen
      header={
        <AppHeader
          eyebrow="CATALOGUE"
          title="Archived devices"
          subtitle={`${total} device${total === 1 ? "" : "s"} kept for recovery`}
          left={<BackButton onPress={() => router.back()} />}
        />
      }
      refreshControl={createRefreshControl(refreshing, () => load(0, true), colors)}
      onEndReached={
        nextOffset !== null && !loading ? () => load(nextOffset) : undefined
      }
    >
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {loading && !devices.length ? <SkeletonList count={4} variant="deviceWithoutBrand" /> : null}
      {!loading && !devices.length && !error ? (
        <EmptyState
          title="No archived devices"
          message="Deleted phones are kept here so you can restore them later."
        />
      ) : null}
      <View style={styles.list}>
        {devices.map((device) => (
          <ArchivedDeviceCard
            device={device}
            key={device.id}
            onPress={() =>
              router.push({ pathname: "/archived-device/[id]", params: { id: device.id } })
            }
            onRestore={() => confirmRestore(device)}
            restoring={restoringId === device.id}
          />
        ))}
      </View>
      {loading && devices.length && nextOffset !== null ? <LoadingMore /> : null}
    </Screen>
  );
}

function ArchivedDeviceCard({
  device,
  onPress,
  onRestore,
  restoring,
}: {
  device: Device;
  onPress: () => void;
  onRestore: () => void;
  restoring: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityLabel={`View archived ${device.brand} ${device.model}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
      >
        <DeviceImage device={device} size={48} />
        <View style={styles.copy}>
          <Text style={[styles.brand, { color: colors.primary }]}>{device.brand}</Text>
          <Text style={[styles.model, { color: colors.ink }]}>{device.model}</Text>
          <Text style={[styles.archiveDate, { color: colors.muted }]}>
            Archived {device.archivedAt ? formatDate(device.archivedAt) : "previously"}
          </Text>
        </View>
        <Ionicons color={colors.muted} name="chevron-forward" size={20} />
      </Pressable>
      <View style={styles.restoreAction}>
        <Button
          label="Restore device"
          loading={restoring}
          onPress={onRestore}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  error: { fontWeight: "700" },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardPressable: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, gap: 2 },
  brand: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  model: { fontSize: 17, fontWeight: "900", lineHeight: 20 },
  archiveDate: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  restoreAction: { marginTop: spacing.md },
});
