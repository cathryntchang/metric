import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { getCompanySurveys, getCompanyDetails, deleteSurvey } from "../firebase/firebase";
import { useFocusEffect } from "@react-navigation/native";

export default function SurveyHomeScreen() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState<string>("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [surveyMenuVisible, setSurveyMenuVisible] = useState(false);

  const fetchCompanyDetails = async () => {
    try {
      const companyId = "LEyaRS2Mv7CLzP20K0Pe"; // Daymi's company ID
      const companyData = await getCompanyDetails(companyId);
      setCompanyName(companyData.name || "Company"); // Note: using 'name' instead of 'companyName'
    } catch (error) {
      console.error("Error fetching company details:", error);
      setCompanyName("Company"); // Fallback name
    }
  };

  const fetchSurveys = async () => {
    try {
      const companyId = "LEyaRS2Mv7CLzP20K0Pe"; // Daymi's company ID
      const companySurveys = await getCompanySurveys(companyId);
      setSurveys(companySurveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchCompanyDetails();
      fetchSurveys();
    }, [])
  );

  const getSurveyBorderColor = (index: number) => {
    const colors = ["#B6B97A", "#B6A7E6", "#7AD6B9", "#E6A7A7"];
    return colors[index % colors.length];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isThisMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    if (isThisMonth) {
      return "This month, " + date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return "Last month, " + date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
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

  const handleDeleteSurvey = async (surveyId: string) => {
    Alert.alert(
      "Delete Survey",
      "Are you sure you want to delete this survey? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setSurveyMenuVisible(false)
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSurvey(surveyId);
              setSurveyMenuVisible(false);
              // Refresh the surveys list
              fetchSurveys();
            } catch (error) {
              console.error("Error deleting survey:", error);
              Alert.alert("Error", "Failed to delete survey. Please try again.");
            }
          }
        }
      ]
    );
  };

  const filteredSurveys = surveys.filter(survey => 
    survey.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSurveys = (surveysToRender: any[]) => {
    return surveysToRender.map((survey, index) => (
      <View key={survey.id} style={[styles.surveyCard, { borderColor: getSurveyBorderColor(index) }]}> 
        <View style={styles.surveyHeader}>
          <Text style={styles.surveyPeople}>
            <Text style={styles.surveyPeopleIcon}>📦</Text> 
            <Text style={styles.surveyPeopleText}>
              {survey.respondentCount || 0} {(survey.respondentCount || 0) === 1 ? 'response' : 'responses'}
            </Text>
          </Text>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => {
              setSelectedSurveyId(survey.id);
              setSurveyMenuVisible(true);
            }}
          >
            <Text style={styles.iconText}>⋮</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.surveyTitle}>{survey.title}</Text>
        <Text style={styles.surveyDescription}>
          {survey.context ? `Looking to ${survey.context.toLowerCase()}` : "Looking for general feedback"}
        </Text>
        <TouchableOpacity 
          style={styles.metricsButton}
          onPress={() => router.push(`/screens/MetricScreen?surveyId=${survey.id}`)}
        >
          <Text style={styles.metricsButtonText}>See Metrics</Text>
          <Text style={styles.metricsButtonIcon}>＋</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>~ Hi, {companyName}!</Text>
            <Text style={styles.title}>Jan 2024</Text>
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
                    renderSurveys(filteredSurveys)
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

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

          {/* Survey Menu Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={surveyMenuVisible}
            onRequestClose={() => setSurveyMenuVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setSurveyMenuVisible(false)}
            >
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={[styles.menuItem, styles.deleteButton]}
                  onPress={() => selectedSurveyId && handleDeleteSurvey(selectedSurveyId)}
                >
                  <Text style={[styles.menuItemText, styles.deleteText]}>Delete Survey</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {surveys.length === 0 ? (
              <Text style={styles.noSurveysText}>No surveys yet. Create your first survey!</Text>
            ) : (
              <>
                <Text style={styles.sectionHeader}>This month, <Text style={styles.sectionHeaderBold}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text></Text>
                {renderSurveys(surveys.filter(s => formatDate(s.createdAt) === `This month, ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`))}
                <Text style={styles.sectionHeaderLast}>Last month, <Text style={styles.sectionHeaderBold}>
                  {new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text></Text>
                {renderSurveys(surveys.filter(s => formatDate(s.createdAt) === `Last month, ${new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`))}
              </>
            )}
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
  noSurveysText: {
    textAlign: 'center',
    color: '#6B6B6B',
    fontSize: 16,
    marginTop: 40,
    fontStyle: 'italic'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
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
  deleteButton: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  deleteText: {
    color: '#FF3B30',
  },
}); 