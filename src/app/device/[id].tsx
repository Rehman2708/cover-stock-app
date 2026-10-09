import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { BackButton } from "../../components/common/BackButton";
import { BottomSheetModal } from "../../components/common/BottomSheetModal";
import { Button } from "../../components/common/Button";
import { DeviceCard } from "../../components/common/DeviceCard";
import { DeviceImage } from "../../components/common/DeviceImage";
import { EmptyState } from "../../components/common/EmptyState";
import { SearchBar } from "../../components/common/SearchBar";
import { SkeletonList } from "../../components/common/Skeleton";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { StockActions } from "../../components/common/StockActions";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import type {
  Device,
  DeviceDetail,
  StockMutation,
  TransactionType,
} from "../../types/domain";

export default function DeviceDetailRoute() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loadedDetail, setDetail] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [linkCandidates, setLinkCandidates] = useState<Device[]>([]);
  const [linkCandidatesError, setLinkCandidatesError] = useState<string | null>(null);
  const [loadingLinkCandidates, setLoadingLinkCandidates] = useState(false);
  const [linkingDeviceId, setLinkingDeviceId] = useState<string | null>(null);
  const [unlinkingDeviceId, setUnlinkingDeviceId] = useState<string | null>(null);
  const [removingDevice, setRemovingDevice] = useState(false);
  const [deviceOptionsOpen, setDeviceOptionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deviceQuery, setDeviceQuery] = useState("");
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const latestStockMutation = useDataSyncStore(
    (state) => state.latestStockMutation,
  );
  const publishStockMutation = useDataSyncStore(
    (state) => state.publishStockMutation,
  );
  const publishDevice = useDataSyncStore((state) => state.publishDevice);
  const deviceRevision = useDataSyncStore((state) => state.deviceRevision);

  const loadDevice = useCallback(async () => {
    setRefreshing(true);
    try {
      setDetail(await api.getDevice(id));
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to load this phone.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [id]);
  useEffect(() => {
    let mounted = true;
    api
      .getDevice(id)
      .then((nextDetail) => {
        if (!mounted) return;
        setDetail(nextDetail);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (mounted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load this phone.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [deviceRevision, id]);
  const detail = useMemo(
    () =>
      loadedDetail &&
      latestStockMutation &&
      loadedDetail.covers.some(
        (cover) => cover.id === latestStockMutation.cover.id,
      )
        ? {
            ...loadedDetail,
            covers: loadedDetail.covers.map((cover) =>
              cover.id === latestStockMutation.cover.id
                ? latestStockMutation.cover
                : cover,
            ),
          }
        : loadedDetail,
    [latestStockMutation, loadedDetail],
  );

  const title = detail ? detail.device.model : "Phone details";
  const eyebrow = detail ? detail.device.brand.toUpperCase() : "PHONE DETAIL";
  const unitsOnHand =
    detail?.covers.reduce((total, cover) => total + cover.quantityOnHand, 0) ||
    0;
  const availableRecords =
    detail?.covers.filter((cover) => cover.quantityOnHand > 0).length || 0;
  const deviceImageUri =
    detail?.device.images?.primary || detail?.device.images?.back;
  const availableLinkCandidates = useMemo(() => {
    const linkedIds = new Set(
      [detail?.device, ...(detail?.compatibleDevices || [])]
        .filter(Boolean)
        .map((device) => device!.id),
    );
    return linkCandidates.filter((device) => !linkedIds.has(device.id));
  }, [detail?.compatibleDevices, detail?.device, linkCandidates]);
  const header = (
    <AppHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={
        detail ? "Availability and compatible phones" : "Loading availability"
      }
      left={<BackButton onPress={() => router.back()} />}
    />
  );
  const updateStock = async (
    type: Extract<TransactionType, "sale" | "restock">,
    quantity: number,
  ): Promise<StockMutation> => {
    try {
      const mutation = await api.updateDeviceStock(id, type, { quantity });
      publishStockMutation(mutation);
      setDetail((current) =>
        current
          ? {
              ...current,
              covers: current.covers.some(
                (cover) => cover.id === mutation.cover.id,
              )
                ? current.covers.map((cover) =>
                    cover.id === mutation.cover.id ? mutation.cover : cover,
                  )
                : [...current.covers, mutation.cover],
            }
          : current,
      );
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
  const openLinkPicker = () => {
    setDeviceQuery("");
    setLinkCandidates([]);
    setLinkCandidatesError(null);
    setLoadingLinkCandidates(false);
    setLinkPickerOpen(true);
  };
  const openEdit = () => {
    if (!detail) return;
    setEditBrand(detail.device.brand);
    setEditModel(detail.device.model);
    setEditImageUrl(detail.device.images?.primary || "");
    setEditOpen(true);
  };
  const chooseDeviceOption = (action: () => void) => {
    setDeviceOptionsOpen(false);
    setTimeout(action, 200);
  };
  const saveEdit = async () => {
    if (!detail) return;
    setSavingEdit(true);
    try {
      const updated = await api.updateDevice(id, {
        brand: editBrand.trim(),
        model: editModel.trim(),
        imageUrl: editImageUrl.trim(),
      });
      publishDevice(updated);
      setDetail((current) =>
        current ? { ...current, device: updated } : current,
      );
      setEditOpen(false);
    } catch (reason) {
      Alert.alert(
        "Couldn’t update device",
        reason instanceof Error
          ? reason.message
          : "Check the details and try again.",
      );
    } finally {
      setSavingEdit(false);
    }
  };
  useEffect(() => {
    const query = deviceQuery.trim();
    if (!linkPickerOpen || !query) {
      return undefined;
    }
    let active = true;
    const timeout = setTimeout(() => {
      setLoadingLinkCandidates(true);
      setLinkCandidatesError(null);
      api
        .search(query)
        .then((results) => {
          if (active) setLinkCandidates(results.devices);
        })
        .catch((reason: unknown) => {
          if (active)
            setLinkCandidatesError(
              reason instanceof Error
                ? reason.message
                : "Unable to search the phone catalogue.",
            );
        })
        .finally(() => {
          if (active) setLoadingLinkCandidates(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [deviceQuery, linkPickerOpen]);
  const linkDevice = async (compatibleDevice: Device) => {
    if (!detail) return;
    setLinkingDeviceId(compatibleDevice.id);
    try {
      const result = await api.linkCompatibleDevice(id, compatibleDevice.id);
      if (!result.linked) {
        Alert.alert("Already linked", "These phones already share compatible-cover availability.");
        return;
      }
      setDetail((current) =>
        current
          ? {
              ...current,
              compatibleDevices: result.compatibleDevices,
            }
          : current,
      );
      publishDevice({
        ...detail.device,
        compatibleDevices: result.compatibleDevices,
      });
      setLinkPickerOpen(false);
      Alert.alert(
        "Phones linked",
        `${detail.device.brand} ${detail.device.model} and ${compatibleDevice.brand} ${compatibleDevice.model} now share compatible-cover availability. No stock was added or changed.`,
      );
    } catch (reason) {
      Alert.alert(
        "Couldn’t link phone",
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.",
      );
    } finally {
      setLinkingDeviceId(null);
    }
  };
  const unlinkDevice = async (compatibleDevice: Device) => {
    if (!detail) return;
    setUnlinkingDeviceId(compatibleDevice.id);
    try {
      const result = await api.unlinkCompatibleDevice(id, compatibleDevice.id);
      if (!result.linked) {
        Alert.alert(
          "Couldn’t unlink phone",
          "This phone is no longer linked. Refresh and try again.",
        );
        return;
      }
      setDetail((current) =>
        current
          ? { ...current, compatibleDevices: result.compatibleDevices }
          : current,
      );
      publishDevice({
        ...detail.device,
        compatibleDevices: result.compatibleDevices,
      });
      await loadDevice();
      Alert.alert(
        "Phone unlinked",
        `${detail.device.brand} ${detail.device.model} kept the shared stock. ${compatibleDevice.brand} ${compatibleDevice.model} now has its own stock record starting at 0.`,
      );
    } catch (reason) {
      Alert.alert(
        "Couldn’t unlink phone",
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.",
      );
    } finally {
      setUnlinkingDeviceId(null);
    }
  };
  const confirmLink = (compatibleDevice: Device) => {
    if (!detail) return;
    Alert.alert(
      "Link these phones?",
      `${detail.device.brand} ${detail.device.model} and ${compatibleDevice.brand} ${compatibleDevice.model} will share compatible-cover availability. No stock is required.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Link phones", onPress: () => void linkDevice(compatibleDevice) },
      ],
    );
  };
  const confirmUnlink = (compatibleDevice: Device) => {
    if (!detail) return;
    Alert.alert(
      "Unlink this phone?",
      `${detail.device.brand} ${detail.device.model} will keep all ${unitsOnHand} shared unit${unitsOnHand === 1 ? "" : "s"}. ${compatibleDevice.brand} ${compatibleDevice.model} will get a separate stock record starting at 0.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unlink phone", style: "destructive", onPress: () => void unlinkDevice(compatibleDevice) },
      ],
    );
  };
  const removeDevice = async () => {
    if (!detail) return;
    setRemovingDevice(true);
    try {
      await api.removeDevice(id);
      publishDevice(detail.device);
      router.back();
    } catch (reason) {
      Alert.alert(
        "Couldn’t remove device",
        reason instanceof Error
          ? reason.message
          : "Check the connection and try again.",
      );
      setRemovingDevice(false);
    }
  };
  const confirmRemoveDevice = () => {
    if (!detail) return;
    Alert.alert(
      "Remove this device?",
      `${detail.device.brand} ${detail.device.model} will be removed from the active catalogue and search. Stock history is kept.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove device", style: "destructive", onPress: () => void removeDevice() },
      ],
    );
  };

  if (error)
    return (
      <Screen
        header={header}
        refreshControl={createRefreshControl(refreshing, loadDevice, colors)}
      >
        <EmptyState title="Couldn’t load this phone" message={error} />
      </Screen>
    );
  if (!detail)
    return (
      <Screen
        header={header}
        refreshControl={createRefreshControl(refreshing, loadDevice, colors)}
      >
        <SkeletonList variant="deviceDetail" />
      </Screen>
    );
  return (
    <Screen
      header={header}
      refreshControl={createRefreshControl(refreshing, loadDevice, colors)}
    >
      <View style={styles.summary}>
        {deviceImageUri ? (
          <Pressable
            accessibilityHint="Opens the phone image full screen"
            accessibilityLabel={`View ${detail.device.brand} ${detail.device.model} image`}
            accessibilityRole="button"
            onPress={() => setImagePreviewOpen(true)}
            style={({ pressed }) => [styles.imageButton, pressed && styles.pressed]}
          >
            <DeviceImage device={detail.device} showFallbackLabel size={152} />
            <View pointerEvents="none" style={styles.imageTapHint}>
              <Text style={styles.imageTapHintLabel}>Tap to view</Text>
            </View>
          </Pressable>
        ) : (
          <DeviceImage device={detail.device} showFallbackLabel size={152} />
        )}
        <View style={styles.summaryCopy}>
          <Text style={styles.label}>COVER AVAILABILITY</Text>
          <Text style={styles.count}>
            {unitsOnHand ? `${unitsOnHand} units` : "No covers in stock"}
          </Text>
          <Text style={styles.caption}>
            {unitsOnHand > 0
              ? `${availableRecords} stock record${availableRecords === 1 ? "" : "s"} available for this phone.`
              : "No covers are currently available for this phone."}
          </Text>
        </View>
      </View>
      <View style={styles.primaryActions}>
        <View style={styles.primaryAction}>
          <StockActions compact quantityOnHand={unitsOnHand} onUpdate={updateStock} />
        </View>
        <View style={styles.primaryAction}>
          <Button
            label="Device options"
            onPress={() => setDeviceOptionsOpen(true)}
            variant="ghost"
          />
        </View>
      </View>
      {detail.compatibleDevices.length ? (
        <View style={styles.compatibility}>
          <Text style={styles.compatibilityTitle}>SAME COVER FITS</Text>
          <Text style={styles.compatibilityCaption}>
            These phones use the same cover as this model.
          </Text>
          <View style={styles.compatibleCards}>
            {detail.compatibleDevices.map((device) => (
              <DeviceCard
                device={device}
                key={device.id}
                onPress={() =>
                  router.push({
                    pathname: "/device/[id]",
                    params: { id: device.id },
                  })
                }
                showAvailability={false}
                showBrand
              />
            ))}
          </View>
        </View>
      ) : null}
      {!unitsOnHand && !detail.compatibleDevices.length ? (
        <View style={styles.emptyGuide}>
          <Text style={styles.emptyGuideTitle}>Start with the phone in hand</Text>
          <Text style={styles.emptyGuideCopy}>
            Add the available covers now. You can link compatible models as you confirm their fit.
          </Text>
        </View>
      ) : null}
      <BottomSheetModal
        closeAccessibilityLabel="Close phone picker"
        contentStyle={styles.linkSheet}
        height="80%"
        onClose={() => setLinkPickerOpen(false)}
        visible={linkPickerOpen}
      >
              <View style={styles.sheetHeader}>
                <View style={styles.sheetCopy}>
                  <Text style={styles.sheetTitle}>Link compatible phone</Text>
                  <Text style={styles.sheetCaption}>
                    Search {detail.device.brand} phones only. Other brands cannot share a cover.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close phone picker"
                  accessibilityRole="button"
                  hitSlop={12}
                  onPress={() => setLinkPickerOpen(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeLabel}>×</Text>
                </Pressable>
              </View>
              <SearchBar
                loading={loadingLinkCandidates}
                onChangeText={setDeviceQuery}
                placeholder={`Search ${detail.device.brand} phone model`}
                value={deviceQuery}
              />
              <ScrollView
                contentContainerStyle={styles.sheetContent}
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.sheetScroll}
              >
                {detail.compatibleDevices.length ? (
                  <View style={styles.linkedSection}>
                    <Text style={styles.linkedTitle}>ALREADY LINKED</Text>
                    <View style={styles.candidateList}>
                      {detail.compatibleDevices.map((device) => (
                        <Pressable
                          accessibilityLabel={`Unlink ${device.brand} ${device.model}`}
                          accessibilityRole="button"
                          disabled={
                            linkingDeviceId !== null || unlinkingDeviceId !== null
                          }
                          key={device.id}
                          onPress={() => confirmUnlink(device)}
                          style={({ pressed }) => [
                            styles.candidate,
                            (pressed ||
                              linkingDeviceId !== null ||
                              unlinkingDeviceId !== null) &&
                              styles.pressed,
                          ]}
                        >
                          <View style={styles.candidateCopy}>
                            <Text numberOfLines={1} style={styles.candidateName}>
                              {device.model}
                            </Text>
                            <Text numberOfLines={1} style={styles.candidateMeta}>
                              {device.brand}
                            </Text>
                          </View>
                          <Text style={styles.unlinkAction}>
                            {unlinkingDeviceId === device.id
                              ? "Unlinking…"
                              : "Unlink"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
                {linkCandidatesError ? (
                  <Text style={styles.linkError}>{linkCandidatesError}</Text>
                ) : null}
                {!loadingLinkCandidates && !linkCandidatesError ? (
                  !deviceQuery.trim() ? (
                    <Text style={styles.emptyCandidates}>
                      Search for a phone model to link.
                    </Text>
                  ) : availableLinkCandidates.length ? (
                    <View style={styles.candidateList}>
                      {availableLinkCandidates.map((device) => (
                        <Pressable
                          accessibilityLabel={`Link ${device.brand} ${device.model}`}
                          accessibilityRole="button"
                          disabled={
                            linkingDeviceId !== null || unlinkingDeviceId !== null
                          }
                          key={device.id}
                          onPress={() => confirmLink(device)}
                          style={({ pressed }) => [
                            styles.candidate,
                            (pressed ||
                              linkingDeviceId !== null ||
                              unlinkingDeviceId !== null) &&
                              styles.pressed,
                          ]}
                        >
                          <View style={styles.candidateCopy}>
                            <Text numberOfLines={1} style={styles.candidateName}>
                              {device.model}
                            </Text>
                            <Text numberOfLines={1} style={styles.candidateMeta}>
                              {device.brand}
                            </Text>
                          </View>
                          <Text style={styles.linkAction}>
                            {linkingDeviceId === device.id ? "Linking…" : "Link"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyCandidates}>
                      No unlinked {detail.device.brand} phones match that search.
                    </Text>
                  )
                ) : null}
              </ScrollView>
      </BottomSheetModal>
      <BottomSheetModal
        contentStyle={styles.optionsSheet}
        onClose={() => setDeviceOptionsOpen(false)}
        visible={deviceOptionsOpen}
      >
        <Text style={styles.sheetTitle}>Device options</Text>
        <Text style={styles.sheetCaption}>
          Update this phone’s details or manage which models share its cover.
        </Text>
        <Button
          label="Edit device"
          onPress={() => chooseDeviceOption(openEdit)}
          variant="secondary"
        />
        <Button
          label="Manage compatible phones"
          onPress={() => chooseDeviceOption(openLinkPicker)}
          variant="ghost"
        />
        <View style={styles.dangerSection}>
          <Text style={styles.dangerCaption}>
            Removing a device hides it from the catalogue. Stock history is kept.
          </Text>
          <Button
            disabled={removingDevice}
            label="Remove device"
            loading={removingDevice}
            onPress={() => chooseDeviceOption(confirmRemoveDevice)}
            variant="danger"
          />
        </View>
      </BottomSheetModal>
      <BottomSheetModal
        contentStyle={styles.editSheet}
        onClose={() => !savingEdit && setEditOpen(false)}
        scrollable
        visible={editOpen}
      >
        <Text style={styles.sheetTitle}>Edit device</Text>
        <Text style={styles.sheetCaption}>
          Update the name or image shown throughout the catalogue.
        </Text>
        <View style={styles.editField}>
          <Text style={styles.editLabel}>Brand</Text>
          <TextInput
            accessibilityLabel="Device brand"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!savingEdit}
            onChangeText={setEditBrand}
            style={styles.editInput}
            value={editBrand}
          />
        </View>
        <View style={styles.editField}>
          <Text style={styles.editLabel}>Model</Text>
          <TextInput
            accessibilityLabel="Device model"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!savingEdit}
            onChangeText={setEditModel}
            style={styles.editInput}
            value={editModel}
          />
        </View>
        <View style={styles.editField}>
          <Text style={styles.editLabel}>Image URL (optional)</Text>
          <TextInput
            accessibilityLabel="Device image URL"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!savingEdit}
            keyboardType="url"
            onChangeText={setEditImageUrl}
            placeholder="https://example.com/phone.jpg"
            placeholderTextColor={colors.muted}
            style={styles.editInput}
            value={editImageUrl}
          />
        </View>
        <Button
          disabled={!editBrand.trim() || !editModel.trim()}
          label="Save changes"
          loading={savingEdit}
          onPress={saveEdit}
        />
        <Button
          disabled={savingEdit}
          label="Cancel"
          onPress={() => setEditOpen(false)}
          variant="ghost"
        />
      </BottomSheetModal>
      <Modal
        animationType="fade"
        onRequestClose={() => setImagePreviewOpen(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={imagePreviewOpen && Boolean(deviceImageUri)}
      >
        <View style={styles.imagePreview}>
          <Pressable
            accessibilityLabel="Close full screen image"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setImagePreviewOpen(false)}
            style={({ pressed }) => [
              styles.imagePreviewClose,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.imagePreviewCloseLabel}>×</Text>
          </Pressable>
          {deviceImageUri ? (
            <Image
              accessibilityLabel={`${detail.device.brand} ${detail.device.model}`}
              resizeMode="contain"
              source={{ uri: deviceImageUri }}
              style={styles.imagePreviewImage}
            />
          ) : null}
          <Text style={styles.imagePreviewCaption}>
            {detail.device.brand} {detail.device.model}
          </Text>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  summary: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  imageButton: { height: 152, position: "relative", width: 152 },
  imageTapHint: {
    alignSelf: "center",
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    bottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    position: "absolute",
  },
  imageTapHintLabel: { color: colors.white, fontSize: 11, fontWeight: "800" },
  imagePreview: {
    backgroundColor: colors.black,
    flex: 1,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  imagePreviewClose: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: spacing.lg,
    top: spacing.xxl,
    width: 44,
    zIndex: 1,
  },
  imagePreviewCloseLabel: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "400",
    lineHeight: 34,
  },
  imagePreviewImage: { flex: 1, width: "100%" },
  imagePreviewCaption: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
    paddingTop: spacing.md,
    textAlign: "center",
  },
  summaryCopy: { flex: 1, gap: 4 },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  count: { color: colors.ink, fontSize: 25, fontWeight: "900" },
  caption: { color: colors.muted, fontSize: 14 },
  primaryActions: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing.xs,
  },
  primaryAction: { flex: 1 },
  compatibility: { gap: spacing.xs },
  compatibilityTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  compatibilityCaption: { color: colors.muted, fontSize: 14 },
  compatibleCards: { gap: spacing.xs },
  compatibilityNames: { color: colors.ink, fontSize: 15, fontWeight: "700", lineHeight: 22 },
  pressed: { opacity: 0.7 },
  emptyGuide: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.xxs,
    padding: spacing.md,
  },
  emptyGuideTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  emptyGuideCopy: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  linkSheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  editSheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  optionsSheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  dangerSection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  dangerCaption: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  editField: { gap: spacing.xs },
  editLabel: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  editInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  sheetScroll: { flex: 1 },
  sheetContent: { gap: spacing.md, paddingBottom: spacing.sm },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  sheetCopy: { flex: 1, gap: 3 },
  sheetTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  sheetCaption: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  closeLabel: { color: colors.ink, fontSize: 25, fontWeight: "500", lineHeight: 28 },
  linkError: { color: colors.danger, fontSize: 14, fontWeight: "700" },
  linkedSection: { gap: spacing.xs },
  linkedTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  candidateList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  candidate: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  candidateCopy: { flex: 1, gap: 3 },
  candidateName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  candidateMeta: { color: colors.muted, fontSize: 13 },
  linkAction: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  unlinkAction: { color: colors.danger, fontSize: 14, fontWeight: "900" },
  emptyCandidates: { color: colors.muted, fontSize: 14, lineHeight: 20, paddingVertical: spacing.sm },
});
