import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { Button } from "../../components/common/Button";
import { BackButton } from "../../components/common/BackButton";
import { CoverCard } from "../../components/common/CoverCard";
import { DeviceCard } from "../../components/common/DeviceCard";
import { EmptyState } from "../../components/common/EmptyState";
import { Screen } from "../../components/common/Screen";
import { SkeletonList } from "../../components/common/Skeleton";
import { SearchBar } from "../../components/common/SearchBar";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import { useDebouncedSearch } from "../../features/search/useDebouncedSearch";
import type { Device } from "../../types/domain";

export default function BrandRoute() {
  const { brand } = useLocalSearchParams<{ brand: string }>();
  const [models, setModels] = useState<Device[]>([]);
  const {
    query,
    setQuery,
    results,
    loading: loadingSearch,
    error: searchError,
    searchNow,
    loadMore,
  } = useDebouncedSearch({ brand });
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [totalModels, setTotalModels] = useState(0);

  const loadModels = useCallback(
    async (offset = 0) => {
      setLoadingModels(true);
      try {
        const page = await api.getDevices({ brand, offset });
        setModels((current) =>
          offset ? [...current, ...page.items] : page.items,
        );
        setNextOffset(page.nextOffset);
        setTotalModels(page.total);
        setModelsError(null);
      } catch (reason) {
        setModelsError(
          reason instanceof Error
            ? reason.message
            : "Unable to load phone models.",
        );
      } finally {
        setLoadingModels(false);
      }
    },
    [brand],
  );
  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadModels();
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadModels]);
  const hasSearchQuery = Boolean(query.trim());
  const header = (
    <AppHeader
      eyebrow="PHONE BRAND"
      title={brand}
      subtitle="Browse models or search the complete catalogue"
      left={<BackButton onPress={() => router.back()} />}
    />
  );
  return (
    <Screen header={header}>
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
          {loadingSearch &&
          !results.devices.length &&
          !results.covers.length ? (
            <SkeletonList count={3} variant="deviceWithoutBrand" />
          ) : null}
          {results.devices.map((device, index) => (
            <DeviceRow device={device} key={`${device.id}-${index}`} />
          ))}
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
          {results.hasMore ? (
            <Button
              label="Load more results"
              loading={loadingSearch}
              onPress={loadMore}
              variant="secondary"
            />
          ) : null}
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
          <Text style={commonStyles.sectionTitle}>{totalModels} models</Text>
          {loadingModels && !models.length ? (
            <SkeletonList count={5} variant="deviceWithoutBrand" />
          ) : null}
          {models.map((device, index) => (
            <DeviceRow device={device} key={`${device.id}-${index}`} />
          ))}
          {nextOffset !== null ? (
            <Button
              label="Load more models"
              loading={loadingModels}
              onPress={() => void loadModels(nextOffset)}
              variant="secondary"
            />
          ) : null}
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
  error: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    color: colors.danger,
    fontWeight: "700",
    padding: spacing.md,
  },
});
