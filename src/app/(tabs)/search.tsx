import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { AddDeviceModal } from "../../components/common/AddDeviceModal";
import { Button } from "../../components/common/Button";
import { BrandLogo } from "../../components/common/BrandLogo";
import { CoverCard } from "../../components/common/CoverCard";
import { DeviceCard } from "../../components/common/DeviceCard";
import { EmptyState } from "../../components/common/EmptyState";
import { FilterChips } from "../../components/common/FilterChips";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { SkeletonList } from "../../components/common/Skeleton";
import { SearchBar } from "../../components/common/SearchBar";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import {
  InventoryList,
  type InventoryFilter,
} from "../../features/inventory/InventoryView";
import { useInventoryViewModel } from "../../features/inventory/useInventoryViewModel";
import { useDebouncedSearch } from "../../features/search/useDebouncedSearch";
import type { DeviceBrand } from "../../types/domain";

type SearchResultFilter = "all" | "devices" | "covers";
type InventoryMode = "browse" | "stock";

export default function SearchRoute() {
  const { mode: requestedMode, filter: requestedFilter } =
    useLocalSearchParams<{ mode?: InventoryMode; filter?: InventoryFilter }>();
  const mode: InventoryMode = requestedMode === "stock" ? "stock" : "browse";
  const stockFilter: InventoryFilter =
    requestedFilter &&
    ["all", "in_stock", "low_stock", "out_of_stock"].includes(requestedFilter)
      ? requestedFilter
      : "all";
  const inventory = useInventoryViewModel(stockFilter);
  const refreshInventory = inventory.refresh;
  const { query, setQuery, results, loading, error, searchNow, loadMore } =
    useDebouncedSearch();
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<SearchResultFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const deviceRevision = useDataSyncStore((state) => state.deviceRevision);

  const loadBrands = useCallback(async () => {
    setLoadingBrands(true);
    try {
      setBrands(await api.getDeviceBrands());
    } catch (reason) {
      setBrandError(
        reason instanceof Error
          ? reason.message
          : "Unable to load phone brands.",
      );
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .getDeviceBrands()
      .then((nextBrands) => {
        if (mounted) setBrands(nextBrands);
      })
      .catch((reason: unknown) => {
        if (mounted)
          setBrandError(
            reason instanceof Error
              ? reason.message
              : "Unable to load phone brands.",
          );
      })
      .finally(() => {
        if (mounted) setLoadingBrands(false);
      });
    return () => {
      mounted = false;
    };
  }, [deviceRevision]);

  const search = async () => {
    if (!query.trim()) return;
    router.setParams({ mode: "browse" });
    setResultFilter("all");
    await searchNow();
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    if (nextQuery.trim()) {
      router.setParams({ mode: "browse" });
      setResultFilter("all");
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResultFilter("all");
    router.setParams({ mode: "browse" });
  };

  const deviceAdded = async (device: { id: string }) => {
    setAddDeviceOpen(false);
    await loadBrands();
    router.push({ pathname: "/device/[id]", params: { id: device.id } });
  };

  const refreshHub = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadBrands(),
      refreshInventory(),
      query.trim() ? searchNow() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [loadBrands, query, refreshInventory, searchNow]);
  const hasSearchQuery = Boolean(query.trim());
  const noResults =
    hasSearchQuery &&
    !loading &&
    results.covers.length === 0 &&
    results.devices.length === 0;
  const showDevices = resultFilter !== "covers";
  const showCovers = resultFilter !== "devices";
  const header = (
    <AppHeader
      eyebrow="INVENTORY"
      title="Find a phone"
      subtitle={
        mode === "stock"
          ? "Live cover quantities, sales, and restocks."
          : "Browse by brand or search a phone model."
      }
    />
  );

  return (
    <Screen
      header={header}
      refreshControl={createRefreshControl(refreshing, refreshHub)}
    >
      <SearchBar
        loading={loading}
        onChangeText={handleQueryChange}
        onClear={clearSearch}
        onSubmit={search}
        value={query}
      />
      <FilterChips
        accessibilityLabel="Choose catalogue view"
        value={mode}
        onChange={(nextMode) => router.setParams({ mode: nextMode })}
        options={[
          { label: "Browse", value: "browse" },
          { label: `Stock (${inventory.total})`, value: "stock" },
        ]}
      />
      {mode === "stock" ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={commonStyles.sectionTitle}>Live stock</Text>
            <Text style={commonStyles.caption}>{inventory.total} variants</Text>
          </View>
          <InventoryList
            {...inventory}
            filter={stockFilter}
            onFilterChange={(nextFilter) =>
              router.setParams({ filter: nextFilter })
            }
          />
        </>
      ) : (
        <>
          {error || brandError ? (
            <Text style={styles.error}>{error ?? brandError}</Text>
          ) : null}
          {!hasSearchQuery ? (
            <>
              <View style={styles.sectionHead}>
                <Text style={commonStyles.sectionTitle}>Browse by brand</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAddDeviceOpen(true)}
                  style={styles.addDeviceLink}
                >
                  <Text style={styles.addDeviceLabel}>Add phone</Text>
                </Pressable>
              </View>
              {loadingBrands ? (
                <SkeletonList count={5} variant="brand" />
              ) : null}
              {!loadingBrands && brands.length
                ? brands.map((brand, index) => (
                    <Pressable
                      accessibilityLabel={`Browse ${brand.brand} models`}
                      accessibilityRole="button"
                      key={`${brand.brand}-${index}`}
                      onPress={() =>
                        router.push({
                          pathname: "/brand/[brand]",
                          params: { brand: brand.brand },
                        })
                      }
                      style={({ pressed }) => [
                        styles.brandCard,
                        pressed && styles.pressed,
                      ]}
                    >
                      <BrandLogo brand={brand.brand} />
                      <View style={styles.brandCopy}>
                        <Text style={styles.brandName}>{brand.brand}</Text>
                        <Text style={commonStyles.caption}>
                          Browse all phone models
                        </Text>
                      </View>
                      <View style={styles.modelCount}>
                        <Text style={styles.modelCountValue}>
                          {brand.modelCount}
                        </Text>
                        <Text style={styles.modelCountLabel}>models</Text>
                      </View>
                    </Pressable>
                  ))
                : null}
              {!loadingBrands && !brands.length && !brandError ? (
                <EmptyState
                  title="No phone brands yet"
                  message="Import the device catalogue to browse models by brand."
                />
              ) : null}
            </>
          ) : null}
          {noResults ? (
            <EmptyState
              title="Nothing matched"
              message="Try a different phone model."
            />
          ) : null}
          {hasSearchQuery && !noResults ? (
            <FilterChips
              accessibilityLabel="Filter search results"
              value={resultFilter}
              onChange={setResultFilter}
              options={[
                {
                  label: `All (${results.devices.length + results.covers.length})`,
                  value: "all",
                },
                {
                  label: `Devices (${results.devices.length})`,
                  value: "devices",
                },
                { label: `Covers (${results.covers.length})`, value: "covers" },
              ]}
            />
          ) : null}
          {showDevices && results?.devices.length ? (
            <>
              <Text style={commonStyles.sectionTitle}>Devices</Text>
              {results.devices.map((device, index) => (
                <DeviceCard
                  device={device}
                  key={`${device.id}-${index}`}
                  onPress={() =>
                    router.push({
                      pathname: "/device/[id]",
                      params: { id: device.id },
                    })
                  }
                />
              ))}
            </>
          ) : null}
          {showCovers && results?.covers.length ? (
            <>
              <Text style={commonStyles.sectionTitle}>Covers</Text>
              {results.covers.map((cover, index) => (
                <CoverCard
                  cover={cover}
                  key={`${cover.id}-${index}`}
                  onPress={() =>
                    router.push({
                      pathname: "/cover/[id]",
                      params: { id: cover.id },
                    })
                  }
                />
              ))}
            </>
          ) : null}
          {results.hasMore ? (
            <Button
              label="Load more results"
              loading={loading}
              onPress={loadMore}
              variant="secondary"
            />
          ) : null}
          {hasSearchQuery &&
          !noResults &&
          ((resultFilter === "devices" && !results.devices.length) ||
            (resultFilter === "covers" && !results.covers.length)) ? (
            <EmptyState
              title="No results in this filter"
              message="Try viewing all results or refine your search."
            />
          ) : null}
        </>
      )}
      <AddDeviceModal
        brands={brands}
        visible={addDeviceOpen}
        onAdded={deviceAdded}
        onClose={() => setAddDeviceOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    color: colors.danger,
    fontWeight: "700",
    padding: spacing.md,
  },
  brandCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 76,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  brandCopy: { flex: 1 },
  brandName: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  modelCount: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    marginLeft: "auto",
    minWidth: 42,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  modelCountValue: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  modelCountLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  addDeviceLink: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  addDeviceLabel: { color: colors.primary, fontSize: 13, fontWeight: "900" },
  device: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  deviceCopy: { flex: 1 },
  deviceBrand: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  deviceModel: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 3,
  },
  pressed: { opacity: 0.72 },
});
