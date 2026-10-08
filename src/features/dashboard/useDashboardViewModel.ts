import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";

export function useDashboardViewModel() {
  const data = useDataSyncStore((state) => state.dashboard);
  const cacheDashboard = useDataSyncStore((state) => state.cacheDashboard);
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: !data, error: null });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      cacheDashboard(await api.getDashboard());
      setState({ loading: false, error: null });
    } catch (error) {
      setState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the dashboard.",
      });
    }
  }, [cacheDashboard]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      api
        .getDashboard()
        .then((data) => {
          if (active) {
            cacheDashboard(data);
            setState({ loading: false, error: null });
          }
        })
        .catch((error: unknown) => {
          if (active)
            setState({
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to load the dashboard.",
            });
        });
      return () => {
        active = false;
      };
    }, [cacheDashboard]),
  );
  return { data, ...state, refresh: load };
}
