import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import type { StockMutation, TransactionType } from "../../types/domain";
import { colors, radius, spacing } from "../../design-system/tokens";
import { Button } from "./Button";
import { QuantityStepper } from "./QuantityStepper";

interface StockActionsProps {
  quantityOnHand: number;
  onUpdate: (
    type: Extract<TransactionType, "sale" | "restock">,
    quantity: number,
  ) => Promise<StockMutation>;
}
export function StockActions({ quantityOnHand, onUpdate }: StockActionsProps) {
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
  const commit = async () => {
    if (!action) return;
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
        <View style={styles.action}>
          <Button
            compact
            disabled={updating}
            label="Add stock"
            onPress={() => open("restock")}
            variant="secondary"
          />
        </View>
        <View style={styles.action}>
          <Button
            compact
            disabled={updating || quantityOnHand === 0}
            label="Remove stock"
            onPress={() => open("sale")}
            variant="ghost"
          />
        </View>
      </View>
      {undo ? (
        <View accessibilityLiveRegion="polite" style={styles.undo}>
          <Text style={styles.undoText}>Stock updated.</Text>
          <Button
            compact
            disabled={updating}
            label="Undo"
            onPress={undoLast}
            variant="ghost"
          />
        </View>
      ) : null}
      <Modal
        animationType="slide"
        onRequestClose={() => setAction(null)}
        transparent
        visible={Boolean(action)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
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
              compact
              disabled={updating}
              label="Cancel"
              onPress={() => setAction(null)}
              variant="ghost"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm },
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
  backdrop: {
    backgroundColor: "rgba(21, 35, 31, .35)",
    flex: 1,
    justifyContent: "flex-end",
  },
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
