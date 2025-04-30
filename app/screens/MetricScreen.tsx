import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";

export default function SurveySummaryScreen() {
  const keywords1 = [
    { id: 1, text: "Too bright", color: "#FFB800" },
    { id: 2, text: "Crowded", color: "#9747FF" },
    { id: 3, text: "Love it!", color: "#FF4747" },
    { id: 4, text: "Creative", color: "#666666" },
    { id: 5, text: "Meh...", color: "#1E7F2C" },
  ];

  const keywords2 = [
    { id: 1, text: "Too bright", color: "#FFB800" },
    { id: 2, text: "Hangout", color: "#9747FF" },
    { id: 3, text: "Cooking", color: "#FF4747" },
    { id: 4, text: "Other", color: "#666666" },
    { id: 5, text: "Weekend", color: "#1E7F2C" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tag Feature Summary</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>Q1. What are your thoughts on the UI</Text>
          <Text style={styles.subtitle}>Here's what they said...</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={[styles.statBar, { width: '60%' }]} />
              <Text style={styles.statText}>60% users loved it</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statBar, { width: '30%' }]} />
              <Text style={styles.statText}>30% users don't like it</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statBar, { width: '10%' }]} />
              <Text style={styles.statText}>10% users kinda liked it</Text>
            </View>
          </View>

          <Text style={styles.keywordsTitle}>Keywords</Text>
          <View style={styles.keywordsContainer}>
            {keywords1.map((keyword) => (
              <View 
                key={keyword.id}
                style={[styles.keywordPill, { backgroundColor: keyword.color + '20' }]}
              >
                <View style={[styles.keywordDot, { backgroundColor: keyword.color }]} />
                <Text style={styles.keywordText}>{keyword.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>Q2. What are your thoughts on the UI</Text>
          <Text style={styles.subtitle}>Here's what they said...</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={[styles.statBar, { width: '60%' }]} />
              <Text style={styles.statText}>60% users said yes</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statBar, { width: '30%' }]} />
              <Text style={styles.statText}>30% users said no</Text>
            </View>
          </View>

          <Text style={styles.keywordsTitle}>Keywords</Text>
          <View style={styles.keywordsContainer}>
            {keywords2.map((keyword) => (
              <View 
                key={keyword.id}
                style={[styles.keywordPill, { backgroundColor: keyword.color + '20' }]}
              >
                <View style={[styles.keywordDot, { backgroundColor: keyword.color }]} />
                <Text style={styles.keywordText}>{keyword.text}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addKeywordButton}>
              <Text style={styles.addKeywordText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>Insights on tagging feature...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: "#F4F0FF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    color: "#181818",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 16,
    fontWeight: "400",
  },
  statsContainer: {
    marginBottom: 24,
  },
  statRow: {
    marginBottom: 12,
  },
  statBar: {
    height: 6,
    backgroundColor: "#7B61FF",
    borderRadius: 3,
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: "#6B6B6B",
    marginLeft: 0,
    fontWeight: "400",
  },
  keywordsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#181818",
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 0,
  },
  keywordPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  keywordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  keywordText: {
    fontSize: 14,
    color: "#181818",
    fontWeight: "500",
  },
  addKeywordButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0FF",
    marginBottom: 8,
  },
  addKeywordText: {
    fontSize: 18,
    color: "#7B61FF",
    fontWeight: "700",
  },
  summarySection: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#FFFDEB',
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#181818",
  },
  summaryText: {
    fontSize: 14,
    color: "#6B6B6B",
    fontWeight: "400",
  },
}); 