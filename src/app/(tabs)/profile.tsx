import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppHeader } from "../../components/common/AppHeader";
import { BottomSheetModal } from "../../components/common/BottomSheetModal";
import { Button } from "../../components/common/Button";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import {
  useTheme,
  type ThemeColors,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { useAuth } from "../../features/auth/AuthProvider";
import {
  changePassword,
  updateProfile,
} from "../../features/profile/profileApi";
import { api } from "../../lib/api";

export default function ProfileRoute() {
  const { user, updateUser, logout } = useAuth();
  const { colors, setTheme, themeId, themeOptions } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState(user?.name || "");
  const [nameDraft, setNameDraft] = useState(name);
  const [nameSheetOpen, setNameSheetOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshProfile = useCallback(async () => {
    setRefreshing(true);
    try {
      const refreshedUser = await api.getMe();
      setName(refreshedUser.name);
      if (!nameSheetOpen) setNameDraft(refreshedUser.name);
      updateUser(refreshedUser);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to refresh your profile.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [nameSheetOpen, updateUser]);

  const saveName = async () => {
    setError(null);
    setNotice(null);
    setSavingName(true);
    try {
      const updated = await updateProfile({ name: nameDraft.trim() });
      setName(updated.name);
      updateUser(updated);
      setNameSheetOpen(false);
      setNotice("Name updated.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to update your name.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    setError(null);
    setNotice(null);
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
      setNotice("Password changed.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to change your password.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Log out?",
      "You will need your phone number and password to sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => {
            void logoutUser();
          },
        },
      ],
    );
  };

  const logoutUser = async () => {
    setError(null);
    setNotice(null);
    setLoggingOut(true);
    try {
      await logout();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to log out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const openNameSheet = () => {
    setError(null);
    setNotice(null);
    setNameDraft(name);
    setNameSheetOpen(true);
  };
  const closeNameSheet = () => {
    if (!savingName) {
      setError(null);
      setNameSheetOpen(false);
    }
  };
  const openPasswordSheet = () => {
    setError(null);
    setNotice(null);
    setCurrentPassword("");
    setNewPassword("");
    setShowPasswordForm(true);
  };
  const closePasswordSheet = () => {
    if (!savingPassword) {
      setError(null);
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          eyebrow="ACCOUNT"
          title="Profile"
          subtitle="Manage your personal details and sign-in security."
        />
      }
      refreshControl={createRefreshControl(refreshing, refreshProfile, colors)}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>
            {name.slice(0, 1).toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{name || "Your profile"}</Text>
          <Text style={styles.phone}>
            {user?.phone || "Phone number unavailable"}
          </Text>
        </View>
      </View>

      {error && !nameSheetOpen && !showPasswordForm ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {notice}
        </Text>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <View style={styles.icon}>
              <Ionicons
                color={colors.primary}
                name="person-outline"
                size={20}
              />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.label}>NAME</Text>
              <Text style={styles.value}>{name}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit name"
              onPress={openNameSheet}
              hitSlop={8}
            >
              <Text style={styles.action}>Edit</Text>
            </Pressable>
          </View>
          <View style={[styles.detailRow, styles.divider]}>
            <View style={styles.icon}>
              <Ionicons color={colors.primary} name="call-outline" size={20} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <Text style={styles.value}>{user?.phone || "—"}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <View style={styles.icon}>
              <Ionicons
                color={colors.primary}
                name="lock-closed-outline"
                size={20}
              />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.value}>Password</Text>
              <Text style={styles.helper}>
                Use 8+ characters, a letter and a number
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change password"
              onPress={openPasswordSheet}
              hitSlop={8}
            >
              <Text style={styles.action}>Change</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.appearanceHeader}>
            <View style={[styles.icon, styles.appearanceIcon]}>
              <Ionicons
                color={colors.primary}
                name="color-palette-outline"
                size={20}
              />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.value}>App theme</Text>
              <Text style={styles.helper}>
                Choose the primary color you prefer.
              </Text>
            </View>
          </View>
          <View style={styles.themeOptions}>
            {themeOptions.map((theme) => {
              const selected = theme.id === themeId;
              return (
                <Pressable
                  accessibilityLabel={`Use ${theme.name} theme`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={theme.id}
                  onPress={() => setTheme(theme.id)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    {
                      backgroundColor: selected
                        ? theme.primarySoft
                        : colors.canvas,
                      borderColor: selected ? theme.primary : colors.border,
                    },
                    pressed && styles.themeOptionPressed,
                  ]}
                >
                  <View style={styles.themeOptionTop}>
                    <View
                      style={[
                        styles.themeSwatch,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                    {selected ? (
                      <Ionicons
                        color={theme.primary}
                        name="checkmark-circle"
                        size={20}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.themeName}>{theme.name}</Text>
                  <Text style={styles.themeDescription}>{theme.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <View style={styles.card}>
          <View style={styles.logoutRow}>
            <View style={[styles.icon, styles.logoutIcon]}>
              <Ionicons
                color={colors.danger}
                name="log-out-outline"
                size={20}
              />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.value}>Log out</Text>
              <Text style={styles.helper}>Sign out from this device.</Text>
            </View>
          </View>
          <View style={styles.logoutAction}>
            <Button
              label="Log out"
              loading={loggingOut}
              onPress={confirmLogout}
              variant="danger"
            />
          </View>
        </View>
      </View>
      <BottomSheetModal
        closeAccessibilityLabel="Close edit profile"
        contentStyle={styles.sheet}
        onClose={closeNameSheet}
        scrollable
        visible={nameSheetOpen}
      >
        <View style={styles.handle} />
        <Text style={styles.sheetEyebrow}>PERSONAL DETAILS</Text>
        <Text style={styles.sheetTitle}>Edit your name</Text>
        <Text style={styles.sheetCaption}>
          This is the name shown with your stock updates.
        </Text>
        <Field
          label="Name"
          value={nameDraft}
          onChangeText={setNameDraft}
          autoCapitalize="words"
          placeholder="Enter your name"
        />
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          disabled={!nameDraft.trim()}
          label="Save name"
          loading={savingName}
          onPress={saveName}
        />
        <Button
          disabled={savingName}
          label="Cancel"
          onPress={closeNameSheet}
          variant="ghost"
        />
      </BottomSheetModal>
      <BottomSheetModal
        closeAccessibilityLabel="Close change password"
        contentStyle={styles.sheet}
        onClose={closePasswordSheet}
        scrollable
        visible={showPasswordForm}
      >
        <View style={styles.handle} />
        <Text style={styles.sheetEyebrow}>SECURITY</Text>
        <Text style={styles.sheetTitle}>Change password</Text>
        <Text style={styles.sheetCaption}>
          Use at least 8 characters with a letter and a number.
        </Text>
        <Field
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry
        />
        <Field
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="8+ characters, letter and number"
          secureTextEntry
        />
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          disabled={
            newPassword.length < 8 ||
            !/[A-Za-z]/.test(newPassword) ||
            !/\d/.test(newPassword)
          }
          label="Change password"
          loading={savingPassword}
          onPress={savePassword}
        />
        <Button
          disabled={savingPassword}
          label="Cancel"
          onPress={closePasswordSheet}
          variant="ghost"
        />
      </BottomSheetModal>
    </Screen>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.inputLabel}>{label}</Text>
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
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarLabel: { color: colors.primary, fontSize: 24, fontWeight: "900" },
  identity: { flex: 1, gap: 3 },
  name: { color: colors.white, fontSize: 20, fontWeight: "900" },
  phone: { color: colors.primarySoft, fontSize: 15, fontWeight: "700" },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  logoutIcon: { backgroundColor: colors.dangerSoft },
  detailCopy: { flex: 1, gap: 2 },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  value: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  helper: { color: colors.muted, fontSize: 13 },
  action: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  appearanceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  appearanceIcon: { backgroundColor: colors.primarySoft },
  themeOptions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    padding: spacing.sm,
  },
  themeOption: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    gap: 2,
    minWidth: "44%",
    padding: spacing.sm,
  },
  themeOptionPressed: { opacity: 0.72 },
  themeOptionTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  themeSwatch: { borderRadius: radius.pill, height: 20, width: 20 },
  themeName: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  themeDescription: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  logoutRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  logoutAction: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  sheet: { gap: spacing.md, paddingBottom: spacing.xxxl },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 5,
    width: 44,
  },
  sheetEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  sheetTitle: { color: colors.ink, fontSize: 25, fontWeight: "900" },
  sheetCaption: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  field: { gap: spacing.xs },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    color: colors.danger,
    fontWeight: "700",
    padding: spacing.md,
  },
  notice: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    color: colors.success,
    fontWeight: "700",
    padding: spacing.md,
  },
});
