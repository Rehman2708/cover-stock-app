import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import type { SearchResults } from "../../types/domain";

const emptyResults = (): SearchResults => ({ covers: [], devices: [] });
const maximumSearchResults = 60;

interface SearchState {
  results: SearchResults;
  loading: boolean;
  error: string | null;
}

/**
 * Searches after typing settles and makes sure an older response cannot replace
 * the results for a newer query.
 */
export function useDebouncedSearch({
  brand,
  debounceMs = 300,
}: { brand?: string; debounceMs?: number } = {}) {
  const latestStockMutation = useDataSyncStore(
    (state) => state.latestStockMutation,
  );
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({
    results: emptyResults(),
    loading: false,
    error: null,
  });
  const latestRequest = useRef(0);

  const runSearch = useCallback(
    async (term: string, requestId: number, offset = 0, append = false) => {
      try {
        const results = await api.search(term, brand, offset);
        if (latestRequest.current === requestId)
          setState((current) => ({
            results: append
              ? {
                  ...results,
                  covers: [...current.results.covers, ...results.covers].slice(
                    0,
                    maximumSearchResults,
                  ),
                  devices: [
                    ...current.results.devices,
                    ...results.devices,
                  ].slice(0, maximumSearchResults),
                  hasMore:
                    current.results.covers.length + results.covers.length <
                      maximumSearchResults &&
                    current.results.devices.length + results.devices.length <
                      maximumSearchResults &&
                    results.hasMore,
                }
              : results,
            loading: false,
            error: null,
          }));
      } catch (reason) {
        if (latestRequest.current === requestId) {
          setState({
            results: emptyResults(),
            loading: false,
            error:
              reason instanceof Error
                ? reason.message
                : "Unable to search the catalogue.",
          });
        }
      }
    },
    [brand],
  );

  const setSearchQuery = useCallback((nextQuery: string) => {
    latestRequest.current += 1;
    setQuery(nextQuery);
    setState(
      nextQuery.trim()
        ? { results: emptyResults(), loading: true, error: null }
        : { results: emptyResults(), loading: false, error: null },
    );
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) return undefined;

    const requestId = latestRequest.current;
    const timeout = setTimeout(() => {
      if (latestRequest.current === requestId) void runSearch(term, requestId);
    }, debounceMs);
    return () => clearTimeout(timeout);
  }, [debounceMs, query, runSearch]);

  const results = useMemo(
    () =>
      latestStockMutation
        ? (() => {
            const compatibleDeviceIds = new Set(
              latestStockMutation.cover.compatibleDevices?.map(
                (device) => device.id,
              ) ?? [],
            );
            return {
              ...state.results,
              covers: state.results.covers.map((cover) =>
                cover.id === latestStockMutation.cover.id
                  ? latestStockMutation.cover
                  : cover,
              ),
              devices: state.results.devices.map((device) =>
                compatibleDeviceIds.has(device.id)
                  ? {
                      ...device,
                      inventory: device.inventory
                        ? {
                            ...device.inventory,
                            unitsOnHand: Math.max(
                              0,
                              device.inventory.unitsOnHand +
                                latestStockMutation.transaction.quantityDelta,
                            ),
                          }
                        : device.inventory,
                    }
                  : device,
              ),
            };
          })()
        : state.results,
    [latestStockMutation, state.results],
  );

  const searchNow = useCallback(async () => {
    const term = query.trim();
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    if (!term) {
      setState({ results: emptyResults(), loading: false, error: null });
      return;
    }

    setState({ results: emptyResults(), loading: true, error: null });
    await runSearch(term, requestId);
  }, [query, runSearch]);

  const loadMore = useCallback(async () => {
    const term = query.trim();
    const offset = state.results.nextOffset;
    if (!term || offset === null || offset === undefined || state.loading)
      return;
    const requestId = latestRequest.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    await runSearch(term, requestId, offset, true);
  }, [query, runSearch, state.loading, state.results.nextOffset]);

  return {
    query,
    setQuery: setSearchQuery,
    ...state,
    results,
    searchNow,
    loadMore,
  };
}
