import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../../lib/api";
import type { Cover, StockMutation, TransactionType } from "../../types/domain";
import { useDataSyncStore } from "../../lib/dataSync";
import type { InventoryFilter, InventorySort } from "./InventoryView";

const maximumLoadedCovers = 100;

const matchesFilter = (cover: Cover, filter: InventoryFilter) => {
  if (filter === "in_stock") return cover.quantityOnHand > 0;
  if (filter === "low_stock")
    return (
      cover.quantityOnHand > 0 &&
      cover.quantityOnHand <= cover.reorderThreshold
    );
  if (filter === "attention")
    return (
      cover.quantityOnHand === 0 ||
      (cover.quantityOnHand > 0 &&
        cover.quantityOnHand <= cover.reorderThreshold)
    );
  if (filter === "out_of_stock") return cover.quantityOnHand === 0;
  return true;
};

export function useInventoryViewModel(
  filter: InventoryFilter = "all",
  sort: InventorySort = "recent",
  enabled = true,
) {
  const latestStockMutation = useDataSyncStore(
    (state) => state.latestStockMutation,
  );
  const publishStockMutation = useDataSyncStore(
    (state) => state.publishStockMutation,
  );
  const deviceRevision = useDataSyncStore((state) => state.deviceRevision);
  const activeListKey = useRef(`${filter}:${sort}`);
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
    if (!enabled) return;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const page = await api.getCovers({ filter, sort });
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
  }, [enabled, filter, sort]);
  const covers = useMemo(() => {
    if (!latestStockMutation) return state.covers;
    const index = state.covers.findIndex(
      (cover) => cover.id === latestStockMutation.cover.id,
    );
    if (index >= 0)
      return state.covers
        .map((cover) =>
          cover.id === latestStockMutation.cover.id
            ? latestStockMutation.cover
            : cover,
        )
        .filter((cover) => matchesFilter(cover, filter));
    return state.nextOffset === null &&
      matchesFilter(latestStockMutation.cover, filter)
      ? [latestStockMutation.cover, ...state.covers]
      : state.covers;
  }, [filter, latestStockMutation, state.covers, state.nextOffset]);
  const total = useMemo(() => {
    if (!latestStockMutation) return state.total;
    const previous = state.covers.find(
      (cover) => cover.id === latestStockMutation.cover.id,
    );
    if (previous)
      return (
        state.total +
        Number(matchesFilter(latestStockMutation.cover, filter)) -
        Number(matchesFilter(previous, filter))
      );
    return covers !== state.covers ? state.total + 1 : state.total;
  }, [covers, filter, latestStockMutation, state.covers, state.total]);
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      let active = true;
      const requestedRevision = deviceRevision;
      const listKey = `${filter}:${sort}`;
      const listChanged = activeListKey.current !== listKey;
      activeListKey.current = listKey;
      setState((current) => ({
        ...current,
        covers: listChanged ? [] : current.covers,
        nextOffset: listChanged ? null : current.nextOffset,
        loading: true,
        error: null,
      }));
      api
        .getCovers({ filter, sort })
        .then((page) => {
          if (active && requestedRevision === deviceRevision)
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
    }, [deviceRevision, enabled, filter, sort]),
  );
  const loadMore = useCallback(async () => {
    const offset = state.nextOffset;
    if (
      offset === null ||
      !enabled ||
      state.loading ||
      state.covers.length >= maximumLoadedCovers
    )
      return;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const page = await api.getCovers({ filter, sort, offset });
      setState((current) => ({
        ...current,
        covers: [...current.covers, ...page.items].slice(
          0,
          maximumLoadedCovers,
        ),
        nextOffset:
          current.covers.length + page.items.length >= maximumLoadedCovers
            ? null
            : page.nextOffset,
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
  }, [enabled, filter, sort, state.covers.length, state.loading, state.nextOffset]);
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
        publishStockMutation(result);
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
    [publishStockMutation],
  );
  return { ...state, covers, total, refresh: load, loadMore, updateStock };
}
