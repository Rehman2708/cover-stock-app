import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
import { Button } from "../../components/common/Button";
import { DeviceImage } from "../../components/common/DeviceImage";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import { FilterChips } from "../../components/common/FilterChips";
import { Screen } from "../../components/common/Screen";
import { StockActions } from "../../components/common/StockActions";
import { QuantityStepper } from "../../components/common/QuantityStepper";
import { KeyboardAwareBottomSheet } from "../../components/common/KeyboardAwareBottomSheet";
import { StockBadge } from "../../components/common/StockBadge";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";
import { formatDate, titleCase } from "../../lib/format";
import { api } from "../../lib/api";
import type { Cover, InventoryTransaction } from "../../types/domain";

type HistoryFilter = "all" | "sale" | "restock" | "adjustment";

export default function CoverDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cover, setCover] = useState<Cover | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentDirection, setAdjustmentDirection] = useState<
    "increase" | "decrease"
  >("increase");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getCover(id), api.getCoverTransactions(id)])
      .then(([nextCover, nextTransactions]) => {
        if (!mounted) return;
        setCover(nextCover);
        setTransactions(nextTransactions);
      })
      .catch((reason: unknown) => {
        if (mounted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load this cover.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const header = (
    <AppHeader
      eyebrow="STOCK DETAIL"
      title="Stock details"
      subtitle={
        cover ? "Availability, actions, and history" : "Loading stock record"
      }
      left={<BackButton onPress={() => router.back()} />}
    />
  );
  const filteredTransactions = useMemo(
    () =>
      historyFilter === "all"
        ? transactions
        : transactions.filter(
            (transaction) => transaction.type === historyFilter,
          ),
    [historyFilter, transactions],
  );
  const update = async (type: "sale" | "restock", quantity: number) => {
    try {
      const mutation = await api.updateStock(id, type, { quantity });
      setCover(mutation.cover);
      setTransactions((current) => [mutation.transaction, ...current]);
      return mutation;
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.";
      Alert.alert("Could not update stock", message);
      throw new Error(message);
    }
  };
  const openAdjustment = () => {
    setAdjustmentQuantity(1);
    setAdjustmentDirection("increase");
    setAdjustmentReason("");
    setAdjustmentOpen(true);
  };
  const saveAdjustment = async () => {
    if (!adjustmentReason.trim()) return;
    setAdjusting(true);
    try {
      const mutation = await api.updateStock(id, "adjustment", {
        quantityDelta:
          adjustmentDirection === "increase"
            ? adjustmentQuantity
            : -adjustmentQuantity,
        reason: adjustmentReason.trim(),
      });
      setCover(mutation.cover);
      setTransactions((current) => [mutation.transaction, ...current]);
      setAdjustmentOpen(false);
    } catch (reason) {
      Alert.alert(
        "Could not correct stock",
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.",
      );
    } finally {
      setAdjusting(false);
    }
  };
  if (error)
    return (
      <Screen header={header}>
        <EmptyState title="Couldn’t load this cover" message={error} />
      </Screen>
    );
  if (!cover)
    return (
      <Screen header={header}>
        <SkeletonList variant="coverDetail" />
      </Screen>
    );
  return (
    <Screen header={header}>
      <View style={styles.stockCard}>
        <View>
          <Text style={styles.label}>AVAILABLE NOW</Text>
          <Text style={styles.count}>{cover.quantityOnHand} units</Text>
        </View>
        <StockBadge cover={cover} />
      </View>
      <StockActions quantityOnHand={cover.quantityOnHand} onUpdate={update} />
      <Button
        compact
        label="Correct count"
        onPress={openAdjustment}
        variant="ghost"
      />
      <Text style={commonStyles.sectionTitle}>Compatible phones</Text>
      <View style={styles.detailCard}>
        {cover.compatibleDevices?.length ? (
          cover.compatibleDevices.map((device) => (
            <Pressable
              accessibilityLabel={`Open ${device.brand} ${device.model} details`}
              accessibilityRole="button"
              key={device.id}
              onPress={() =>
                router.push({
                  pathname: "/device/[id]",
                  params: { id: device.id },
                })
              }
              style={({ pressed }) => [
                styles.deviceRow,
                pressed && styles.pressed,
              ]}
            >
              <DeviceImage device={device} size={42} />
              <View style={styles.deviceCopy}>
                <Text style={styles.brand}>{device.brand}</Text>
                <Text style={styles.model}>{device.model}</Text>
              </View>
              <Text style={styles.linkHint}>View details</Text>
            </Pressable>
          ))
        ) : cover.compatibleModels.length ? (
          cover.compatibleModels.map((model, index) => (
            <Text key={`${model}-${index}`} style={styles.model}>
              {model}
            </Text>
          ))
        ) : (
          <Text style={commonStyles.caption}>No compatible phones linked.</Text>
        )}
      </View>
      <Text style={commonStyles.sectionTitle}>Stock history</Text>
      {transactions.length ? (
        <>
          <FilterChips
            accessibilityLabel="Filter stock history"
            value={historyFilter}
            onChange={setHistoryFilter}
            options={[
              { label: "All", value: "all" },
              { label: "Sales", value: "sale" },
              { label: "Restocks", value: "restock" },
              { label: "Adjustments", value: "adjustment" },
            ]}
          />
          {filteredTransactions.length ? (
            filteredTransactions.map((transaction, index) => (
              <Pressable
                accessibilityLabel={`Open ${titleCase(transaction.type)} record`}
                accessibilityRole="button"
                key={`${transaction.id}-${transaction.createdAt}-${index}`}
                onPress={() =>
                  router.push({
                    pathname: "/activity/[id]",
                    params: { id: transaction.id },
                  })
                }
                style={({ pressed }) => [styles.history, pressed && styles.pressed]}
              >
                <View
                  style={[
                    styles.dot,
                    transaction.quantityDelta < 0 && styles.dotOut,
                  ]}
                />
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>
                    {titleCase(transaction.type)}
                  </Text>
                  <Text style={commonStyles.caption}>
                    {formatDate(transaction.createdAt)} ·{" "}
                    {transaction.actor || "Shop owner"}
                  </Text>
                  {transaction.reason || transaction.note ? (
                    <Text style={styles.note}>
                      {transaction.reason || transaction.note}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.delta,
                    transaction.quantityDelta < 0 && styles.deltaOut,
                  ]}
                >
                  {transaction.quantityDelta > 0 ? "+" : ""}
                  {transaction.quantityDelta}
                </Text>
              </Pressable>
            ))
          ) : (
            <EmptyState
              title="No matching stock history"
              message="Try a different transaction filter."
            />
          )}
        </>
      ) : (
        <EmptyState
          title="No stock history"
          message="Changes to this cover will appear here."
        />
      )}
      <Modal
        animationType="slide"
        onRequestClose={() => setAdjustmentOpen(false)}
        transparent
        visible={adjustmentOpen}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAwareBottomSheet>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.label}>COUNT CORRECTION</Text>
              <Text style={styles.sheetTitle}>Correct available stock</Text>
              <FilterChips
                accessibilityLabel="Correction direction"
                value={adjustmentDirection}
                onChange={setAdjustmentDirection}
                options={[
                  { label: "Add", value: "increase" },
                  { label: "Remove", value: "decrease" },
                ]}
              />
              <QuantityStepper
                maximum={
                  adjustmentDirection === "decrease"
                    ? cover.quantityOnHand
                    : undefined
                }
                onChange={setAdjustmentQuantity}
                value={adjustmentQuantity}
              />
              <TextInput
                accessibilityLabel="Reason for correction"
                multiline
                onChangeText={setAdjustmentReason}
                placeholder="Why is this count changing?"
                placeholderTextColor={colors.muted}
                style={styles.reasonInput}
                value={adjustmentReason}
              />
              <Button
                disabled={!adjustmentReason.trim()}
                label="Save correction"
                loading={adjusting}
                onPress={saveAdjustment}
              />
              <Button
                compact
                disabled={adjusting}
                label="Cancel"
                onPress={() => setAdjustmentOpen(false)}
                variant="ghost"
              />
            </View>
          </KeyboardAwareBottomSheet>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stockCard: {
    ...commonStyles.card,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  count: { color: colors.ink, fontSize: 27, fontWeight: "900", marginTop: 3 },
  detailCard: { ...commonStyles.card, gap: spacing.sm },
  deviceRow: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.xs,
  },
  deviceCopy: { flex: 1, gap: 2 },
  linkHint: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  brand: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  model: {
    color: colors.primary,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  history: {
    ...commonStyles.card,
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    backgroundColor: colors.success,
    borderRadius: 5,
    height: 10,
    marginTop: 6,
    width: 10,
  },
  dotOut: { backgroundColor: colors.danger },
  historyCopy: { flex: 1, gap: 3 },
  historyTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  note: { color: colors.muted, fontSize: 13, fontStyle: "italic" },
  delta: { color: colors.success, fontSize: 18, fontWeight: "900" },
  deltaOut: { color: colors.danger },
  pressed: { opacity: 0.72 },
  modalBackdrop: {
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
  sheetTitle: { color: colors.ink, fontSize: 25, fontWeight: "900" },
  reasonInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    minHeight: 88,
    padding: spacing.md,
    textAlignVertical: "top",
  },
});
