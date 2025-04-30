import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { getUserSurveys, withdrawFromSurvey, acceptSurvey } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function UserHome() {
  const [activeTab, setActiveTab] = useState("Month");
  const [pendingSurveys, setPendingSurveys] = useState<any[]>([]);
  const [acceptedSurveys, setAcceptedSurveys] = useState<any[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const { user } = useAuth();

  const fetchSurveys = async () => {
    if (!user) return;
    
    try {
      const surveys = await getUserSurveys(user.username);
      const pending = surveys.filter(survey => survey.status === 'pending');
      const accepted = surveys.filter(survey => survey.status === 'accepted');
      setPendingSurveys(pending);
      setAcceptedSurveys(accepted);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [user]);

  const handleStart = async (surveyId: string) => {
    if (!user) return;

    try {
      await acceptSurvey(user.id, surveyId);
      await fetchSurveys(); // Refresh the lists
      router.push(`/chat?surveyId=${surveyId}`);
    } catch (error) {
      console.error("Error accepting survey:", error);
      Alert.alert("Error", "Failed to start survey. Please try again.");
    }
  };

  const handleWithdraw = async (surveyId: string) => {
    if (!user) return;

    Alert.alert(
      "Withdraw from Survey",
      "Are you sure you want to withdraw from this survey?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              await withdrawFromSurvey(user.id, surveyId);
              // Refresh the surveys list
              await fetchSurveys();
              Alert.alert("Success", "You have been withdrawn from the survey.");
            } catch (error) {
              console.error("Error withdrawing from survey:", error);
              Alert.alert("Error", "Failed to withdraw from survey. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            setMenuVisible(false);
            router.replace("/");
          }
        }
      ]
    );
  };

  const filteredSurveys = acceptedSurveys.filter(survey => 
    survey.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAcceptedSurvey = (survey: any) => (
    <TouchableOpacity
      key={survey.id}
      style={styles.companyCard}
      onPress={() => router.push(`/chat?surveyId=${survey.id}`)}
    >
      <View style={styles.companyLogoPlaceholder} />
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{survey.title}</Text>
        <Text style={styles.companyDate}>
          {new Date(survey.createdAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>
      <Text style={styles.companyDuration}>5 mins</Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Please log in to view your surveys</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>~ Hi, {user.username}!</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setMenuVisible(true)}
            >
              <Text style={styles.iconText}>≡</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setSearchVisible(true)}
            >
              <Text style={styles.iconText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Search Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={searchVisible}
          onRequestClose={() => setSearchVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.searchContainer}>
              <View style={styles.searchHeader}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search surveys..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setSearchVisible(false);
                    setSearchQuery("");
                  }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.searchResults}>
                {filteredSurveys.length === 0 ? (
                  <Text style={styles.noResultsText}>No surveys found</Text>
                ) : (
                  filteredSurveys.map(renderAcceptedSurvey)
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Pending Survey Invites */}
        {pendingSurveys.map(survey => (
          <View key={survey.id} style={styles.inviteCard}>
            <Text style={styles.inviteLabel}>New Invite!</Text>
            <Text style={styles.inviteTitle}>{survey.title}</Text>
            <View style={styles.inviteButtonsRow}>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => handleStart(survey.id)}
              >
                <Text style={styles.startButtonText}>Start</Text>
                <Text style={styles.buttonIcon}>⬇️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.withdrawButton}
                onPress={() => handleWithdraw(survey.id)}
              >
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
                <Text style={styles.buttonIcon}>↗️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Recent Conversations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Conversations</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tabsRow}>
            {['Week', 'Month', 'Year'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {acceptedSurveys.length === 0 ? (
            <Text style={styles.noSurveysText}>No accepted surveys yet</Text>
          ) : (
            acceptedSurveys.map(renderAcceptedSurvey)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollView: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  greeting: { fontSize: 16, color: "#222" },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 20,
  },
  inviteCard: { backgroundColor: "#F3EEFF", borderRadius: 28, margin: 16, padding: 24, alignItems: "center" },
  inviteLabel: { color: "#222", fontSize: 16, marginBottom: 8, marginTop: 4 },
  inviteTitle: { color: "#3B217F", fontSize: 32, fontWeight: "700", marginBottom: 24 },
  inviteButtonsRow: { flexDirection: "row", width: "100%", justifyContent: "space-between" },
  startButton: { flex: 1, backgroundColor: "#4B2BAE", borderRadius: 18, paddingVertical: 18, alignItems: "center", marginRight: 12, flexDirection: "row", justifyContent: "center" },
  withdrawButton: { flex: 1, backgroundColor: "#fff", borderRadius: 18, paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", borderWidth: 1, borderColor: "#E9ECF6" },
  startButtonText: { color: "#fff", fontWeight: "600", fontSize: 18, marginRight: 8 },
  withdrawButtonText: { color: "#3B217F", fontWeight: "600", fontSize: 18, marginRight: 8 },
  buttonIcon: { fontSize: 18 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontWeight: "700", fontSize: 18, color: "#232B3A" },
  seeAll: { color: "#6B6B6B", fontSize: 14 },
  tabsRow: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 16, marginBottom: 16, marginTop: 8 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 16 },
  activeTab: { backgroundColor: "#fff" },
  tabText: { color: "#6B6B6B", fontSize: 15 },
  activeTabText: { color: "#232B3A", fontWeight: "700" },
  companyCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  companyLogoPlaceholder: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#F3F4F6", marginRight: 12 },
  companyInfo: { flex: 1 },
  companyName: { fontWeight: "600", fontSize: 16, color: "#232B3A" },
  companyDate: { color: "#6B6B6B", fontSize: 13 },
  companyDuration: { color: "#232B3A", fontWeight: "600", fontSize: 15 },
  noSurveysText: { 
    textAlign: 'center', 
    color: '#6B6B6B', 
    fontSize: 14, 
    marginTop: 20,
    fontStyle: 'italic'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  searchContainer: {
    backgroundColor: 'white',
    marginTop: 60,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  closeButton: {
    marginLeft: 12,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  searchResults: {
    maxHeight: '100%',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#6B6B6B',
    fontSize: 16,
    marginTop: 20,
    fontStyle: 'italic',
  },
  menuContainer: {
    backgroundColor: 'white',
    marginTop: 60,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#232B3A',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  logoutText: {
    color: '#FF3B30',
  },
}); 