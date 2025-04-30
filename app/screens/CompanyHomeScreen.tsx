import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";

export default function SurveyHomeScreen() {
  const surveys = [
    {
      id: 1,
      title: "Tagging Feature",
      description: "A sales presentation with a potential client. The meeting is set to take place in London, and the appli...",
      peopleCount: 128,
      date: "This month, April 2025",
      borderColor: "#B6B97A"
    },
    {
      id: 2,
      title: "Conversational Journaling Feature",
      description: "A sales presentation with a potential client. The meeting is set to take place in London, and the appli...",
      peopleCount: 128,
      date: "Last month, March 2025",
      borderColor: "#B6A7E6"
    },
    {
      id: 3,
      title: "Daily Summary Feature",
      description: "A sales presentation with a potential client. The meeting is set to take place in London, and the appli...",
      peopleCount: 128,
      date: "Last month, March 2025",
      borderColor: "#7AD6B9"
    },
    {
      id: 4,
      title: "Context-Aware Follow-Ups Feature",
      description: "A sales presentation with a potential client. The meeting is set to take place in London, and the appli...",
      peopleCount: 128,
      date: "Last month, March 2025",
      borderColor: "#E6A7A7"
    }
  ];

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>~ Hi, Noah from Daymi!</Text>
            <Text style={styles.title}>Jan 2024</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.iconText}>≡</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.iconText}>🔍</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>This month, <Text style={styles.sectionHeaderBold}>April 2025</Text></Text>
            {surveys.filter(s => s.date === "This month, April 2025").map((survey, index) => (
              <View key={survey.id} style={[styles.surveyCard, { borderColor: survey.borderColor }]}> 
                <View style={styles.surveyHeader}>
                  <Text style={styles.surveyPeople}><Text style={styles.surveyPeopleIcon}>📦</Text> <Text style={styles.surveyPeopleText}>{survey.peopleCount} people surveyed</Text></Text>
                  <TouchableOpacity style={styles.moreButton}>
                    <Text style={styles.iconText}>⋮</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                <Text style={styles.surveyDescription}>{survey.description}</Text>
                <TouchableOpacity 
                  style={styles.metricsButton}
                  onPress={() => router.push("../screens/MetricScreen")}
                >
                  <Text style={styles.metricsButtonText}>See Metrics</Text>
                  <Text style={styles.metricsButtonIcon}>＋</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.sectionHeaderLast}>Last month, <Text style={styles.sectionHeaderBold}>March 2025</Text></Text>
            {surveys.filter(s => s.date === "Last month, March 2025").map((survey, index) => (
              <View key={survey.id} style={[styles.surveyCard, { borderColor: survey.borderColor }]}> 
                <View style={styles.surveyHeader}>
                  <Text style={styles.surveyPeople}><Text style={styles.surveyPeopleIcon}>📦</Text> <Text style={styles.surveyPeopleText}>{survey.peopleCount} people surveyed</Text></Text>
                  <TouchableOpacity style={styles.moreButton}>
                    <Text style={styles.iconText}>⋮</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                <Text style={styles.surveyDescription}>{survey.description}</Text>
                <TouchableOpacity 
                  style={styles.metricsButton}
                  onPress={() => router.push("../screens/MetricScreen")}
                >
                  <Text style={styles.metricsButtonText}>See Metrics</Text>
                  <Text style={styles.metricsButtonIcon}>＋</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navButton}>
              <Text style={styles.navIcon}>🏷️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButtonActive}>
              <Text style={styles.navIcon}>👜</Text>
              <Text style={styles.navTextActive}>Surveys</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                router.push("../screens/CreateSurveyScreen");
              }}
            >
              <Text style={styles.addButtonText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 16,
    color: "#666666",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#232B3A",
    marginTop: 24,
  },
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 16,
    color: "#6B6B6B",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "400",
  },
  sectionHeaderLast: {
    fontSize: 16,
    color: "#bbb",
    marginTop: 16,
    marginBottom: 4,
    fontWeight: "400",
  },
  sectionHeaderBold: {
    fontWeight: "700",
    color: "#232B3A",
  },
  surveyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  surveyPeople: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surveyPeopleIcon: {
    fontSize: 16,
  },
  surveyPeopleText: {
    fontSize: 14,
    color: "#bbb",
    fontWeight: "400",
  },
  moreButton: {
    padding: 4,
  },
  surveyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#232B3A",
    marginBottom: 8,
  },
  surveyDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  metricsButton: {
    backgroundColor: "#6C4DFF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  metricsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  metricsButtonIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 2,
  },
  dateText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginHorizontal: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  navButton: {
    alignItems: 'center',
    flex: 1,
  },
  navButtonActive: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
  },
  navText: {
    fontSize: 12,
    color: "#000000",
    marginTop: 4,
    fontWeight: "400",
  },
  navTextActive: {
    fontSize: 14,
    color: "#232B3A",
    marginTop: 4,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: "#232B3A",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: -2,
  },
}); 