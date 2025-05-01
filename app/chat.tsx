import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { chatService } from "./services/chatService";
import { getSurveyById } from "./firebase/firebase";
import { useAuth } from "./context/AuthContext";
import Constants from 'expo-constants';

// Import the image statically
const userAvatar = "https://randomuser.me/api/portraits/women/2.jpg";
const noahAvatar = require("../assets/images/metric_daymiProfile.png");
const CHAT_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface Survey {
  id: string;
  title: string;
  context?: string;
}

const UserAvatar = ({ name }: { name: string }) => (
  <View style={styles.userAvatarContainer}>
    <Text style={styles.userAvatarText}>{name.charAt(0).toUpperCase()}</Text>
  </View>
);

export default function ChatScreen() {
  const { surveyId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyTitle, setSurveyTitle] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(CHAT_TIMEOUT);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const chatStartTime = useRef(Date.now());

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
  }, [user]);

  useEffect(() => {
    // Timer countdown
    const timer = setInterval(() => {
      const elapsed = Date.now() - chatStartTime.current;
      const remaining = Math.max(0, CHAT_TIMEOUT - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        Alert.alert(
          "Chat Time Expired",
          "Your chat session has ended. Thank you for participating!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize chat with first message
  useEffect(() => {
    if (!surveyId || !user) {
      setError('No survey ID or user provided');
      setIsInitializing(false);
      return;
    }

    const initializeChat = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Load existing messages for this survey
        const existingMessages = chatService.getContext(surveyId as string, user.id);
        if (existingMessages.length > 0) {
          const formattedMessages = existingMessages.map(msg => ({
            id: Date.now().toString() + Math.random(),
            text: msg.content,
            isUser: msg.role === 'user'
          }));
          setMessages(formattedMessages);
        } else {
          // If no existing messages, fetch survey data and create initial message
          const survey = await getSurveyById(surveyId as string) as Survey;
          if (survey) {
            setSurveyTitle(survey.title);
            const initialMessage: Message = {
              id: Date.now().toString(),
              text: `Hi! I'd like to get your feedback on ${survey.title}. ${survey.context ? `We're looking to ${survey.context.toLowerCase()}.` : 'Your feedback will help us improve and better serve our customers.'} Would you like to share your thoughts?`,
              isUser: false
            };
            setMessages([initialMessage]);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to load survey. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [surveyId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(surveyId as string, inputText, user.id);
      
      // Split the response into multiple messages
      const responseMessages = response.split('||').map((text, index) => ({
        id: (Date.now() + index + 1).toString(),
        text: text.trim(),
        isUser: false
      }));

      // Add messages with a slight delay between them
      for (let i = 0; i < responseMessages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, i * 500)); // 500ms delay between messages
        setMessages(prev => [...prev, responseMessages[i]]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your message right now. Please try again.",
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#7B61FF" />
        <Text style={styles.loadingText}>Loading survey...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Image 
              source={require("../assets/images/metric_daymiProfile.png")} 
              style={styles.avatar}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.name}>Noah</Text>
              <Text style={styles.subtitle}>{surveyTitle}</Text>
            </View>
          </View>
          <Text style={styles.time}>{formatTime(timeLeft)}</Text>
        </View>

        {/* Chat messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messages} 
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View key={message.id} style={[
              styles.messageRow,
              message.isUser ? styles.messageRowRight : styles.messageRowLeft
            ]}>
              {!message.isUser && (
                <Image 
                  source={require("../assets/images/metric_daymiProfile.png")} 
                  style={styles.avatarSmall}
                  resizeMode="contain"
                />
              )}
              <View style={[
                styles.messageContent,
                message.isUser ? styles.messageContentRight : styles.messageContentLeft
              ]}>
                {!message.isUser && <Text style={styles.sender}>Noah</Text>}
                {message.isUser && <Text style={styles.senderRight}>You</Text>}
                <View style={message.isUser ? styles.bubbleRight : styles.bubbleLeft}>
                  <Text style={message.isUser ? styles.textWhite : styles.textDark}>{message.text}</Text>
                </View>
              </View>
              {message.isUser && <UserAvatar name={user?.username || 'U'} />}
            </View>
          ))}
          {isLoading && (
            <View style={styles.messageRow}>
              <Image 
                source={require("../assets/images/metric_daymiProfile.png")} 
                style={styles.avatarSmall}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.sender}>Noah</Text>
                <View style={styles.bubbleLeft}>
                  <ActivityIndicator size="small" color="#7B61FF" />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.plusButton}>
            <Text style={styles.plus}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isLoading && timeLeft > 0}
          />
          <TouchableOpacity 
            onPress={handleSend} 
            disabled={isLoading || timeLeft === 0}
            style={styles.sendButton}
          >
            <Text style={[styles.send, (isLoading || timeLeft === 0) && styles.sendDisabled]}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
    width: '100%',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 16 : 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  backArrow: { 
    fontSize: 24, 
    color: "#7B61FF",
  },
  headerInfo: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1, 
    marginLeft: 8,
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 12,
  },
  name: { 
    fontWeight: "700", 
    fontSize: 16, 
    color: "#232B3A",
  },
  subtitle: { 
    color: "#6B6B6B", 
    fontSize: 13,
  },
  time: { 
    color: "#7B61FF", 
    fontSize: 14, 
    fontWeight: "600",
  },
  messages: { 
    flex: 1,
    backgroundColor: "#F5F7FA",
    width: '100%',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    width: '100%',
  },
  messageRow: { 
    flexDirection: "row", 
    alignItems: "flex-end", 
    marginBottom: 16,
    width: '100%',
  },
  messageContent: {
    flex: 1,
    maxWidth: "75%",
  },
  avatarSmall: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    marginHorizontal: 8,
  },
  sender: { 
    fontWeight: "600", 
    fontSize: 13, 
    color: "#232B3A", 
    marginBottom: 4,
    marginLeft: 4,
  },
  senderRight: { 
    fontWeight: "600", 
    fontSize: 13, 
    color: "#7B61FF", 
    textAlign: "right",
    marginBottom: 4,
    marginRight: 4,
  },
  bubbleLeft: { 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 12,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    maxWidth: '100%',
  },
  bubbleRight: { 
    backgroundColor: "#7B61FF", 
    borderRadius: 20, 
    padding: 12,
    paddingLeft: 16,
    alignSelf: "flex-end",
    maxWidth: '100%',
  },
  textWhite: {
    color: "#fff",
  },
  textDark: {
    color: "#232B3A",
  },
  inputRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    width: '100%',
  },
  plusButton: {
    padding: 8,
  },
  plus: { 
    fontSize: 24, 
    color: "#7B61FF",
  },
  input: { 
    flex: 1, 
    backgroundColor: "#F5F7FA", 
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginHorizontal: 8,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    padding: 8,
  },
  send: { 
    fontSize: 24, 
    color: "#7B61FF",
  },
  sendDisabled: { 
    color: "#ccc",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#7B61FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageContentRight: {
    alignItems: 'flex-end',
  },
  messageContentLeft: {
    alignItems: 'flex-start',
  },
}); 