import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StockMutation, TransactionType } from "../../types/domain";
import { type ThemeColors, useThemedStyles } from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { Button } from "./Button";
import { BottomSheetModal } from "./BottomSheetModal";
import { QuantityStepper } from "./QuantityStepper";

interface StockActionsProps {
  quantityOnHand: number;
  compact?: boolean;
  dense?: boolean;
  onUpdate: (
    type: Extract<TransactionType, "sale" | "restock">,
    quantity: number,
  ) => Promise<StockMutation>;
}
export function StockActions({
  quantityOnHand,
  compact = false,
  dense = false,
  onUpdate,
}: StockActionsProps) {
  const styles = useThemedStyles(createStyles);
  const [action, setAction] = useState<Extract<
    TransactionType,
    "sale" | "restock"
  > | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [updating, setUpdating] = useState(false);
  const [undo, setUndo] = useState<{
    type: Extract<TransactionType, "sale" | "restock">;
    quantity: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stockOptionsOpen, setStockOptionsOpen] = useState(false);
  useEffect(() => {
    if (!undo) return undefined;
    const timeout = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(timeout);
  }, [undo]);
  const removing = action === "sale";
  const open = (nextAction: Extract<TransactionType, "sale" | "restock">) => {
    setQuantity(1);
    setError(null);
    setAction(nextAction);
  };
  const chooseStockAction = (
    nextAction: Extract<TransactionType, "sale" | "restock">,
  ) => {
    setStockOptionsOpen(false);
    setTimeout(() => open(nextAction), 200);
  };
  const commit = async () => {
    if (!action) return;
    setError(null);
    setUpdating(true);
    try {
      await onUpdate(action, quantity);
      setUndo({ type: action === "sale" ? "restock" : "sale", quantity });
      setAction(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to update stock.",
      );
    } finally {
      setUpdating(false);
    }
  };
  const undoLast = async () => {
    if (!undo) return;
    setError(null);
    setUpdating(true);
    try {
      await onUpdate(undo.type, undo.quantity);
      setUndo(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to undo the stock change.",
      );
    } finally {
      setUpdating(false);
    }
  };
  const canConfirm = !removing || quantity <= quantityOnHand;
  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        {compact ? (
          <View style={styles.action}>
            <Button
              disabled={updating}
              label={quantityOnHand === 0 ? "Add stock" : "Stock actions"}
              onPress={() =>
                quantityOnHand === 0
                  ? open("restock")
                  : setStockOptionsOpen(true)
              }
              size={dense ? "compact" : "regular"}
              variant={quantityOnHand === 0 ? "primary" : "secondary"}
            />
          </View>
        ) : (
          <>
            <View style={styles.action}>
              <Button
                disabled={updating}
                label={quantityOnHand === 0 ? "Add stock for this phone" : "Add stock"}
                onPress={() => open("restock")}
                size={dense ? "compact" : "regular"}
                variant={quantityOnHand === 0 ? "primary" : "secondary"}
              />
            </View>
            {quantityOnHand > 0 ? (
              <View style={styles.action}>
                <Button
                  disabled={updating}
                  label="Remove stock"
                  onPress={() => open("sale")}
                  size={dense ? "compact" : "regular"}
                  variant="ghost"
                />
              </View>
            ) : null}
          </>
        )}
      </View>
      {undo ? (
        <View accessibilityLiveRegion="polite" style={styles.undo}>
          <Text style={styles.undoText}>Stock updated.</Text>
          <Button
            disabled={updating}
            label="Undo"
            onPress={undoLast}
            variant="ghost"
          />
        </View>
      ) : null}
      {error && !action ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <BottomSheetModal
        contentStyle={styles.sheet}
        onClose={() => setAction(null)}
        scrollable
        visible={Boolean(action)}
      >
              <View style={styles.handle} />
              <Text style={styles.eyebrow}>
                {removing ? "UPDATE AVAILABILITY" : "ADD AVAILABILITY"}
              </Text>
              <Text style={styles.title}>
                {removing
                  ? "Remove covers from stock?"
                  : "How many covers are you adding?"}
              </Text>
              <Text style={styles.body}>
                {removing
                  ? "This lowers the available count. You can undo it immediately after confirming."
                  : "This increases the available count for this phone."}
              </Text>
              <QuantityStepper
                maximum={removing ? quantityOnHand : undefined}
                onChange={setQuantity}
                value={quantity}
              />
              {removing && quantity > quantityOnHand ? (
                <Text style={styles.warning}>
                  Only {quantityOnHand} available.
                </Text>
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                disabled={!canConfirm}
                label={removing ? `Remove ${quantity}` : `Add ${quantity}`}
                loading={updating}
                onPress={commit}
              />
              <Button
                disabled={updating}
                label="Cancel"
                onPress={() => setAction(null)}
                variant="ghost"
              />
      </BottomSheetModal>
      <BottomSheetModal
        contentStyle={styles.sheet}
        onClose={() => setStockOptionsOpen(false)}
        visible={stockOptionsOpen}
      >
        <Text style={styles.eyebrow}>STOCK ACTIONS</Text>
        <Text style={styles.title}>Update availability</Text>
        <Text style={styles.body}>
          Add covers received or remove covers sold from this phone’s stock.
        </Text>
        <Button
          label="Add stock"
          onPress={() => chooseStockAction("restock")}
          variant="secondary"
        />
        <Button
          label="Remove stock"
          onPress={() => chooseStockAction("sale")}
          variant="ghost"
        />
      </BottomSheetModal>
    </View>
  );
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.xs },
  actions: { flex: 1, flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
  undo: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: spacing.md,
  },
  undoText: { color: colors.success, fontWeight: "800" },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 5,
    width: 44,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: { color: colors.ink, fontSize: 25, fontWeight: "900" },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  warning: { color: colors.danger, fontWeight: "700", textAlign: "center" },
  error: { color: colors.danger, fontWeight: "700", textAlign: "center" },
});
