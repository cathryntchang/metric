import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

const companies = [
  { id: 1, name: "Beli", date: "12 August 2024", duration: "10 mins" },
  { id: 2, name: "JP Morgan", date: "07 August 2024", duration: "5 mins" },
  { id: 3, name: "MDB", date: "07 August 2024", duration: "5 mins" },
];

export default function UserHome() {
  const [activeTab, setActiveTab] = useState("Month");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>~ Hi, Danica!</Text>
          <TouchableOpacity style={styles.searchCircle}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Invite Card */}
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>New Invite!</Text>
          <Text style={styles.inviteTitle}>Daymi</Text>
          <View style={styles.inviteButtonsRow}>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Start</Text>
              <Text style={styles.buttonIcon}>⬇️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.withdrawButton}>
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
              <Text style={styles.buttonIcon}>↗️</Text>
            </TouchableOpacity>
          </View>
        </View>

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
          {companies.map(company => (
            <TouchableOpacity
              key={company.id}
              style={styles.companyCard}
              onPress={() => router.push('/chat')}
            >
              <View style={styles.companyLogoPlaceholder} />
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companyDate}>{company.date}</Text>
              </View>
              <Text style={styles.companyDuration}>{company.duration}</Text>
            </TouchableOpacity>
          ))}
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
  searchCircle: { backgroundColor: "#E9ECF6", borderRadius: 24, padding: 8 },
  searchIcon: { fontSize: 22 },
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
  companyDuration: { color: "#232B3A", fontWeight: "600", fontSize: 15 }
}); 