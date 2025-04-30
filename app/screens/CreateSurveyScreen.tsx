import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { createNewSurvey, getUserByUsername } from "../firebase/firebase";

export default function CreateSurveyScreen() {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [questions, setQuestions] = useState([
    { questionText: "", order: 1 }
  ]);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [newInvitee, setNewInvitee] = useState("");

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", order: questions.length + 1 }
    ]);
  };

  const handleQuestionChange = (text: string, index: number) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = text;
    setQuestions(newQuestions);
  };

  const handleAddInvitee = async () => {
    if (!newInvitee.trim()) return;

    try {
      const user = await getUserByUsername(newInvitee.trim());
      if (user) {
        if (invitedUsers.includes(newInvitee.trim())) {
          Alert.alert("Already Added", "This user has already been added to the survey.");
        } else {
          setInvitedUsers([...invitedUsers, newInvitee.trim()]);
          setNewInvitee("");
        }
      } else {
        Alert.alert("Invalid Username", "Please enter a valid username.");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      Alert.alert("Error", "Failed to verify username. Please try again.");
    }
  };

  const handleRemoveInvitee = (index: number) => {
    const newInvitedUsers = [...invitedUsers];
    newInvitedUsers.splice(index, 1);
    setInvitedUsers(newInvitedUsers);
  };

  const handleRemoveQuestion = (indexToRemove: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, index) => index !== indexToRemove);
      // Update order numbers
      const updatedQuestions = newQuestions.map((q, index) => ({
        ...q,
        order: index + 1
      }));
      setQuestions(updatedQuestions);
    } else {
      Alert.alert("Cannot remove", "You must have at least one question");
    }
  };

  const handleSave = async () => {
    // Validation checks
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a project title");
      return;
    }

    if (invitedUsers.length === 0) {
      Alert.alert("Error", "Please add at least one person to the survey");
      return;
    }

    const hasValidQuestion = questions.some(q => q.questionText.trim());
    if (!hasValidQuestion) {
      Alert.alert("Error", "Please add at least one question with content");
      return;
    }

    try {
      // For now hardcoding Daymi's company ID - in real app would get from auth context
      const companyId = "LEyaRS2Mv7CLzP20K0Pe"; // TODO: Get from auth context
      await createNewSurvey(
        companyId,
        title.trim(),
        invitedUsers,
        questions.filter(q => q.questionText.trim()) // Only save non-empty questions
      );
      router.back();
    } catch (error: any) {
      console.error("Error saving survey:", error);
      const errorMessage = error.message === 'Company not found' 
        ? "Company not found. Please check your company ID."
        : "Failed to save survey. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Metric Survey</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Project Title*"
            placeholderTextColor="#A0A0A0"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.contextInput}
            placeholder="Give context here..."
            placeholderTextColor="#A0A0A0"
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.helperText}>Include your goals, why you want this feature, etc</Text>

          <TouchableOpacity 
            style={styles.addPeopleButton}
            onPress={() => setShowAddPeople(!showAddPeople)}
          >
            <Text style={styles.addPeopleIcon}>👤</Text>
            <Text style={styles.addPeopleText}>
              {invitedUsers.length ? `${invitedUsers.length} people added` : "+ Add people*"}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddPeople && (
          <View style={styles.inviteSection}>
            <View style={styles.addInviteeContainer}>
              <TextInput
                style={styles.inviteeInput}
                placeholder="Enter username"
                value={newInvitee}
                onChangeText={setNewInvitee}
                onSubmitEditing={handleAddInvitee}
              />
              <TouchableOpacity 
                style={styles.addInviteeButton}
                onPress={handleAddInvitee}
              >
                <Text>Add</Text>
              </TouchableOpacity>
            </View>
            {invitedUsers.map((user, index) => (
              <View key={index} style={styles.inviteeItem}>
                <Text>{user}</Text>
                <TouchableOpacity onPress={() => handleRemoveInvitee(index)}>
                  <Text style={styles.removeInviteeButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.questionsSection}>
          <Text style={styles.sectionLabel}>Questions*</Text>
          {questions.map((question, index) => (
            <View key={index} style={styles.questionWrapper}>
              <View style={styles.questionContainer}>
                <View style={styles.questionDot} />
                <TextInput
                  style={styles.questionInput}
                  placeholder={`Question ${index + 1}*`}
                  placeholderTextColor="#A0A0A0"
                  value={question.questionText}
                  onChangeText={(text) => handleQuestionChange(text, index)}
                  multiline
                />
                <TouchableOpacity 
                  onPress={() => handleRemoveQuestion(index)}
                  style={styles.removeQuestionButton}
                >
                  <Text style={styles.removeQuestionText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.addQuestionButton}
          onPress={handleAddQuestion}
        >
          <Text style={styles.addQuestionText}>+ Add Question</Text>
        </TouchableOpacity>
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
    padding: 20,
    borderBottomWidth: 0,
    backgroundColor: "#fff",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "#F4F0FF",
    borderRadius: 20,
  },
  closeIcon: {
    fontSize: 28,
    color: "#181818",
    fontWeight: "400",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#181818",
  },
  saveButton: {
    backgroundColor: "#7B61FF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 0,
    backgroundColor: "#F8F8FA",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 20,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  titleInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FAFAFB",
    color: "#181818",
  },
  contextInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 80,
    backgroundColor: "#FAFAFB",
    color: "#181818",
    marginBottom: 8,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 16,
    marginLeft: 4,
  },
  addPeopleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFB",
    marginBottom: 16,
  },
  addPeopleIcon: {
    fontSize: 20,
    color: "#A0A0A0",
  },
  addPeopleText: {
    color: "#A0A0A0",
    fontSize: 16,
    fontWeight: "400",
  },
  timeInput: {
    marginBottom: 24,
  },
  durationInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFB",
    color: "#181818",
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFB",
  },
  dateText: {
    fontSize: 16,
    color: "#A0A0A0",
  },
  clockIcon: {
    fontSize: 18,
    color: "#A0A0A0",
  },
  questionWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    backgroundColor: "#FAFAFB",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  questionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#C6A9FF",
  },
  questionInput: {
    flex: 1,
    fontSize: 16,
    color: "#181818",
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  addQuestionButton: {
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    backgroundColor: "#FAFAFB",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  addQuestionText: {
    color: "#A0A0A0",
    fontSize: 16,
    fontWeight: "400",
  },
  inviteSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addInviteeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inviteeInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
  },
  addInviteeButton: {
    backgroundColor: '#446388',
    padding: 8,
    borderRadius: 4,
    justifyContent: 'center',
  },
  inviteeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  removeInviteeButton: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeQuestionButton: {
    padding: 4,
    marginLeft: 'auto',
  },
  removeQuestionText: {
    fontSize: 24,
    color: "#FF4444",
    fontWeight: "400",
  },
  questionsSection: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#181818",
    marginLeft: 20,
    marginBottom: 12,
  },
}); 