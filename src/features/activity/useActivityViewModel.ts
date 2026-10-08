import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { InventoryTransaction } from "../../types/domain";

export function useActivityViewModel() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<{
    items: InventoryTransaction[];
    loading: boolean;
    error: string | null;
    nextCursor: string | null;
  }>({ items: [], loading: true, error: null, nextCursor: null });
  const load = useCallback(
    async (activeQuery = query) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const page = await api.getTransactions({ query: activeQuery });
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
    [query],
  );
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(
      () => {
        api
          .getTransactions({ query })
          .then((page) => {
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
  }, [query]);
  const loadMore = useCallback(async () => {
    if (!state.nextCursor || state.loading) return;
    setState((current) => ({ ...current, loading: true }));
    try {
      const page = await api.getTransactions({
        query,
        before: state.nextCursor,
      });
      setState((current) => ({
        ...current,
        items: [...current.items, ...page.items],
        nextCursor: page.nextCursor,
        loading: false,
      }));
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
  }, [query, state.loading, state.nextCursor]);
  return { ...state, query, setQuery, refresh: () => load(), loadMore };
}
