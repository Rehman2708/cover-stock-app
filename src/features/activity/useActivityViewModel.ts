import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import type { InventoryTransaction } from "../../types/domain";
import { useDataSyncStore } from "../../lib/dataSync";

const maximumLoadedActivity = 100;

export function useActivityViewModel() {
  const cachedActivity = useDataSyncStore((state) => state.activity);
  const cacheActivity = useDataSyncStore((state) => state.cacheActivity);
  const latestStockMutation = useDataSyncStore(
    (state) => state.latestStockMutation,
  );
  const [query, setQuery] = useState("");
  const [state, setState] = useState<{
    items: InventoryTransaction[];
    loading: boolean;
    error: string | null;
    nextCursor: string | null;
  }>({ items: cachedActivity, loading: !cachedActivity.length, error: null, nextCursor: null });
  const load = useCallback(
    async (activeQuery = query) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const page = await api.getTransactions({ query: activeQuery });
        if (!activeQuery) cacheActivity(page.items);
        setState({
          items: page.items,
          nextCursor: page.nextCursor,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          items: [],
          nextCursor: null,
          loading: false,
          error:
            error instanceof Error ? error.message : "Unable to load activity.",
        });
      }
    },
    [cacheActivity, query],
  );
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(
      () => {
        api
          .getTransactions({ query })
          .then((page) => {
            if (!query) cacheActivity(page.items);
            if (active)
              setState({
                items: page.items,
                nextCursor: page.nextCursor,
                loading: false,
                error: null,
              });
          })
          .catch((error: unknown) => {
            if (active)
              setState({
                items: [],
                nextCursor: null,
                loading: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unable to load activity.",
              });
          });
      },
      query ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [cacheActivity, query]);
  const items = useMemo(
    () =>
      latestStockMutation && !query.trim()
        ? [
            latestStockMutation.transaction,
            ...state.items.filter(
              (item) => item.id !== latestStockMutation.transaction.id,
            ),
          ]
        : state.items,
    [latestStockMutation, query, state.items],
  );
  const loadMore = useCallback(async () => {
    if (
      !state.nextCursor ||
      state.loading ||
      state.items.length >= maximumLoadedActivity
    )
      return;
    setState((current) => ({ ...current, loading: true }));
    try {
      const page = await api.getTransactions({
        query,
        before: state.nextCursor,
      });
      setState((current) => {
        const items = [...current.items, ...page.items].slice(
          0,
          maximumLoadedActivity,
        );
        return {
          ...current,
          items,
          nextCursor:
            items.length >= maximumLoadedActivity ? null : page.nextCursor,
          loading: false,
        };
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load older activity.",
      }));
    }
  }, [query, state.items.length, state.loading, state.nextCursor]);
  return {
    ...state,
    items,
    query,
    setQuery,
    refresh: () => load(),
    loadMore,
  };
}
