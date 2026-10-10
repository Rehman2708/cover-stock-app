import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
import { LoadingMore } from "../../components/common/LoadingMore";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import { ListToolbar } from "../../components/common/ListToolbar";
import { SearchBar } from "../../components/common/SearchBar";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import {
  activityDayLabel,
  activityMeta,
  activityNote,
  activityTime,
  stockTransition,
} from "./activityPresentation";
import type { InventoryTransaction } from "../../types/domain";
import type { ActivitySort } from "./useActivityViewModel";

interface ActivityViewProps {
  items: InventoryTransaction[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (query: string) => void;
  sort: ActivitySort;
  setSort: (sort: ActivitySort) => void;
  nextCursor: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}
type ActivityFilter = "all" | "sales" | "stock_in" | "corrections";

const matchesFilter = (item: InventoryTransaction, filter: ActivityFilter) => {
  if (filter === "sales") return item.type === "sale";
  if (filter === "stock_in")
    return ["restock", "return", "opening_balance"].includes(item.type);
  if (filter === "corrections")
    return ["adjustment", "damaged"].includes(item.type);
  return true;
};

export function ActivityView({
  items,
  loading,
  error,
  query,
  setQuery,
  sort,
  setSort,
  nextCursor,
  refresh,
  loadMore,
}: ActivityViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [filter, items],
  );
  const recentDate = useMemo(
    () =>
      items.reduce<string | undefined>(
        (latest, item) =>
          !latest || new Date(item.createdAt) > new Date(latest)
            ? item.createdAt
            : latest,
        undefined,
      ),
    [items],
  );
  const dayItems = useMemo(
    () =>
      recentDate
        ? items.filter(
            (item) =>
              new Date(item.createdAt).toDateString() ===
              new Date(recentDate).toDateString(),
          )
        : [],
    [items, recentDate],
  );
  const summary = useMemo(
    () => ({
      sold: dayItems
        .filter((item) => item.type === "sale")
        .reduce((total, item) => total + Math.abs(item.quantityDelta), 0),
      added: dayItems
        .filter((item) =>
          ["restock", "return", "opening_balance"].includes(item.type),
        )
        .reduce((total, item) => total + item.quantityDelta, 0),
      corrections: dayItems.filter((item) =>
        ["adjustment", "damaged"].includes(item.type),
      ).length,
    }),
    [dayItems],
  );
  const groups = useMemo(
    () =>
      filteredItems.reduce<Record<string, InventoryTransaction[]>>(
        (result, item) => {
          const key = new Date(item.createdAt).toDateString();
          (result[key] ||= []).push(item);
          return result;
        },
        {},
      ),
    [filteredItems],
  );

