import { useCallback, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
import { Button } from "../../components/common/Button";
import { DeviceImage } from "../../components/common/DeviceImage";
import { EmptyState } from "../../components/common/EmptyState";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { SkeletonList } from "../../components/common/Skeleton";
import { useTheme } from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import { formatDate } from "../../lib/format";
import type { Device } from "../../types/domain";

export default function ArchivedDeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const publishDevice = useDataSyncStore((state) => state.publishDevice);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const deviceImageUri = device?.images?.primary || device?.images?.back;

  const loadDevice = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        setDevice(await api.getArchivedDevice(id));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load this archived device.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
    void loadDevice();
    }, [loadDevice]),
  );

  const restore = () => {
    if (!device || restoring) return;

    Alert.alert(
      "Restore device?",
      "This returns the device to your catalogue. Its previous stock and compatibility links are not restored automatically.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            setRestoring(true);
            try {
              const restored = await api.restoreDevice(device.id);
              publishDevice(restored);
              router.replace({
                pathname: "/device/[id]",
                params: { id: restored.id },
              });
            } catch (requestError) {
              Alert.alert(
                "Couldn't restore device",
                requestError instanceof Error
                  ? requestError.message
                  : "Please try again.",
              );
            } finally {
              setRestoring(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Screen
        header={
          <AppHeader
            left={<BackButton onPress={() => router.back()} />}
            eyebrow="ARCHIVED DEVICE"
            title="Loading…"
          />
        }
      >
        <SkeletonList count={3} variant="deviceWithoutBrand" />
      </Screen>
    );
  }

  if (!device) {
    return (
      <Screen
        header={
          <AppHeader
            left={<BackButton onPress={() => router.back()} />}
            eyebrow="ARCHIVED DEVICE"
            title="Unavailable"
          />
        }
        refreshControl={createRefreshControl(refreshing, () => void loadDevice(true), colors)}
      >
        <EmptyState
          title="Archived device unavailable"
          message={error ?? "It may have already been restored or removed."}
          actionLabel="Try again"
          onAction={() => void loadDevice()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          left={<BackButton onPress={() => router.back()} />}
          eyebrow="ARCHIVED DEVICE"
          title={`${device.brand} ${device.model}`}
          subtitle="Kept safely for recovery"
        />
      }
      refreshControl={createRefreshControl(refreshing, () => void loadDevice(true), colors)}
    >

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.lg,
          },
        ]}
      >
        <View style={[styles.deviceRow, { gap: spacing.md }]}>
          {deviceImageUri ? (
            <Pressable
              accessibilityHint="Opens the phone image full screen"
              accessibilityLabel={`View ${device.brand} ${device.model} image`}
              accessibilityRole="button"
              onPress={() => setImagePreviewOpen(true)}
              style={({ pressed }) => [styles.imageButton, pressed && styles.pressed]}
            >
              <DeviceImage device={device} size={72} />
              <View pointerEvents="none" style={[styles.imageTapHint, { backgroundColor: colors.ink }]}>
                <Text style={[styles.imageTapHintLabel, { color: colors.white }]}>Tap to view</Text>
              </View>
            </Pressable>
          ) : (
            <DeviceImage device={device} size={72} />
          )}
          <View style={styles.details}>
            <Text style={[styles.title, { color: colors.ink }]}>
              {device.brand} {device.model}
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              Archived {device.archivedAt ? formatDate(device.archivedAt) : "recently"}
            </Text>
          </View>
        </View>

        <View style={[styles.note, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md }]}>
          <Text style={[styles.body, { color: colors.muted }]}>
            Restoring adds this device back to your catalogue. To avoid bringing back
            outdated information, its old stock and compatible-device links stay separate.
          </Text>
        </View>

        <Button label="Restore device" onPress={restore} loading={restoring} />
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setImagePreviewOpen(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={imagePreviewOpen && Boolean(deviceImageUri)}
      >
        <View style={[styles.imagePreview, { backgroundColor: colors.black }]}>
          <Pressable
            accessibilityLabel="Close full screen image"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setImagePreviewOpen(false)}
            style={({ pressed }) => [
              styles.imagePreviewClose,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.imagePreviewCloseLabel, { color: colors.white }]}>×</Text>
          </Pressable>
          {deviceImageUri ? (
            <Image
              accessibilityLabel={`${device.brand} ${device.model}`}
              resizeMode="contain"
              source={{ uri: deviceImageUri }}
              style={styles.imagePreviewImage}
            />
          ) : null}
          <Text style={[styles.imagePreviewCaption, { color: colors.white }]}>
            {device.brand} {device.model}
          </Text>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  details: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    overflow: "hidden",
  },
  imageButton: {
    height: 72,
    position: "relative",
    width: 72,
  },
  imageTapHint: {
    alignSelf: "center",
    borderRadius: 999,
    bottom: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
  },
  imageTapHintLabel: {
    fontSize: 9,
    fontWeight: "800",
  },
  imagePreview: {
    flex: 1,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  imagePreviewClose: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: spacing.lg,
    top: spacing.xxl,
    width: 44,
    zIndex: 1,
  },
  imagePreviewCloseLabel: {
    fontSize: 32,
    fontWeight: "400",
    lineHeight: 34,
  },
  imagePreviewImage: {
    flex: 1,
    width: "100%",
  },
  imagePreviewCaption: {
    fontSize: 16,
    fontWeight: "800",
    paddingTop: spacing.md,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
});
