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
} from "react-native";
import { useState, useEffect } from "react";
import { LogOut, Save } from "lucide-react-native";

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

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? "");
      setMorningBriefing(settings.morningBriefingEnabled);
      setPushNotifications(settings.pushNotificationsEnabled);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!user?.id) return;
    await upsert({
      userId: user.id,
      displayName,
      morningBriefingEnabled: morningBriefing,
      pushNotificationsEnabled: pushNotifications,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How should Pierre address you?"
            placeholderTextColor="#555"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.toggle}>
          <View>
            <Text style={styles.toggleLabel}>Morning Briefing</Text>
            <Text style={styles.toggleDesc}>Daily email & Slack summary</Text>
          </View>
          <Switch
            value={morningBriefing}
            onValueChange={setMorningBriefing}
            trackColor={{ false: "#333", true: "#fff" }}
            thumbColor={morningBriefing ? "#0a0a0a" : "#666"}
          />
        </View>
        <View style={styles.toggle}>
          <View>
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Text style={styles.toggleDesc}>Get notified of agent responses</Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: "#333", true: "#fff" }}
            thumbColor={pushNotifications ? "#0a0a0a" : "#666"}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Save size={18} color="#0a0a0a" />
        <Text style={styles.saveText}>Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => signOut()}
      >
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { color: "#888", fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 12 },
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
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  toggleLabel: { color: "#fff", fontSize: 16 },
  toggleDesc: { color: "#666", fontSize: 12, marginTop: 2 },
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
  saveText: { color: "#0a0a0a", fontSize: 16, fontWeight: "600" },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  signOutText: { color: "#ef4444", fontSize: 16 },
});
