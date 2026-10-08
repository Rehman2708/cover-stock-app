import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { Button } from "../../components/common/Button";
import { CoverCard } from "../../components/common/CoverCard";
import { EmptyState } from "../../components/common/EmptyState";
import { FilterChips } from "../../components/common/FilterChips";
import { SkeletonList } from "../../components/common/Skeleton";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { StockActions } from "../../components/common/StockActions";
import { colors, spacing } from "../../design-system/tokens";
import type { Cover, StockMutation, TransactionType } from "../../types/domain";

export type InventoryFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
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
}

export function InventoryList({
  covers,
  loading,
  error,
  changingId: _changingId,
  nextOffset,
  loadMore,
  updateStock,
  filter,
  onFilterChange,
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
        if (filter === "out_of_stock") return cover.quantityOnHand === 0;
        return true;
      }),
    [covers, filter],
  );
  if (loading && !covers.length)
    return <SkeletonList count={4} variant="coverWithActions" />;
  return (
    <>
      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {covers.length ? (
        <>
          <FilterChips
            accessibilityLabel="Filter inventory"
            value={filter}
            onChange={onFilterChange}
            options={[
              { label: "All", value: "all" },
              { label: "Available", value: "in_stock" },
              { label: "Low stock", value: "low_stock" },
              { label: "Out of stock", value: "out_of_stock" },
            ]}
          />
          {filteredCovers.length ? (
            <>
              {filteredCovers.map((cover, index) => (
                <CoverCard
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
                    quantityOnHand={cover.quantityOnHand}
                    onUpdate={(type, quantity) =>
                      updateStock(cover, type, quantity)
                    }
                  />
                </CoverCard>
              ))}
              {nextOffset !== null ? (
                <Button
                  label="Load more inventory"
                  loading={loading}
                  onPress={loadMore}
                  variant="secondary"
                />
              ) : null}
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
          title="No covers yet"
          message="Add the first cover after importing your India-market device catalogue."
        />
      )}
    </>
  );
}

export function InventoryView(props: InventoryViewProps) {
  const { filter: requestedFilter } = useLocalSearchParams<{
    filter?: InventoryFilter;
  }>();
  const filter: InventoryFilter =
    requestedFilter &&
    ["all", "in_stock", "low_stock", "out_of_stock"].includes(requestedFilter)
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
      refreshControl={createRefreshControl(props.loading, props.refresh)}
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
  error: {
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
  },
  errorText: { color: colors.danger, fontWeight: "700" },
});
