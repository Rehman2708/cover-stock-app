import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppHeader } from "../../components/common/AppHeader";
import { Button } from "../../components/common/Button";
import { Screen } from "../../components/common/Screen";
import { colors, radius, spacing } from "../../design-system/tokens";
import { useAuth } from "../../features/auth/AuthProvider";
import {
  changePassword,
  updateProfile,
} from "../../features/profile/profileApi";

export default function ProfileRoute() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [editingName, setEditingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const saveName = async () => {
    setError(null);
    setNotice(null);
    setSavingName(true);
    try {
      const updated = await updateProfile({ name: name.trim() });
      setName(updated.name);
      updateUser(updated);
      setEditingName(false);
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

  return (
    <Screen
      header={
        <AppHeader
          eyebrow="ACCOUNT"
          title="Profile"
          subtitle="Manage your personal details and sign-in security."
        />
      }
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

      {error ? (
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
              onPress={() => {
                setError(null);
                setNotice(null);
                setEditingName((open) => !open);
              }}
              hitSlop={8}
            >
              <Text style={styles.action}>Edit</Text>
            </Pressable>
          </View>
          {editingName ? (
            <View style={styles.form}>
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholder="Enter your name"
              />
              <Button
                label="Save name"
                loading={savingName}
                onPress={saveName}
              />
            </View>
          ) : null}
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
              onPress={() => {
                setError(null);
                setNotice(null);
                setShowPasswordForm((open) => !open);
              }}
              hitSlop={8}
            >
              <Text style={styles.action}>Change</Text>
            </Pressable>
          </View>
          {showPasswordForm ? (
            <View style={styles.form}>
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
            </View>
          ) : null}
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
    </Screen>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
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

const styles = StyleSheet.create({
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
  form: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
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
