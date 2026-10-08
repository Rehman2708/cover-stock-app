import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../../components/common/AppHeader";
import { Button } from "../../components/common/Button";
import { CoverCard } from "../../components/common/CoverCard";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";
import { formatDate, titleCase } from "../../lib/format";
import type { DashboardData } from "../../types/domain";
import { router } from "expo-router";

type MetricTone = "neutral" | "warning" | "danger";
type InventoryFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
function Metric({
  label,
  value,
  tone = "neutral",
  filter = "all",
}: {
  label: string;
  value: string | number;
  tone?: MetricTone;
  filter?: InventoryFilter;
}) {
  const tones = {
    neutral: undefined,
    warning: styles.warning,
    danger: styles.danger,
  };
  return (
    <Pressable
      accessibilityLabel={`View ${label}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/inventory",
          params: { mode: "stock", filter },
        })
      }
      style={({ pressed }) => [
        styles.metric,
        tones[tone],
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}
interface DashboardViewProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
export function DashboardView({
  data,
  loading,
  error,
  refresh,
}: DashboardViewProps) {
  if (loading && !data)
    return (
      <Screen
        header={
          <AppHeader
            eyebrow="COVERSTOCK"
            title="Good morning"
            subtitle="Checking your shop inventory."
          />
        }
      >
        <SkeletonList variant="dashboard" />
      </Screen>
    );
  if (error)
    return (
      <Screen header={<AppHeader eyebrow="COVERSTOCK" title="Dashboard" />}>
        <EmptyState title="Can’t reach your shop data" message={error} />
        <Button label="Try again" onPress={refresh} />
      </Screen>
    );
  if (!data) return null;
  const metrics = data.metrics;
  const attentionCount = metrics.lowStock + metrics.outOfStock;
  return (
    <Screen
      header={
        <AppHeader
          eyebrow="COVERSTOCK · TODAY"
          title="Shop snapshot"
          subtitle="Your inventory, exactly where you need it."
        />
      }
      refreshControl={createRefreshControl(loading, refresh)}
    >
      <View style={styles.metrics}>
        <Metric
          label="Units available"
          value={metrics.totalUnits}
          filter="in_stock"
        />
        <Metric
          label="Low stock"
          value={metrics.lowStock}
          tone="warning"
          filter="low_stock"
        />
        <Metric
          label="Out of stock"
          value={metrics.outOfStock}
          tone="danger"
          filter="out_of_stock"
        />
      </View>
      <SalesChart dailySales={data.dailySales} />
      <View style={styles.sectionHead}>
        <Text style={commonStyles.sectionTitle}>Needs attention</Text>
        <Text style={commonStyles.caption}>{attentionCount} stock entries</Text>
      </View>
      {[...data.outOfStock, ...data.lowStock]
        .slice(0, 3)
        .map((cover, index) => (
          <CoverCard
            key={`${cover.id}-${index}`}
            cover={cover}
            onPress={() =>
              router.push({ pathname: "/cover/[id]", params: { id: cover.id } })
            }
          />
        ))}
      {attentionCount === 0 ? (
        <View style={styles.good}>
          <Text style={styles.goodText}>All stock levels look healthy.</Text>
        </View>
      ) : null}
      <View style={styles.sectionHead}>
        <Text style={commonStyles.sectionTitle}>Recent activity</Text>
        <Text
          accessibilityRole="button"
          onPress={() => router.push("/activity")}
          style={styles.activityLink}
        >
          See all
        </Text>
      </View>
      {data.recentActivity.length ? (
        data.recentActivity.map((item, index) => (
          <Pressable
            accessibilityRole="button"
            key={`${item.id}-${item.createdAt}-${index}`}
            onPress={() =>
              router.push({
                pathname: "/activity/[id]",
                params: { id: item.id },
              })
            }
            style={({ pressed }) => [
              styles.activity,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.activityDot} />
            <View style={styles.activityCopy}>
              <Text numberOfLines={1} style={styles.activityTitle}>
                {item.coverName || "Stock update"}
              </Text>
              <Text style={commonStyles.caption}>
                {titleCase(item.type)} · {item.actor || "Shop owner"} ·{" "}
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <Text
              style={[styles.delta, item.quantityDelta < 0 && styles.deltaOut]}
            >
              {item.quantityDelta > 0 ? "+" : ""}
              {item.quantityDelta}
            </Text>
          </Pressable>
        ))
      ) : (
        <EmptyState
          title="No activity yet"
          message="Sales and restocks will appear here."
        />
      )}
    </Screen>
  );
}
function SalesChart({
  dailySales,
}: {
  dailySales: DashboardData["dailySales"];
}) {
  const maximum = Math.max(...dailySales.map((day) => day.quantity), 1);
  const total = dailySales.reduce((sum, day) => sum + day.quantity, 0);
  return (
    <View
      accessibilityLabel={`Daily sales for the last seven days: ${total} units sold`}
      style={styles.salesCard}
    >
      <View style={styles.sectionHead}>
        <View>
          <Text style={styles.salesTitle}>Daily sales</Text>
          <Text style={commonStyles.caption}>
            Units sold in the last 7 days
          </Text>
        </View>
        <Text style={styles.salesTotal}>{total}</Text>
      </View>
      <View style={styles.chart}>
        {dailySales.map((day, index) => (
          <View key={`${day.date}-${index}`} style={styles.barGroup}>
            <Text style={styles.barValue}>{day.quantity || ""}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max((day.quantity / maximum) * 100, day.quantity ? 8 : 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{day.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: {
    width: "48%",
    minHeight: 100,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  pressed: { opacity: 0.72 },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningSoft,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  metricValue: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  salesCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  salesTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  salesTotal: { color: colors.primary, fontSize: 27, fontWeight: "900" },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.xs,
    height: 136,
    justifyContent: "space-between",
  },
  barGroup: {
    alignItems: "center",
    flex: 1,
    gap: 5,
    height: "100%",
    justifyContent: "flex-end",
  },
  barValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    minHeight: 15,
  },
  barTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 88,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: 18,
  },
  bar: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    width: "100%",
  },
  barLabel: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  activityLink: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  good: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.successSoft,
  },
  goodText: { color: colors.success, fontWeight: "800" },
  activity: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  activityCopy: { flex: 1 },
  activityTitle: { color: colors.ink, fontWeight: "800", marginBottom: 2 },
  delta: { color: colors.success, fontWeight: "900", fontSize: 17 },
  deltaOut: { color: colors.danger },
});
