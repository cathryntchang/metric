import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { StyledInput } from "../components/StyledInput";
import { StyledButton } from "../components/StyledButton";
import { router } from "expo-router";
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;

export const UserLoginScreen = () => {
  const [username, setUsername] = useState("");

  const handleContinue = async () => {
    if (!username.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your username.",
        [{ text: "OK" }]
      );
      return;
    }

    // Only allow Cathryn, Danica, or Christy as valid usernames (case-sensitive)
    const validUsernames = ['Cathryn', 'Danica', 'Christy'];
    if (!validUsernames.includes(username)) {
      Alert.alert(
        "Invalid Username",
        "Please enter a valid username (Cathryn, Danica, or Christy).",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Get the user document
        const userDoc = querySnapshot.docs[0];
        
        // Increment login count
        await updateDoc(doc(usersRef, userDoc.id), {
          loginCount: increment(1)
        });

        console.log(`${username} logged in. Login count incremented.`);
        
        // Navigate to user home page after successful login
        router.replace("../screens/UserHomeScreen");
      } else {
        Alert.alert(
          "Error",
          "User account not found. Please contact support.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error checking username:", error);
      Alert.alert(
        "Error",
        "An error occurred while checking the username. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Image
              source={require('../../assets/images/metric_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Login to Metric</Text>
            <Text style={styles.subtitle}>Sign in to your user account</Text>
            
            <StyledInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />

            <View style={styles.buttonContainer}>
              <StyledButton title="LOG IN" onPress={handleContinue} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logo: {
    width: 104,
    height: 104,
    marginBottom: 20,
  },
  title: {
    fontSize: isSmallDevice ? 32 : 36,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  buttonContainer: {
    marginTop: 20,
    width: "100%",
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#446388',
    fontWeight: '500',
  },
}); 