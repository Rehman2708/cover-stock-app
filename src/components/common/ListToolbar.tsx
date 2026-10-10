import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";
import { useTheme, type ThemeColors } from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { BottomSheetModal } from "./BottomSheetModal";
import { Button } from "./Button";
import { FilterChips, type FilterOption } from "./FilterChips";

type SheetKind = "filter" | "sort" | null;

interface ListToolbarProps<Filter extends string, Sort extends string> {
  filter?: {
    accessibilityLabel: string;
    value: Filter;
    options: FilterOption<Filter>[];
    onApply: (value: Filter) => void;
  };
  sort?: {
    accessibilityLabel: string;
    value: Sort;
    options: FilterOption<Sort>[];
    onApply: (value: Sort) => void;
  };
}

/** Compact list controls that only commit changes after the user chooses Apply. */
export function ListToolbar<Filter extends string, Sort extends string>({
  filter,
  sort,
}: ListToolbarProps<Filter, Sort>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [draftFilter, setDraftFilter] = useState<Filter | undefined>();
  const [draftSort, setDraftSort] = useState<Sort | undefined>();
  if (!filter && !sort) return null;

  const openFilter = () => {
    if (!filter) return;
    setDraftFilter(filter.value);
    setSheet("filter");
  };
  const openSort = () => {
    if (!sort) return;
    setDraftSort(sort.value);
    setSheet("sort");
  };
  const apply = () => {
    if (sheet === "filter" && filter && draftFilter) filter.onApply(draftFilter);
    if (sheet === "sort" && sort && draftSort) sort.onApply(draftSort);
    setSheet(null);
  };
  const active = sheet === "filter" ? filter : sort;
  const draft = sheet === "filter" ? draftFilter : draftSort;
  const setDraft = sheet === "filter" ? setDraftFilter : setDraftSort;

  return (
    <>
      <View style={styles.row}>
        {filter ? (
          <Pressable
            accessibilityLabel="Open filters"
            accessibilityRole="button"
            onPress={openFilter}
            style={({ pressed }) => [styles.control, pressed && styles.pressed]}
          >
            <Ionicons color={colors.primary} name="filter-outline" size={19} />
            <Text style={styles.label}>Filter</Text>
          </Pressable>
        ) : null}
        {sort ? (
          <Pressable
            accessibilityLabel="Open sorting"
            accessibilityRole="button"
            onPress={openSort}
            style={({ pressed }) => [styles.control, pressed && styles.pressed]}
          >
            <Ionicons color={colors.primary} name="swap-vertical-outline" size={19} />
            <Text style={styles.label}>Sort</Text>
          </Pressable>
        ) : null}
      </View>
      <BottomSheetModal
        closeAccessibilityLabel="Close list controls"
        contentStyle={styles.sheet}
        onClose={() => setSheet(null)}
        scrollable
        visible={sheet !== null}
      >
        <Text style={styles.sheetTitle}>{sheet === "filter" ? "Filter" : "Sort"}</Text>
        <Text style={styles.sheetCaption}>
          Choose an option, then apply it to update this list.
        </Text>
        {active && draft ? (
          <FilterChips
            accessibilityLabel={active.accessibilityLabel}
            onChange={setDraft as (value: never) => void}
            options={active.options as FilterOption<never>[]}
            value={draft as never}
            wrap
          />
        ) : null}
        <Button label="Apply" onPress={apply} />
      </BottomSheetModal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: "row", gap: spacing.sm },
    control: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      minHeight: 38,
      paddingHorizontal: spacing.md,
    },
    label: { color: colors.ink, fontSize: 14, fontWeight: "800" },
    pressed: { opacity: 0.7 },
    sheet: { gap: spacing.md },
    sheetTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
    sheetCaption: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  });
