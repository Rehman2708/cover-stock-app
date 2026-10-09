import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
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
import type { Device } from "../../types/domain";

const maximumLoadedModels = 100;
type ModelSort = "model_asc" | "model_desc";

export default function BrandRoute() {
  const { brand } = useLocalSearchParams<{ brand: string }>();
  const [models, setModels] = useState<Device[]>([]);
  const modelsRef = useRef<Device[]>([]);
  const modelsLoadingRef = useRef(false);
  const [modelSort, setModelSort] = useState<ModelSort>("model_asc");
  const [searchSort, setSearchSort] = useState<SearchSort>("relevance");
  const {
    query,
    setQuery,
    results,
    loading: loadingSearch,
    error: searchError,
    searchNow,
    loadMore,
  } = useDebouncedSearch({ brand, sort: searchSort });
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [totalModels, setTotalModels] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const deviceRevision = useDataSyncStore((state) => state.deviceRevision);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const loadModels = useCallback(
    async (offset = 0) => {
      if (modelsLoadingRef.current) return;
      modelsLoadingRef.current = true;
      setLoadingModels(true);
      try {
        const page = await api.getDevices({ brand, offset, sort: modelSort });
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
    [brand, modelSort],
  );
  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadModels();
    }, 0);
    return () => clearTimeout(timeout);
  }, [deviceRevision, loadModels]);
  const refreshBrand = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        api.getDevices({ brand, sort: modelSort }).then((page) => {
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
  }, [brand, modelSort, query, searchNow]);
  const hasSearchQuery = Boolean(query.trim());
  const loadNextModels = () => {
    if (nextOffset !== null) void loadModels(nextOffset);
  };
  const header = (
    <AppHeader
      eyebrow="PHONE BRAND"
      title={brand}
      subtitle="Browse models or search the complete catalogue"
      left={<BackButton onPress={() => router.back()} />}
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
            <DeviceRow device={device} key={`${device.id}-${index}`} />
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
            <DeviceRow device={device} key={`${device.id}-${index}`} />
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
    </Screen>
  );
}
function DeviceRow({ device }: { device: Device }) {
  return (
    <DeviceCard
      device={device}
      onPress={() =>
        router.push({ pathname: "/device/[id]", params: { id: device.id } })
      }
      showBrand={false}
    />
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
});
