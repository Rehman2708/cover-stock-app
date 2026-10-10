import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
import { AddDeviceModal } from "../../components/common/AddDeviceModal";
import { Button } from "../../components/common/Button";
import { DeviceCard } from "../../components/common/DeviceCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ListToolbar } from "../../components/common/ListToolbar";
import { LoadingMore } from "../../components/common/LoadingMore";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { SkeletonList } from "../../components/common/Skeleton";
import { SearchBar } from "../../components/common/SearchBar";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import {
  type SearchSort,
  useDebouncedSearch,
} from "../../features/search/useDebouncedSearch";
import type { Device, DeviceBrand } from "../../types/domain";

const maximumLoadedModels = 100;
const deleteRevealWidth = 92;
type ModelSort = "model_asc" | "model_desc";
type AvailabilityFilter = "all" | "in_stock" | "out_of_stock";
interface BrandBrowseSnapshot {
  models: Device[];
  nextOffset: number | null;
  totalModels: number;
  modelSort: ModelSort;
  availabilityFilter: AvailabilityFilter;
  searchSort: SearchSort;
}
const brandBrowseCache = new Map<string, BrandBrowseSnapshot>();

export default function BrandRoute() {
  const { brand } = useLocalSearchParams<{ brand: string }>();
  const cachedSnapshot = brandBrowseCache.get(brand);
  const [models, setModels] = useState<Device[]>(cachedSnapshot?.models ?? []);
  const modelsRef = useRef<Device[]>(cachedSnapshot?.models ?? []);
  const modelsLoadingRef = useRef(false);
  const [modelSort, setModelSort] = useState<ModelSort>(
    cachedSnapshot?.modelSort ?? "model_asc",
  );
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>(
      cachedSnapshot?.availabilityFilter ?? "all",
    );
  const [searchSort, setSearchSort] = useState<SearchSort>(
    cachedSnapshot?.searchSort ?? "relevance",
  );
  const {
    query,
    setQuery,
    results,
    loading: loadingSearch,
    error: searchError,
    searchNow,
    loadMore,
  } = useDebouncedSearch({
    brand,
    sort: searchSort,
    cacheKey: `brand-search:${brand}`,
  });
  const [loadingModels, setLoadingModels] = useState(
    !cachedSnapshot?.models.length,
  );
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(
    cachedSnapshot?.nextOffset ?? null,
  );
  const [totalModels, setTotalModels] = useState(
    cachedSnapshot?.totalModels ?? 0,
  );
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [openDeleteDeviceId, setOpenDeleteDeviceId] = useState<string | null>(
    null,
  );
  const deviceRevision = useDataSyncStore((state) => state.deviceRevision);
  const publishDevice = useDataSyncStore((state) => state.publishDevice);
  const restoredInitialModels = useRef(
    Boolean(cachedSnapshot?.models.length),
  );
  const lastLoadKey = useRef(`${brand}:${availabilityFilter}:${modelSort}`);
  const lastDeviceRevision = useRef(deviceRevision);
  const currentLoadKey = `${brand}:${availabilityFilter}:${modelSort}`;

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  useEffect(() => {
    brandBrowseCache.set(brand, {
      models,
      nextOffset,
      totalModels,
      modelSort,
      availabilityFilter,
      searchSort,
    });
  }, [
    availabilityFilter,
    brand,
    modelSort,
    models,
    nextOffset,
    searchSort,
    totalModels,
  ]);

  const loadModels = useCallback(
    async (offset = 0) => {
      if (modelsLoadingRef.current) return;
      modelsLoadingRef.current = true;
      setLoadingModels(true);
      try {
        const page = await api.getDevices({
          brand,
          filter: availabilityFilter,
          offset,
          sort: modelSort,
        });
        const nextModels = offset
          ? [...modelsRef.current, ...page.items].slice(0, maximumLoadedModels)
          : page.items;
        modelsRef.current = nextModels;
        setModels(nextModels);
        setNextOffset(
          nextModels.length >= maximumLoadedModels ? null : page.nextOffset,
        );
        setTotalModels(page.total);
        setModelsError(null);
      } catch (reason) {
        setModelsError(
          reason instanceof Error
            ? reason.message
            : "Unable to load phone models.",
        );
      } finally {
        modelsLoadingRef.current = false;
        setLoadingModels(false);
      }
    },
    [availabilityFilter, brand, modelSort],
  );
  useEffect(() => {
    const settingsChanged = lastLoadKey.current !== currentLoadKey;
    const revisionChanged = lastDeviceRevision.current !== deviceRevision;
    lastLoadKey.current = currentLoadKey;
    lastDeviceRevision.current = deviceRevision;
    if (
      restoredInitialModels.current &&
      !settingsChanged &&
      !revisionChanged
    ) {
      restoredInitialModels.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      void loadModels();
    }, 0);
    return () => clearTimeout(timeout);
  }, [currentLoadKey, deviceRevision, loadModels]);
  useEffect(() => {
    let mounted = true;
    api
      .getDeviceBrands()
      .then((items) => {
        if (mounted) setBrands(items);
      })
      .catch(() => {
        // The current route's brand remains available as a fallback below.
      });
    return () => {
      mounted = false;
    };
  }, [deviceRevision]);
  const refreshBrand = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        api
          .getDevices({
            brand,
            filter: availabilityFilter,
            sort: modelSort,
          })
          .then((page) => {
            setModels(page.items);
            setNextOffset(page.nextOffset);
            setTotalModels(page.total);
            setModelsError(null);
          }),
        query.trim() ? searchNow() : Promise.resolve(),
      ]);
    } catch (reason) {
      setModelsError(
        reason instanceof Error
          ? reason.message
          : "Unable to load phone models.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [availabilityFilter, brand, modelSort, query, searchNow]);
  const hasSearchQuery = Boolean(query.trim());
  const loadNextModels = () => {
    if (nextOffset !== null) void loadModels(nextOffset);
  };
  const deleteDevice = async (device: Device) => {
    setDeletingDeviceId(device.id);
    try {
      await api.removeDevice(device.id);
      const remainingModels = modelsRef.current.filter(
        (item) => item.id !== device.id,
      );
      modelsRef.current = remainingModels;
      setModels(remainingModels);
      setTotalModels((current) => Math.max(0, current - 1));
      publishDevice(device);
    } catch (reason) {
      Alert.alert(
        "Couldn’t remove device",
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.",
      );
    } finally {
      setDeletingDeviceId(null);
    }
  };
  const confirmDeleteDevice = (device: Device) => {
    Alert.alert(
      "Remove this device?",
      `${device.brand} ${device.model} will be removed from the active catalogue and search. Stock history is kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove device",
          style: "destructive",
          onPress: () => void deleteDevice(device),
        },
      ],
    );
  };
  const header = (
    <AppHeader
      eyebrow="PHONE BRAND"
      title={brand}
      subtitle="Browse models or search the complete catalogue"
      left={<BackButton onPress={() => router.back()} />}
      right={
        <Button
          label="Add device"
          onPress={() => setAddDeviceOpen(true)}
          size="compact"
        />
      }
    />
  );
  return (
    <Screen
      header={header}
      refreshControl={createRefreshControl(refreshing, () => {
        void refreshBrand();
      })}
      onEndReached={
        hasSearchQuery
          ? results.hasMore
            ? loadMore
            : undefined
          : nextOffset !== null
            ? loadNextModels
            : undefined
      }
    >
      <SearchBar
        loading={loadingSearch}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
        onSubmit={searchNow}
        value={query}
      />
      {searchError || modelsError ? (
        <Text style={styles.error}>{searchError ?? modelsError}</Text>
      ) : null}
      {hasSearchQuery ? (
        <>
          <Text style={commonStyles.sectionTitle}>Search results</Text>
          <ListToolbar
            sort={{
              accessibilityLabel: "Sort brand search results",
              value: searchSort,
              onApply: setSearchSort,
              options: [
                { label: "Best match", value: "relevance" },
                { label: "Name: A–Z", value: "name_asc" },
                { label: "Name: Z–A", value: "name_desc" },
              ],
            }}
          />
          {loadingSearch &&
          !results.devices.length &&
          !results.covers.length ? (
            <SkeletonList count={3} variant="deviceWithoutBrand" />
          ) : null}
          {results.devices.map((device, index) => (
            <DeviceRow
              device={device}
              deleting={deletingDeviceId === device.id}
              isDeleteOpen={openDeleteDeviceId === device.id}
              key={`${device.id}-${index}`}
              onDelete={confirmDeleteDevice}
              onDeleteOpenChange={(open) =>
                setOpenDeleteDeviceId(open ? device.id : null)
              }
            />
          ))}
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
          {results.hasMore && loadingSearch ? <LoadingMore /> : null}
          {!loadingSearch &&
          !results.devices.length &&
          !results.covers.length ? (
            <EmptyState
              title="Nothing matched"
              message="Try a different phone model."
            />
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.modelsHeader}>
            <Text style={commonStyles.sectionTitle}>{totalModels} models</Text>
            <ListToolbar
              filter={{
                accessibilityLabel: "Filter phone models by availability",
                value: availabilityFilter,
                onApply: setAvailabilityFilter,
                options: [
                  { label: "All models", value: "all" },
                  { label: "In stock", value: "in_stock" },
                  { label: "Out of stock", value: "out_of_stock" },
                ],
              }}
              sort={{
                accessibilityLabel: "Sort phone models",
                value: modelSort,
                onApply: setModelSort,
                options: [
                  { label: "Name: A–Z", value: "model_asc" },
                  { label: "Name: Z–A", value: "model_desc" },
                ],
              }}
            />
          </View>
          {loadingModels && !models.length ? (
            <SkeletonList count={5} variant="deviceWithoutBrand" />
          ) : null}
          {models.map((device, index) => (
            <DeviceRow
              device={device}
              deleting={deletingDeviceId === device.id}
              isDeleteOpen={openDeleteDeviceId === device.id}
              key={`${device.id}-${index}`}
              onDelete={confirmDeleteDevice}
              onDeleteOpenChange={(open) =>
                setOpenDeleteDeviceId(open ? device.id : null)
              }
            />
          ))}
          {nextOffset !== null && loadingModels ? <LoadingMore /> : null}
          {!loadingModels && !models.length && !modelsError ? (
            <EmptyState
              title="No models found"
              message="This brand does not have imported models yet."
            />
          ) : null}
        </>
      )}
      <AddDeviceModal
        brands={
          brands.length ? brands : [{ brand, modelCount: totalModels }]
        }
        initialBrand={brand}
        key={`${addDeviceOpen}-${brand}`}
        visible={addDeviceOpen}
        onAdded={() => {
          setAddDeviceOpen(false);
          void refreshBrand();
        }}
        onClose={() => setAddDeviceOpen(false)}
      />
    </Screen>
  );
}
function DeviceRow({
  device,
  deleting,
  isDeleteOpen,
  onDelete,
  onDeleteOpenChange,
}: {
  device: Device;
  deleting: boolean;
  isDeleteOpen: boolean;
  onDelete: (device: Device) => void;
  onDeleteOpenChange: (open: boolean) => void;
}) {
  const [translateX] = useState(() => new Animated.Value(0));
  const [openSide, setOpenSide] = useState<"left" | "right" | null>(null);
  const animateTo = useCallback(
    (value: number, side: "left" | "right" | null) => {
      setOpenSide(side);
      Animated.timing(translateX, {
        toValue: value,
        duration: 180,
        useNativeDriver: true,
      }).start();
    },
    [translateX],
  );
  const close = useCallback(() => {
    animateTo(0, null);
    onDeleteOpenChange(false);
  }, [animateTo, onDeleteOpenChange]);
  const open = useCallback(
    (side: "left" | "right") => {
      animateTo(side === "left" ? deleteRevealWidth : -deleteRevealWidth, side);
      onDeleteOpenChange(true);
    },
    [animateTo, onDeleteOpenChange],
  );
  useEffect(() => {
    if (!isDeleteOpen && openSide) {
      const timeout = setTimeout(() => animateTo(0, null), 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [animateTo, isDeleteOpen, openSide]);
  useEffect(() => {
    if (!openSide) return undefined;
    const timeout = setTimeout(close, 5_000);
    return () => clearTimeout(timeout);
  }, [close, openSide]);
  const handleCardPress = useCallback(() => {
    if (openSide) {
      close();
      return;
    }
    router.push({ pathname: "/device/[id]", params: { id: device.id } });
  }, [close, device.id, openSide]);
  const panResponder = useMemo(() => {
    const startPosition =
      openSide === "left"
        ? deleteRevealWidth
        : openSide === "right"
          ? -deleteRevealWidth
          : 0;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        const nextPosition = Math.max(
          -deleteRevealWidth,
          Math.min(deleteRevealWidth, startPosition + gesture.dx),
        );
        translateX.setValue(nextPosition);
      },
      onPanResponderRelease: (_, gesture) => {
        const finalPosition = startPosition + gesture.dx;
        if (finalPosition > deleteRevealWidth / 2) open("left");
        else if (finalPosition < -deleteRevealWidth / 2) open("right");
        else close();
      },
      onPanResponderTerminate: close,
    });
  }, [close, open, openSide, translateX]);

  return (
    <View style={styles.swipeShell}>
      <View pointerEvents={openSide ? "auto" : "none"} style={styles.deleteActions}>
        <DeleteAction
          deleting={deleting}
          onPress={() => {
            close();
            onDelete(device);
          }}
        />
        <DeleteAction
          deleting={deleting}
          onPress={() => {
            close();
            onDelete(device);
          }}
        />
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <DeviceCard device={device} onPress={handleCardPress} showBrand={false} />
      </Animated.View>
    </View>
  );
}

function DeleteAction({
  deleting,
  onPress,
}: {
  deleting: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Remove device"
      accessibilityRole="button"
      disabled={deleting}
      onPress={onPress}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteLabel}>{deleting ? "Removing…" : "Delete"}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  modelsHeader: {
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
  swipeShell: { borderRadius: radius.lg, overflow: "hidden" },
  deleteActions: {
    ...StyleSheet.absoluteFill,
    alignItems: "stretch",
    backgroundColor: colors.danger,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deleteAction: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: deleteRevealWidth,
    paddingHorizontal: spacing.sm,
  },
  deleteLabel: { color: colors.white, fontSize: 13, fontWeight: "800" },
});
