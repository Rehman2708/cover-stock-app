import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { LoadingMore } from "../../components/common/LoadingMore";
import { DeviceCard } from "../../components/common/DeviceCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ListToolbar } from "../../components/common/ListToolbar";
import { SkeletonList } from "../../components/common/Skeleton";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { StockActions } from "../../components/common/StockActions";
import { useTheme } from "../../design-system/ThemeProvider";
import { colors, spacing } from "../../design-system/tokens";
import type { Cover, StockMutation, TransactionType } from "../../types/domain";

export type InventoryFilter =
  | "all"
  | "in_stock"
  | "attention"
  | "low_stock"
  | "out_of_stock";
export type InventorySort = "recent" | "quantity_low" | "quantity_high";
export interface InventoryViewProps {
  covers: Cover[];
  loading: boolean;
  error: string | null;
  changingId: string | null;
  nextOffset: number | null;
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateStock: (
    cover: Cover,
    type: TransactionType,
    quantity?: number,
  ) => Promise<StockMutation>;
}
interface InventoryListProps extends InventoryViewProps {
  filter: InventoryFilter;
  onFilterChange: (filter: InventoryFilter) => void;
  sort?: InventorySort;
  onSortChange?: (sort: InventorySort) => void;
  showControls?: boolean;
}

export function InventoryList({
  covers,
  loading,
  error,
  changingId: _changingId,
  nextOffset,
  updateStock,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  showControls = true,
}: InventoryListProps) {
  const filteredCovers = useMemo(
    () =>
      covers.filter((cover) => {
        // “Available” means a member of staff can sell at least one unit. Low stock
        // remains a separate health state, rather than disappearing from this view.
        if (filter === "in_stock") return cover.quantityOnHand > 0;
        if (filter === "low_stock")
          return (
            cover.quantityOnHand > 0 &&
            cover.quantityOnHand <= cover.reorderThreshold
          );
        if (filter === "attention")
          return (
            cover.quantityOnHand === 0 ||
            (cover.quantityOnHand > 0 &&
              cover.quantityOnHand <= cover.reorderThreshold)
          );
        if (filter === "out_of_stock") return cover.quantityOnHand === 0;
        return true;
      }),
    [covers, filter],
  );
  return (
    <>
      {showControls ? <ListToolbar
        filter={{
          accessibilityLabel: "Filter inventory",
          value: filter,
          onApply: onFilterChange,
          options: [
            { label: "All", value: "all" },
            { label: "Available", value: "in_stock" },
            { label: "Need attention", value: "attention" },
            { label: "Low stock", value: "low_stock" },
            { label: "Out of stock", value: "out_of_stock" },
          ],
        }}
        sort={
          sort && onSortChange
            ? {
                accessibilityLabel: "Sort inventory",
                value: sort,
                onApply: onSortChange,
                options: [
                  { label: "Recently updated", value: "recent" },
                  { label: "Quantity: low to high", value: "quantity_low" },
                  { label: "Quantity: high to low", value: "quantity_high" },
                ],
              }
            : undefined
        }
      /> : null}
      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {loading && !covers.length ? (
        <SkeletonList count={4} variant="coverWithActions" />
      ) : covers.length ? (
        <>
          {filteredCovers.length ? (
            <>
              <View style={styles.list}>
                {filteredCovers.map((cover, index) => (
                  <DeviceCard
                    key={`${cover.id}-${index}`}
                    cover={cover}
                    onPress={() =>
                      router.push({
                        pathname: "/cover/[id]",
                        params: { id: cover.id },
                      })
                    }
                  >
                    <StockActions
                      dense
                      quantityOnHand={cover.quantityOnHand}
                      onUpdate={(type, quantity) =>
                        updateStock(cover, type, quantity)
                      }
                    />
                  </DeviceCard>
                ))}
              </View>
              {nextOffset !== null && loading ? <LoadingMore /> : null}
            </>
          ) : (
            <EmptyState
              title="No covers in this filter"
              message="Try a different stock status."
            />
          )}
        </>
      ) : (
        <EmptyState
          title={filter === "all" ? "No covers yet" : "No covers in this filter"}
          message={
            filter === "all"
              ? "Add the first cover after importing your India-market device catalogue."
              : "Try a different stock status."
          }
        />
      )}
    </>
  );
}

export function InventoryView(props: InventoryViewProps) {
  const { colors } = useTheme();
  const { filter: requestedFilter } = useLocalSearchParams<{
    filter?: InventoryFilter;
  }>();
  const filter: InventoryFilter =
    requestedFilter &&
    ["all", "in_stock", "attention", "low_stock", "out_of_stock"].includes(requestedFilter)
      ? requestedFilter
      : "all";
  return (
    <Screen
      header={
        <AppHeader
          eyebrow="CATALOGUE"
          title="Inventory"
          subtitle={`${props.total} active stock records`}
        />
      }
      refreshControl={createRefreshControl(props.loading, props.refresh, colors)}
      onEndReached={props.nextOffset !== null ? props.loadMore : undefined}
    >
      <InventoryList
        {...props}
        filter={filter}
        onFilterChange={(nextFilter) =>
          router.setParams({ filter: nextFilter })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg, marginTop: spacing.xs },
  error: {
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
  },
  errorText: { color: colors.danger, fontWeight: "700" },
});
