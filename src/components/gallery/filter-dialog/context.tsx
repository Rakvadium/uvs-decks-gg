import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import type { CardFilters, StatFilterValue } from "@/providers/UIStateProvider";
import type { SetFilterOption, StatFilterKey, StringArrayFilterKey } from "./types";

type GalleryFiltersContextValue = NonNullable<ReturnType<typeof useGalleryFiltersOptional>>;

interface GalleryFilterDialogContextValue {
  state: GalleryFiltersContextValue["state"];
  actions: GalleryFiltersContextValue["actions"];
  meta: GalleryFiltersContextValue["meta"];
  filters: CardFilters;
  hasActiveFilters: boolean;
  setSearch: string;
  setSetSearch: (value: string) => void;
  clearSetSearch: () => void;
  filteredSets: SetFilterOption[];
  toggleFormat: (formatKey: string) => void;
  toggleStringFilter: (key: StringArrayFilterKey, value: string) => void;
  setStatFilter: (key: StatFilterKey, value: StatFilterValue | undefined) => void;
  setBooleanFilter: (key: "symbolMatchAll" | "keywordMatchAll", checked: boolean) => void;
}

const GalleryFilterDialogContext = createContext<GalleryFilterDialogContextValue | null>(
  null
);

interface GalleryFilterDialogProviderProps {
  filtersContext: GalleryFiltersContextValue;
  children: ReactNode;
}

export function GalleryFilterDialogProvider({
  filtersContext,
  children,
}: GalleryFilterDialogProviderProps) {
  const { state, actions, meta } = filtersContext;
  const filters = state.filters;
  const uniqueValues = meta.uniqueValues;
  const [setSearch, setSetSearch] = useState("");

  const filteredSets = useMemo(() => {
    if (!uniqueValues?.setNames) return [];

    const sets = uniqueValues.setNames.map((name, index) => ({
      name,
      code: uniqueValues.setCodes[index],
      number: uniqueValues.setNumbers?.[index] ?? 0,
    }));

    if (!setSearch.trim()) return sets;

    const search = setSearch.toLowerCase();
    return sets.filter(
      (set) =>
        set.name.toLowerCase().includes(search) ||
        set.code.toLowerCase().includes(search)
    );
  }, [setSearch, uniqueValues]);

  const toggleFormat = useCallback(
    (formatKey: string) => {
      if (filters.format === formatKey) {
        actions.updateFilter("format", undefined);
        return;
      }

      actions.updateFilter("format", formatKey);
    },
    [actions, filters.format]
  );

  const toggleStringFilter = useCallback(
    (key: StringArrayFilterKey, value: string) => {
      const currentValues = (filters[key] ?? []) as string[];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value];

      actions.updateFilter(key, (nextValues.length > 0 ? nextValues : undefined) as CardFilters[typeof key]);
    },
    [actions, filters]
  );

  const setStatFilter = useCallback(
    (key: StatFilterKey, value: StatFilterValue | undefined) => {
      actions.updateFilter(key, value);
    },
    [actions]
  );

  const setBooleanFilter = useCallback(
    (key: "symbolMatchAll" | "keywordMatchAll", checked: boolean) => {
      actions.updateFilter(key, checked ? true : undefined);
    },
    [actions]
  );

  const value = useMemo(
    () => ({
      state,
      actions,
      meta,
      filters,
      hasActiveFilters: meta.activeFilterCount > 0,
      setSearch,
      setSetSearch,
      clearSetSearch: () => setSetSearch(""),
      filteredSets,
      toggleFormat,
      toggleStringFilter,
      setStatFilter,
      setBooleanFilter,
    }),
    [
      state,
      actions,
      meta,
      filters,
      setSearch,
      filteredSets,
      toggleFormat,
      toggleStringFilter,
      setStatFilter,
      setBooleanFilter,
    ]
  );

  return (
    <GalleryFilterDialogContext.Provider value={value}>
      {children}
    </GalleryFilterDialogContext.Provider>
  );
}

export function useGalleryFilterDialogContext() {
  const context = useContext(GalleryFilterDialogContext);

  if (!context) {
    throw new Error(
      "useGalleryFilterDialogContext must be used within GalleryFilterDialogProvider"
    );
  }

  return context;
}
