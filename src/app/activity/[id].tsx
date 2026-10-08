import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
import { DeviceImage } from "../../components/common/DeviceImage";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import { Screen } from "../../components/common/Screen";
import { colors, radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import {
  activityMeta,
  activityNote,
  activityTime,
  stockTransition,
} from "../../features/activity/activityPresentation";
import type { InventoryTransaction } from "../../types/domain";

export default function ActivityDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<InventoryTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    api
      .getTransaction(id)
      .then((nextItem) => {
        if (mounted) setItem(nextItem);
      })
      .catch((reason: unknown) => {
        if (mounted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load this activity.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [id]);
  const meta = item ? activityMeta(item.type) : null;
  const header = (
    <AppHeader
      eyebrow="ACTIVITY DETAIL"
      title={item && meta ? `${meta.label} recorded` : "Activity details"}
      subtitle={item?.coverName || "Stock record"}
      left={<BackButton onPress={() => router.back()} />}
    />
  );
  if (error)
    return (
      <Screen header={header}>
        <EmptyState title="Couldn’t load this activity" message={error} />
      </Screen>
    );
  if (!item || !meta)
    return (
      <Screen header={header}>
        <SkeletonList variant="activityDetail" />
      </Screen>
    );
  return (
    <Screen header={header}>
      <View style={[styles.hero, { backgroundColor: meta.softColor }]}>
        {item.displayDevice ? (
          <DeviceImage device={item.displayDevice} size={54} />
        ) : (
          <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
            <Ionicons color={meta.color} name={meta.icon} size={26} />
          </View>
        )}
        <View style={styles.heroCopy}>
          <Text style={[styles.eyebrow, { color: meta.color }]}>
            {meta.label.toUpperCase()}
          </Text>
          <Text style={styles.heroTitle}>
            {item.coverName || "Cover no longer available"}
          </Text>
          <Text style={styles.heroSubtitle}>{activityNote(item)}</Text>
        </View>
      </View>
      <View style={styles.movement}>
        <Text style={styles.sectionLabel}>STOCK MOVEMENT</Text>
        <View style={styles.movementLine}>
          <Text style={styles.beforeAfter}>{stockTransition(item)}</Text>
          <Text style={[styles.delta, { color: meta.color }]}>
            {item.quantityDelta > 0 ? "+" : ""}
            {item.quantityDelta} units
          </Text>
        </View>
        <Text style={styles.movementHint}>
          Quantity before and after this stock record.
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.sectionLabel}>RECORD DETAILS</Text>
        <Row label="Recorded by" value={item.actor || "Shop owner"} />
        <Row
          label="Time"
          value={
            new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }) +
            " · " +
            activityTime(item.createdAt)
          }
        />
        <Row label="Cover SKU" value={item.coverSku || "Not recorded"} />
        {item.compatibleModels?.length ? (
          <Row label="Fits" value={item.compatibleModels.join(" · ")} />
        ) : null}
        {item.reason ? <Row label="Reason" value={item.reason} /> : null}
        {item.note && item.note !== "Opening balance" ? (
          <Row label="Note" value={item.note} />
        ) : null}
      </View>
      {item.coverId ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/cover/[id]",
              params: { id: item.coverId! },
            })
          }
          style={({ pressed }) => [styles.coverLink, pressed && styles.pressed]}
        >
          <Text style={styles.coverLinkText}>Open cover details</Text>
          <Ionicons color={colors.primary} name="arrow-forward" size={18} />
        </Pressable>
      ) : null}
    </Screen>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  heroCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  heroTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  heroSubtitle: { color: colors.muted, fontSize: 13 },
  movement: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  movementLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  beforeAfter: { color: colors.ink, fontSize: 28, fontWeight: "900" },
  delta: { fontSize: 19, fontWeight: "900" },
  movementHint: { color: colors.muted, fontSize: 13 },
  details: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  rowLabel: { color: colors.muted, fontSize: 14, maxWidth: "32%" },
  rowValue: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  coverLink: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  coverLinkText: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.72 },
});
