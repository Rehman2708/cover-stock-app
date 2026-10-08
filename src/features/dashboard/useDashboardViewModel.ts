import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../../lib/api";
import type { DashboardData } from "../../types/domain";

export function useDashboardViewModel() {
  const [state, setState] = useState<{
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      setState({ data: await api.getDashboard(), loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the dashboard.",
      });
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      api
        .getDashboard()
        .then((data) => {
          if (active) setState({ data, loading: false, error: null });
        })
        .catch((error: unknown) => {
          if (active)
            setState({
              data: null,
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
    }, []),
  );
  return { ...state, refresh: load };
}
