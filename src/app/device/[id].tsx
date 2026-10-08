import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
import { DeviceImage } from "../../components/common/DeviceImage";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import { Screen } from "../../components/common/Screen";
import { StockActions } from "../../components/common/StockActions";
import { colors, radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import type {
  DeviceDetail,
  StockMutation,
  TransactionType,
} from "../../types/domain";

export default function DeviceDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loadedDetail, setDetail] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latestStockMutation = useDataSyncStore(
    (state) => state.latestStockMutation,
  );
  const publishStockMutation = useDataSyncStore(
    (state) => state.publishStockMutation,
  );

  useEffect(() => {
    let mounted = true;
    api
      .getDevice(id)
      .then((nextDetail) => {
        if (mounted) setDetail(nextDetail);
      })
      .catch((reason: unknown) => {
        if (mounted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load this phone.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [id]);
  const detail = useMemo(
    () =>
      loadedDetail &&
      latestStockMutation &&
      loadedDetail.covers.some(
        (cover) => cover.id === latestStockMutation.cover.id,
      )
        ? {
            ...loadedDetail,
            covers: loadedDetail.covers.map((cover) =>
              cover.id === latestStockMutation.cover.id
                ? latestStockMutation.cover
                : cover,
            ),
          }
        : loadedDetail,
    [latestStockMutation, loadedDetail],
  );

  const title = detail ? detail.device.model : "Phone details";
  const eyebrow = detail ? detail.device.brand.toUpperCase() : "PHONE DETAIL";
  const unitsOnHand =
    detail?.covers.reduce((total, cover) => total + cover.quantityOnHand, 0) ||
    0;
  const availableRecords =
    detail?.covers.filter((cover) => cover.quantityOnHand > 0).length || 0;
  const header = (
    <AppHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={
        detail ? "Availability and compatible phones" : "Loading availability"
      }
      left={<BackButton onPress={() => router.back()} />}
    />
  );
  const updateStock = async (
    type: Extract<TransactionType, "sale" | "restock">,
    quantity: number,
  ): Promise<StockMutation> => {
    try {
      const mutation = await api.updateDeviceStock(id, type, { quantity });
      publishStockMutation(mutation);
      setDetail((current) =>
        current
          ? {
              ...current,
              covers: current.covers.some(
                (cover) => cover.id === mutation.cover.id,
              )
                ? current.covers.map((cover) =>
                    cover.id === mutation.cover.id ? mutation.cover : cover,
                  )
                : [...current.covers, mutation.cover],
            }
          : current,
      );
      return mutation;
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.";
      Alert.alert("Could not update stock", message);
      throw new Error(message);
    }
  };

  if (error)
    return (
      <Screen header={header}>
        <EmptyState title="Couldn’t load this phone" message={error} />
      </Screen>
    );
  if (!detail)
    return (
      <Screen header={header}>
        <SkeletonList variant="deviceDetail" />
      </Screen>
    );
  return (
    <Screen header={header}>
      <View style={styles.summary}>
        <DeviceImage device={detail.device} showFallbackLabel size={112} />
        <View style={styles.summaryCopy}>
          <Text style={styles.label}>COVER AVAILABILITY</Text>
          <Text style={styles.count}>
            {unitsOnHand ? `${unitsOnHand} units` : "No covers in stock"}
          </Text>
          <Text style={styles.caption}>
            {unitsOnHand > 0
              ? `${availableRecords} stock record${availableRecords === 1 ? "" : "s"} available for this phone.`
              : "No covers are currently available for this phone."}
          </Text>
        </View>
      </View>
      <StockActions quantityOnHand={unitsOnHand} onUpdate={updateStock} />
      {detail.compatibleDevices.length ? (
        <View style={styles.compatibility}>
          <Text style={styles.compatibilityTitle}>SAME COVER FITS</Text>
          <Text style={styles.compatibilityCaption}>
            These phones use the same cover as this model.
          </Text>
          <View style={styles.compatibilityGrid}>
            {detail.compatibleDevices.map((device, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${device.brand} ${device.model}`}
                key={`${device.id}-${index}`}
                onPress={() =>
                  router.push({
                    pathname: "/device/[id]",
                    params: { id: device.id },
                  })
                }
                style={({ pressed }) => [
                  styles.compatibilityCard,
                  pressed && styles.pressed,
                ]}
              >
                <DeviceImage device={device} size={42} />
                <View style={styles.compatibilityCopy}>
                  <Text numberOfLines={1} style={styles.compatibilityBrand}>
                    {device.brand}
                  </Text>
                  <Text numberOfLines={1} style={styles.compatibilityName}>
                    {device.model}
                  </Text>
                  <Text style={styles.compatibilityHint}>View availability</Text>
                </View>
                <View style={styles.compatibilityCount}>
                  <Text style={styles.compatibilityNumber}>{unitsOnHand}</Text>
                  <Text style={styles.compatibilityUnits}>
                    {unitsOnHand === 1 ? "unit" : "units"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {!unitsOnHand && !detail.compatibleDevices.length ? (
        <View style={styles.emptyGuide}>
          <Text style={styles.emptyGuideTitle}>Start with the phone in hand</Text>
          <Text style={styles.emptyGuideCopy}>
            Add the available covers now. You can link compatible models as you confirm their fit.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  summaryCopy: { flex: 1, gap: 4 },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  count: { color: colors.ink, fontSize: 25, fontWeight: "900" },
  caption: { color: colors.muted, fontSize: 14 },
  compatibility: { gap: spacing.xs },
  compatibilityTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  compatibilityCaption: { color: colors.muted, fontSize: 14 },
  compatibilityGrid: { gap: 1, backgroundColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  compatibilityCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 0,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  compatibilityCopy: { flex: 1, gap: 2 },
  compatibilityBrand: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  compatibilityName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  compatibilityHint: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  compatibilityCount: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    minWidth: 46,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  compatibilityNumber: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "900",
  },
  compatibilityUnits: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  pressed: { opacity: 0.7 },
  emptyGuide: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.xxs,
    padding: spacing.md,
  },
  emptyGuideTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  emptyGuideCopy: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
