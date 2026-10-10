import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { AddDeviceModal } from "../../components/common/AddDeviceModal";
import { LoadingMore } from "../../components/common/LoadingMore";
import { BrandLogo } from "../../components/common/BrandLogo";
import { DeviceCard } from "../../components/common/DeviceCard";
import { EmptyState } from "../../components/common/EmptyState";
import { FilterChips } from "../../components/common/FilterChips";
import { ListToolbar } from "../../components/common/ListToolbar";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { SkeletonList } from "../../components/common/Skeleton";
import { SearchBar } from "../../components/common/SearchBar";
import { commonStyles } from "../../design-system/styles";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import {
  InventoryList,
  type InventoryFilter,
  type InventorySort,
} from "../../features/inventory/InventoryView";
import { useInventoryViewModel } from "../../features/inventory/useInventoryViewModel";
import {
  type SearchSort,
  useDebouncedSearch,
} from "../../features/search/useDebouncedSearch";
import type { DeviceBrand } from "../../types/domain";

type SearchResultFilter = "all" | "devices" | "covers";
type InventoryMode = "browse" | "stock";

export default function SearchRoute() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { mode: requestedMode, filter: requestedFilter } =
    useLocalSearchParams<{ mode?: InventoryMode; filter?: InventoryFilter }>();
  const mode: InventoryMode = requestedMode === "stock" ? "stock" : "browse";
  const stockFilter: InventoryFilter =
    requestedFilter &&
    ["all", "in_stock", "attention", "low_stock", "out_of_stock"].includes(requestedFilter)
      ? requestedFilter
      : "all";
  const [stockSort, setStockSort] = useState<InventorySort>("recent");
  const [searchSort, setSearchSort] = useState<SearchSort>("relevance");
  const inventory = useInventoryViewModel(
    stockFilter,
    stockSort,
    mode === "stock",
  );
  const refreshInventory = inventory.refresh;
  const { query, setQuery, results, loading, error, searchNow, loadMore } =
    useDebouncedSearch({ cacheKey: "catalogue-search", sort: searchSort });
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
      mode === "stock" ? refreshInventory() : Promise.resolve(),
      query.trim() ? searchNow() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [loadBrands, mode, query, refreshInventory, searchNow]);
  const hasSearchQuery = Boolean(query.trim());
  // Older API deployments do not include hasStock, so keep every brand in the
  // stocked section until the stock-aware response is available.
  const stockedBrands = brands.filter((brand) => brand.hasStock !== false);
  const otherBrands = brands.filter((brand) => brand.hasStock === false);
  const noResults =
    hasSearchQuery &&
    !loading &&
    results.covers.length === 0 &&
    results.devices.length === 0;
  const searchedModel = query.trim();
  const matchedBrand = brands.find((item) => {
    const brand = item.brand.toLowerCase();
    const searched = searchedModel.toLowerCase();
    return searched === brand || searched.startsWith(`${brand} `);
  });
  const initialDeviceBrand = matchedBrand?.brand;
  const initialDeviceModel = matchedBrand
    ? searchedModel.slice(matchedBrand.brand.length).trim()
    : searchedModel;
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
  const renderBrandCard = (brand: DeviceBrand, index: number) => (
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
      style={({ pressed }) => [styles.brandCard, pressed && styles.pressed]}
    >
      <BrandLogo brand={brand.brand} />
      <View style={styles.brandCopy}>
        <Text style={styles.brandName}>{brand.brand}</Text>
        <Text style={commonStyles.caption}>
          {brand.hasStock === false ? "No covers in stock" : "Covers available"}
        </Text>
      </View>
      <View style={styles.modelCount}>
        <Text style={styles.modelCountValue}>
          {brand.hasStock
            ? brand.stockedModelCount ?? brand.modelCount
            : brand.modelCount}
        </Text>
        <Text style={styles.modelCountLabel}>models</Text>
      </View>
      <Ionicons color={colors.muted} name="chevron-forward" size={20} />
    </Pressable>
  );

  return (
    <Screen
      header={header}
      refreshControl={createRefreshControl(refreshing, refreshHub, colors)}
      onEndReached={
        mode === "stock"
          ? inventory.nextOffset !== null
            ? inventory.loadMore
            : undefined
          : hasSearchQuery && results.hasMore
            ? loadMore
            : undefined
      }
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
          {
            label:
              mode === "stock" && inventory.loading
                ? "Stock"
                : `Stock (${inventory.total})`,
            value: "stock",
          },
        ]}
      />
      {mode === "stock" ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={commonStyles.sectionTitle}>Live stock</Text>
            <ListToolbar
              filter={{
                accessibilityLabel: "Filter inventory",
                value: stockFilter,
                onApply: (nextFilter) =>
                  router.setParams({ filter: nextFilter }),
                options: [
                  { label: "All", value: "all" },
                  { label: "Available", value: "in_stock" },
                  { label: "Need attention", value: "attention" },
                  { label: "Low stock", value: "low_stock" },
                  { label: "Out of stock", value: "out_of_stock" },
                ],
              }}
              sort={{
                accessibilityLabel: "Sort inventory",
                value: stockSort,
                onApply: setStockSort,
                options: [
                  { label: "Recently updated", value: "recent" },
                  { label: "Quantity: low to high", value: "quantity_low" },
                  { label: "Quantity: high to low", value: "quantity_high" },
                ],
              }}
            />
          </View>
          <InventoryList
            {...inventory}
            filter={stockFilter}
            onFilterChange={(nextFilter) =>
              router.setParams({ filter: nextFilter })
            }
            sort={stockSort}
            onSortChange={setStockSort}
            showControls={false}
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
                <Text style={styles.stockedBrandsTitle}>Browse by brand</Text>
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
              {!loadingBrands
                ? stockedBrands.map(renderBrandCard)
                : null}
              {!loadingBrands && otherBrands.length ? (
                <>
                  <View style={styles.otherBrandsHeader}>
                    <Text style={styles.otherBrandsTitle}>Other brands</Text>
                    <Text style={commonStyles.caption}>No covers in stock yet</Text>
                  </View>
                  {otherBrands.map(renderBrandCard)}
                </>
              ) : null}
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
              actionLabel="Add phone model"
              title="Nothing matched"
              message="Add this phone to your catalogue, or try a different model."
              onAction={() => setAddDeviceOpen(true)}
            />
          ) : null}
          {hasSearchQuery && !noResults ? (
            <>
              <View style={styles.sectionHead}>
                <Text style={commonStyles.sectionTitle}>Search results</Text>
                <Pressable
                  accessibilityLabel="Add a phone model"
                  accessibilityRole="button"
                  onPress={() => setAddDeviceOpen(true)}
                  style={({ pressed }) => [
                    styles.addDeviceLink,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.addDeviceLabel}>Add phone</Text>
                </Pressable>
              </View>
              <ListToolbar
                filter={{
                  accessibilityLabel: "Filter search results",
                  value: resultFilter,
                  onApply: setResultFilter,
                  options: [
                    {
                      label: `All (${results.devices.length + results.covers.length})`,
                      value: "all",
                    },
                    {
                      label: `Devices (${results.devices.length})`,
                      value: "devices",
                    },
                    { label: `Covers (${results.covers.length})`, value: "covers" },
                  ],
                }}
                sort={{
                  accessibilityLabel: "Sort search results",
                  value: searchSort,
                  onApply: setSearchSort,
                  options: [
                    { label: "Best match", value: "relevance" },
                    { label: "Name: A–Z", value: "name_asc" },
                    { label: "Name: Z–A", value: "name_desc" },
                  ],
                }}
              />
            </>
          ) : null}
          {showDevices && results?.devices.length ? (
            <>
              <Text style={commonStyles.sectionTitle}>Devices</Text>
              {results.devices.map((device, index) => (
                <DeviceCard
                  device={device}
                  key={`${device.id}-${index}`}
                  showFitCount
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
                <DeviceCard
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
          {results.hasMore && loading ? <LoadingMore /> : null}
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
        initialBrand={hasSearchQuery ? initialDeviceBrand : undefined}
        initialModel={hasSearchQuery ? initialDeviceModel : undefined}
        key={`${addDeviceOpen}-${initialDeviceBrand ?? ""}-${initialDeviceModel}`}
        visible={addDeviceOpen}
        onAdded={deviceAdded}
        onClose={() => setAddDeviceOpen(false)}
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stockedBrandsTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
  },
  otherBrandsHeader: { gap: 2, marginTop: spacing.sm },
  otherBrandsTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
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
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 76,
    padding: spacing.sm,
  },
  brandCopy: { flex: 1, gap: 2 },
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
