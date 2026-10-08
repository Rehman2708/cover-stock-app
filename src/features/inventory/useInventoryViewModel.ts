import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../../lib/api";
import type { Cover, StockMutation, TransactionType } from "../../types/domain";
import type { InventoryFilter } from "./InventoryView";

export function useInventoryViewModel(filter: InventoryFilter = "all") {
  const [state, setState] = useState<{
    covers: Cover[];
    loading: boolean;
    error: string | null;
    changingId: string | null;
    nextOffset: number | null;
    total: number;
  }>({
    covers: [],
    loading: true,
    error: null,
    changingId: null,
    nextOffset: null,
    total: 0,
  });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const page = await api.getCovers({ filter });
      setState((current) => ({
        ...current,
        covers: page.items,
        nextOffset: page.nextOffset,
        total: page.total,
        loading: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error ? error.message : "Unable to load inventory.",
      }));
    }
  }, [filter]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      api
        .getCovers({ filter })
        .then((page) => {
          if (active)
            setState((current) => ({
              ...current,
              covers: page.items,
              nextOffset: page.nextOffset,
              total: page.total,
              loading: false,
              error: null,
            }));
        })
        .catch((error: unknown) => {
          if (active)
            setState((current) => ({
              ...current,
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to load inventory.",
            }));
        });
      return () => {
        active = false;
      };
    }, [filter]),
  );
  const loadMore = useCallback(async () => {
    const offset = state.nextOffset;
    if (offset === null || state.loading) return;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const page = await api.getCovers({ filter, offset });
      setState((current) => ({
        ...current,
        covers: [...current.covers, ...page.items],
        nextOffset: page.nextOffset,
        total: page.total,
        loading: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load more inventory.",
      }));
    }
  }, [filter, state.loading, state.nextOffset]);
  const updateStock = useCallback(
    async (
      cover: Cover,
      type: TransactionType,
      quantity = 1,
    ): Promise<StockMutation> => {
      setState((current) => ({
        ...current,
        changingId: cover.id,
        error: null,
      }));
      try {
        const result = await api.updateStock(cover.id, type, { quantity });
        setState((current) => ({
          ...current,
          changingId: null,
          covers: current.covers.map((item) =>
            item.id === cover.id ? result.cover : item,
          ),
        }));
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update stock.";
        setState((current) => ({
          ...current,
          changingId: null,
          error: message,
        }));
        throw new Error(message);
      }
    },
    [],
  );
  return { ...state, refresh: load, loadMore, updateStock };
}
