import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { InventoryTransaction, TransactionType } from "../../types/domain";
import { type ThemeColors } from "../../design-system/ThemeProvider";
import { colors as defaultColors } from "../../design-system/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

export interface ActivityMeta {
  label: string;
  icon: IconName;
  color: string;
  softColor: string;
}

export function activityMeta(
  type: TransactionType,
  colors: ThemeColors = defaultColors,
): ActivityMeta {
  const values: Record<TransactionType, ActivityMeta> = {
    sale: {
      label: "Sale",
      icon: "cart-outline",
      color: colors.danger,
      softColor: colors.dangerSoft,
    },
    restock: {
      label: "Restock",
      icon: "cube-outline",
      color: colors.success,
      softColor: colors.successSoft,
    },
    adjustment: {
      label: "Correction",
      icon: "create-outline",
      color: colors.warning,
      softColor: colors.warningSoft,
    },
    return: {
      label: "Return",
      icon: "arrow-undo-outline",
      color: colors.primary,
      softColor: colors.primarySoft,
    },
    damaged: {
      label: "Damaged",
      icon: "alert-circle-outline",
      color: colors.danger,
      softColor: colors.dangerSoft,
    },
    opening_balance: {
      label: "Opening stock",
      icon: "storefront-outline",
      color: colors.primary,
      softColor: colors.primarySoft,
    },
    compatibility_link: {
      label: "Phone linked",
      icon: "link-outline",
      color: colors.primary,
      softColor: colors.primarySoft,
    },
    compatibility_unlink: {
      label: "Phone unlinked",
      icon: "unlink-outline",
      color: colors.warning,
      softColor: colors.warningSoft,
    },
  };
  return values[type];
}

export function activityNote(item: InventoryTransaction) {
  if (item.reason) return item.reason;
  if (item.note && item.note !== "Opening balance") return item.note;
  if (item.type === "sale") return "Customer purchase";
  if (item.type === "restock") return "Stock received";
  if (item.type === "return") return "Customer return";
  if (item.type === "damaged") return "Damaged stock removed";
  if (item.type === "opening_balance") return "Starting quantity";
  if (item.type === "compatibility_link") return "Compatible phone linked";
  if (item.type === "compatibility_unlink") return "Compatible phone unlinked";
  return "Stock count correction";
}

export function activityDayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dateOnly = date.toDateString();
  const formatted = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (dateOnly === today.toDateString()) return `Today · ${formatted}`;
  if (dateOnly === yesterday.toDateString()) return `Yesterday · ${formatted}`;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function activityTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function stockTransition(item: InventoryTransaction) {
  if (item.type === "compatibility_link") return "Fitment linked";
  if (item.type === "compatibility_unlink") return "Fitment unlinked";
  if (
    Number.isInteger(item.quantityBefore) &&
    Number.isInteger(item.quantityAfter)
  )
    return `${item.quantityBefore} → ${item.quantityAfter}`;
  return "Stock updated";
}
