import { StyleSheet } from "react-native";
import { colors, font, radius, spacing } from "./tokens";

export const commonStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.md,
    // Leaves clear space above the floating bottom tabs on every scrollable screen.
    // The floating tab bar sits over content while scrolling. This leaves the
    // final row fully visible once the list reaches the end.
    paddingBottom: spacing.xxxl * 4 + spacing.md,
    gap: spacing.md,
  },
  title: {
    color: colors.ink,
    fontFamily: font.family.bold,
    fontSize: font.size.display,
    fontWeight: "800",
    lineHeight: font.lineHeight.display,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: font.size.title,
    fontWeight: "800",
    lineHeight: font.lineHeight.title,
  },
  body: {
    color: colors.muted,
    fontSize: font.size.body,
    lineHeight: font.lineHeight.body,
  },
  caption: {
    color: colors.muted,
    fontSize: font.size.caption,
    lineHeight: font.lineHeight.caption,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center" },
});
