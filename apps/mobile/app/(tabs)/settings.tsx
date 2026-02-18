import { useUser, useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { LogOut, Save, Check, User, Bell } from "lucide-react-native";

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const settings = useQuery(
    api.settings.get,
    user?.id ? { userId: user.id } : "skip"
  );
  const upsert = useMutation(api.settings.upsert);

  const [displayName, setDisplayName] = useState("");
  const [morningBriefing, setMorningBriefing] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isLoading = settings === undefined;

  // Sync state from server when settings load
  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? "");
      setMorningBriefing(settings.morningBriefingEnabled ?? false);
      setPushNotifications(settings.pushNotificationsEnabled ?? false);
      setHasChanges(false);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (settings === undefined || settings === null) return;
    const changed =
      displayName !== (settings?.displayName ?? "") ||
      morningBriefing !== (settings?.morningBriefingEnabled ?? false) ||
      pushNotifications !== (settings?.pushNotificationsEnabled ?? false);
    setHasChanges(changed);
    setSaved(false);
  }, [displayName, morningBriefing, pushNotifications, settings]);

  const handleSave = useCallback(async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    try {
      await upsert({
        userId: user.id,
        displayName: displayName.trim() || undefined,
        morningBriefingEnabled: morningBriefing,
        pushNotificationsEnabled: pushNotifications,
      });
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [user?.id, saving, upsert, displayName, morningBriefing, pushNotifications]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  }, [signOut]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={14} color="#888" />
          <Text style={styles.sectionTitle}>Profile</Text>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How should Pierre address you?"
            placeholderTextColor="#555"
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>
            {user?.primaryEmailAddress?.emailAddress ?? "Not set"}
          </Text>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={14} color="#888" />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        <View style={styles.toggle}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Morning Briefing</Text>
            <Text style={styles.toggleDesc}>
              Daily summary of emails and Slack messages
            </Text>
          </View>
          <Switch
            value={morningBriefing}
            onValueChange={setMorningBriefing}
            trackColor={{ false: "#333", true: "#4ade80" }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.toggle}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Text style={styles.toggleDesc}>
              Get notified when Pierre finishes tasks
            </Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: "#333", true: "#4ade80" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          !hasChanges && !saved && styles.saveButtonDisabled,
          saved && styles.saveButtonSuccess,
        ]}
        onPress={handleSave}
        disabled={!hasChanges || saving}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#0a0a0a" />
        ) : saved ? (
          <>
            <Check size={18} color="#0a0a0a" />
            <Text style={styles.saveText}>Saved</Text>
          </>
        ) : (
          <>
            <Save size={18} color={hasChanges ? "#0a0a0a" : "#555"} />
            <Text
              style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}
            >
              Save Settings
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* App Info */}
      <Text style={styles.version}>Pierre v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  contentContainer: { padding: 16, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  // Sections
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Input
  inputGroup: { marginBottom: 16 },
  label: { color: "#ccc", fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
  },
  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
  },
  infoLabel: { color: "#ccc", fontSize: 14 },
  infoValue: { color: "#666", fontSize: 14 },
  // Toggles
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
  },
  toggleContent: { flex: 1, marginRight: 12 },
  toggleLabel: { color: "#fff", fontSize: 16 },
  toggleDesc: { color: "#666", fontSize: 12, marginTop: 2 },
  // Save
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: "#1a1a1a",
  },
  saveButtonSuccess: {
    backgroundColor: "#4ade80",
  },
  saveText: { color: "#0a0a0a", fontSize: 16, fontWeight: "600" },
  saveTextDisabled: { color: "#555" },
  // Sign Out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  signOutText: { color: "#ef4444", fontSize: 16 },
  // Version
  version: {
    color: "#333",
    fontSize: 12,
    textAlign: "center",
  },
});
