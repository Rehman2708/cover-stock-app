import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import type { SearchResults } from "../../types/domain";

const emptyResults = (): SearchResults => ({ covers: [], devices: [] });
const maximumSearchResults = 60;
export type SearchSort = "relevance" | "name_asc" | "name_desc";

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
  sort = "relevance",
}: { brand?: string; debounceMs?: number; sort?: SearchSort } = {}) {
  const latestStockMutation = useDataSyncStore(
    (state) => state.latestStockMutation,
  );
  const deviceRevision = useDataSyncStore((state) => state.deviceRevision);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({
    results: emptyResults(),
    loading: false,
    error: null,
  });
  const latestRequest = useRef(0);
  const handledDeviceRevision = useRef(deviceRevision);

  const runSearch = useCallback(
    async (term: string, requestId: number, offset = 0, append = false) => {
      try {
        const results = await api.search(term, brand, offset, sort);
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
          setState((current) => ({
            // A failed later page should leave the results already on screen
            // intact so the next end-of-list gesture can safely retry.
            results: append ? current.results : emptyResults(),
            loading: false,
            error:
              reason instanceof Error
                ? reason.message
                : "Unable to search the catalogue.",
          }));
        }
      }
    },
    [brand, sort],
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
      if (latestRequest.current === requestId) {
        setState((current) => ({ ...current, loading: true, error: null }));
        void runSearch(term, requestId);
      }
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

  // Device edits and compatibility changes alter search cards without creating
  // a stock mutation. Re-run an active search as soon as that shared revision
  // changes, rather than making staff pull to refresh for the latest data.
  useEffect(() => {
    if (handledDeviceRevision.current === deviceRevision) return;
    handledDeviceRevision.current = deviceRevision;
    if (!query.trim()) return;
    const timeout = setTimeout(() => void searchNow(), 0);
    return () => clearTimeout(timeout);
  }, [deviceRevision, query, searchNow]);

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
