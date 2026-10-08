import { useCallback } from "react";
import { useDebouncedSearch } from "./useDebouncedSearch";

export function useSearchViewModel() {
  const { setQuery, ...state } = useDebouncedSearch();
  const clear = useCallback(() => setQuery(""), [setQuery]);
  return { ...state, setQuery, clear };
}
