import { StyleSheet } from "react-native";
import { colors, font, radius, shadow, spacing } from "./tokens";

export const commonStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.lg,
    // Leaves clear space above the floating bottom tabs on every scrollable screen.
    paddingBottom: spacing.xxxl * 3 + spacing.sm,
    gap: spacing.lg,
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
    padding: spacing.md,
    ...shadow,
  },
  row: { flexDirection: "row", alignItems: "center" },
});