  const header = (
    <AppHeader
      eyebrow="AUDIT TRAIL"
      title="Activity"
      subtitle={
        loading && !items.length
          ? "Loading stock movements."
          : "Every stock movement, clearly explained."
      }
      left={<BackButton onPress={() => router.back()} />}
    />
  );
  if (loading && !items.length)
    return (
      <Screen
        header={header}
        refreshControl={createRefreshControl(loading, refresh, colors)}
      >
        <SearchBar
          loading
          onChangeText={setQuery}
          onClear={() => setQuery("")}
          onSubmit={() => refresh()}
          placeholder="Search phone history"
          value={query}
        />
        <ActivityToolbar
          filter={filter}
          onFilterChange={setFilter}
          onSortChange={setSort}
          sort={sort}
        />
        <SkeletonList variant="activity" count={5} />
      </Screen>
    );
  return (
    <Screen
      header={header}
      refreshControl={createRefreshControl(loading, refresh, colors)}
      onEndReached={nextCursor ? loadMore : undefined}
    >
      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <SearchBar
        loading={loading && Boolean(items.length)}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
        onSubmit={() => refresh()}
        placeholder="Search phone history"
        value={query}
      />
      {items.length ? (
        <>
          <ActivityToolbar
            filter={filter}
            onFilterChange={setFilter}
            onSortChange={setSort}
            sort={sort}
          />
          <View
            style={styles.summary}
            accessibilityLabel={`Latest day: ${summary.sold} sold, ${summary.added} added, ${summary.corrections} corrections`}
          >
            <Summary value={summary.sold} label="sold" />
            <View style={styles.summaryDivider} />
            <Summary value={summary.added} label="added" />
            <View style={styles.summaryDivider} />
            <Summary value={summary.corrections} label="corrections" />
          </View>
          {filteredItems.length ? (
            <>
              {Object.entries(groups).map(([day, group], groupIndex) => (
                <View key={`${day}-${groupIndex}`} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.day}>
                      {activityDayLabel(group[0].createdAt)}
                    </Text>
                    <Text style={styles.groupCount}>
                      {group.length}{" "}
                      {group.length === 1 ? "movement" : "movements"}
                    </Text>
                  </View>
                  <View style={styles.list}>
                    {group.map((item, index) => (
                      <ActivityRow
                        item={item}
                        key={`${item.id}-${item.createdAt}-${index}`}
                        last={index === group.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ))}
              {nextCursor && loading ? <LoadingMore /> : null}
            </>
          ) : (
            <EmptyState
              title="No matching activity"
              message="Try another filter to see stock movements."
            />
          )}
        </>
      ) : (
        <EmptyState
          title="No activity yet"
          message="Sales, restocks, returns, and corrections will appear here with their full stock trail."
        />
      )}
    </Screen>
  );
}

function ActivityToolbar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: {
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  sort: ActivitySort;
  onSortChange: (sort: ActivitySort) => void;
}) {
  return (
    <ListToolbar
      filter={{
        accessibilityLabel: "Filter activity",
        value: filter,
        onApply: onFilterChange,
        options: [
          { label: "All activity", value: "all" },
          { label: "Sales", value: "sales" },
          { label: "Stock in", value: "stock_in" },
          { label: "Corrections", value: "corrections" },
        ],
      }}
      sort={{
        accessibilityLabel: "Sort activity",
        value: sort,
        onApply: onSortChange,
        options: [
          { label: "Newest first", value: "newest" },
          { label: "Oldest first", value: "oldest" },
        ],
      }}
    />
  );
}

function Summary({ value, label }: { value: number; label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}
function ActivityRow({
  item,
  last,
}: {
  item: InventoryTransaction;
  last: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const meta = activityMeta(item.type, colors);
  return (
    <Pressable
      accessibilityLabel={`Open ${meta.label.toLowerCase()} for ${item.compatibleModels?.join(", ") || "phone stock"}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: "/activity/[id]", params: { id: item.id } })
      }
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: meta.softColor }]}>
        <Ionicons color={meta.color} name={meta.icon} size={20} />
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.coverName}>
          {item.compatibleModels?.join(" · ") || "Phone stock record"}
        </Text>
        <Text numberOfLines={1} style={styles.models}>
          {item.compatibleModels?.length
            ? "Phone-based stock"
            : "Phone details unavailable"}
        </Text>
        <View style={styles.metaLine}>
          <Text
            style={[
              styles.type,
              { color: meta.color, backgroundColor: meta.softColor },
            ]}
          >
            {meta.label}
          </Text>
          <Text numberOfLines={1} style={styles.actor}>
            {item.actor || "Shop owner"} · {activityTime(item.createdAt)}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.note}>
          {activityNote(item)}
        </Text>
      </View>
      <View style={styles.movement}>
        <Text style={[styles.delta, { color: meta.color }]}>
          {item.type === "compatibility_link" || item.type === "compatibility_unlink"
            ? item.type === "compatibility_link" ? "Linked" : "Unlinked"
            : `${item.quantityDelta > 0 ? "+" : ""}${item.quantityDelta}`}
        </Text>
        <Text style={styles.transition}>{stockTransition(item)}</Text>
        <Ionicons color={colors.muted} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  error: {
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
  },
  errorText: { color: colors.danger, fontWeight: "700" },
  summary: {
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    padding: spacing.md,
  },
  summaryItem: { alignItems: "center", flex: 1, gap: 2 },
  summaryValue: { color: colors.primary, fontSize: 25, fontWeight: "900" },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  summaryDivider: { backgroundColor: colors.border, width: 1 },
  group: { gap: spacing.sm },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  day: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  groupCount: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  pressed: { backgroundColor: colors.surfaceMuted },
  icon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  rowCopy: { flex: 1, gap: 2, minWidth: 0 },
  coverName: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  models: { color: colors.muted, fontSize: 13 },
  metaLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
  },
  type: {
    borderRadius: radius.pill,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  actor: { color: colors.muted, flex: 1, fontSize: 12 },
  note: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 1,
  },
  movement: { alignItems: "flex-end", gap: 1, minWidth: 54 },
  delta: { fontSize: 20, fontWeight: "900" },
  transition: { color: colors.muted, fontSize: 12, fontWeight: "700" },
});
