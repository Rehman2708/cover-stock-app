import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../lib/api";
import { useDataSyncStore } from "../../lib/dataSync";
import type { Device, DeviceBrand } from "../../types/domain";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { Button } from "./Button";
import { BottomSheetModal } from "./BottomSheetModal";

interface AddDeviceModalProps {
  visible: boolean;
  brands: DeviceBrand[];
  onClose: () => void;
  onAdded: (device: Device) => void;
  initialBrand?: string;
  initialModel?: string;
}

export function AddDeviceModal({
  visible,
  brands,
  onClose,
  onAdded,
  initialBrand,
  initialModel,
}: AddDeviceModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const publishDevice = useDataSyncStore((state) => state.publishDevice);
  const [brand, setBrand] = useState(() => initialBrand?.trim() ?? "");
  const [model, setModel] = useState(() => initialModel?.trim() ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    if (!saving) {
      setError(null);
      onClose();
    }
  };
  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const device = await api.createDevice({
        brand: brand.trim(),
        model: model.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });
      publishDevice(device);
      setBrand("");
      setModel("");
      setImageUrl("");
      setBrandPickerOpen(false);
      onAdded(device);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to add this device.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <BottomSheetModal contentStyle={styles.sheet} onClose={close} scrollable visible={visible}>
            <View style={styles.handle} />
            <Text style={styles.eyebrow}>MANUAL DEVICE ENTRY</Text>
            <Text style={styles.title}>Add a device</Text>
            <Text style={styles.body}>
              Can’t find a phone? Add it now, then add its compatible covers.
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>Brand</Text>
              <Pressable
                accessibilityLabel="Choose device brand"
                accessibilityRole="button"
                accessibilityState={{ expanded: brandPickerOpen }}
                onPress={() => setBrandPickerOpen((open) => !open)}
                style={({ pressed }) => [
                  styles.brandPicker,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.brandValue, !brand && styles.placeholder]}>
                  {brand || "Select a brand"}
                </Text>
                <Text style={styles.chevron}>
                  {brandPickerOpen ? "⌃" : "⌄"}
                </Text>
              </Pressable>
              {brandPickerOpen ? (
                <View style={styles.brandMenu}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    style={styles.brandList}
                  >
                    {brands.map((item, index) => (
                      <Pressable
                        accessibilityRole="button"
                        key={`${item.brand}-${index}`}
                        onPress={() => {
                          setBrand(item.brand);
                          setBrandPickerOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.brandOption,
                          item.brand === brand && styles.brandOptionSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.brandOptionLabel,
                            item.brand === brand &&
                              styles.brandOptionLabelSelected,
                          ]}
                        >
                          {item.brand}
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setBrand("");
                        setBrandPickerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.brandOption,
                        styles.newBrandOption,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.newBrandLabel}>
                        + Add a new brand
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>
              ) : null}
              {!brand || !brands.some((item) => item.brand === brand) ? (
                <TextInput
                  accessibilityLabel="New device brand"
                  autoCapitalize="words"
                  autoCorrect={false}
                  onChangeText={setBrand}
                  placeholder="Enter a new brand"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={brand}
                />
              ) : null}
            </View>
            <Field
              label="Model"
              value={model}
              onChangeText={setModel}
              placeholder="For example, Phone (2a)"
              autoCapitalize="words"
            />
            <Field
              label="Image URL (optional)"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/phone.jpg"
              autoCapitalize="none"
              keyboardType="url"
            />
            {error ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <Button
              disabled={!brand.trim() || !model.trim()}
              label="Add device"
              loading={saving}
              onPress={save}
            />
            <Button
              disabled={saving}
              label="Cancel"
              onPress={close}
              variant="ghost"
            />
    </BottomSheetModal>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  title: { color: colors.ink, fontSize: 26, fontWeight: "900" },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  field: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  brandPicker: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  brandValue: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  placeholder: { color: colors.muted, fontWeight: "400" },
  chevron: { color: colors.primary, fontSize: 20, fontWeight: "900" },
  brandMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  brandList: { maxHeight: 180 },
  brandOption: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  brandOptionSelected: { backgroundColor: colors.primarySoft },
  brandOptionLabel: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  brandOptionLabelSelected: { color: colors.primary },
  newBrandOption: { borderTopColor: colors.border, borderTopWidth: 1 },
  newBrandLabel: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.72 },
  error: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    color: colors.danger,
    fontWeight: "700",
    padding: spacing.md,
  },
});
