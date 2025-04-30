import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { chatService } from "./services/chatService";
import { getSurveyById } from "./firebase/firebase";

const userAvatar = "https://randomuser.me/api/portraits/women/2.jpg";
const noahAvatar = "https://randomuser.me/api/portraits/men/1.jpg";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function ChatScreen() {
  const { surveyId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyTitle, setSurveyTitle] = useState<string>("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize chat with first message
  useEffect(() => {
    if (!surveyId) {
      setError('No survey ID provided');
      setIsInitializing(false);
      return;
    }

    const initializeChat = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Load existing messages for this survey
        const existingMessages = chatService.getContext(surveyId as string);
        if (existingMessages.length > 0) {
          const formattedMessages = existingMessages.map(msg => ({
            id: Date.now().toString() + Math.random(),
            text: msg.content,
            isUser: msg.role === 'user'
          }));
          setMessages(formattedMessages);
        } else {
          // If no existing messages, fetch survey data and create initial message
          const survey = await getSurveyById(surveyId as string);
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
  }, [surveyId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !surveyId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(surveyId as string, userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#7B61FF" />
        <Text style={styles.loadingText}>Loading survey...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.replace("../screens/UserHomeScreen.tsx")}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("../screens/UserHomeScreen.tsx")}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Image source={{ uri: noahAvatar }} style={styles.avatar} />
            <View>
              <Text style={styles.name}>Noah</Text>
              <Text style={styles.subtitle}>{surveyTitle}</Text>
            </View>
          </View>
          <Text style={styles.time}>10:00</Text>
        </View>

        {/* Chat messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messages} 
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {messages.map((message) => (
            <View key={message.id} style={styles.messageRow}>
              {!message.isUser && <Image source={{ uri: noahAvatar }} style={styles.avatarSmall} />}
              <View style={{ flex: 1 }}>
                {!message.isUser && <Text style={styles.sender}>Noah</Text>}
                {message.isUser && <Text style={styles.senderRight}>You</Text>}
                <View style={message.isUser ? styles.bubbleRight : styles.bubbleLeft}>
                  <Text style={message.isUser ? { color: "#fff" } : {}}>{message.text}</Text>
                </View>
              </View>
              {message.isUser && <Image source={{ uri: userAvatar }} style={styles.avatarSmall} />}
            </View>
          ))}
          {isLoading && (
            <View style={styles.messageRow}>
              <Image source={{ uri: noahAvatar }} style={styles.avatarSmall} />
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
          <TouchableOpacity><Text style={styles.plus}>+</Text></TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isLoading}
          />
          <TouchableOpacity onPress={handleSend} disabled={isLoading}>
            <Text style={[styles.send, isLoading && styles.sendDisabled]}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#fff" },
  backArrow: { fontSize: 24, marginRight: 8 },
  headerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  name: { fontWeight: "700", fontSize: 16 },
  subtitle: { color: "#888", fontSize: 12 },
  time: { color: "#888", fontSize: 14 },
  messages: { flex: 1, padding: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, marginRight: 8, marginLeft: 8 },
  sender: { fontWeight: "600", fontSize: 13, color: "#222" },
  senderRight: { fontWeight: "600", fontSize: 13, color: "#3B217F", textAlign: "right" },
  bubbleLeft: { backgroundColor: "#f3f3f3", borderRadius: 16, padding: 10, marginBottom: 4, maxWidth: 220 },
  bubbleRight: { backgroundColor: "#7B61FF", borderRadius: 16, padding: 10, marginBottom: 4, maxWidth: 220, alignSelf: "flex-end" },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 8, borderTopWidth: 1, borderColor: "#eee", backgroundColor: "#fff" },
  plus: { fontSize: 24, color: "#7B61FF", marginHorizontal: 8 },
  input: { flex: 1, backgroundColor: "#f3f3f3", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, marginHorizontal: 8 },
  send: { fontSize: 24, color: "#7B61FF", marginHorizontal: 8 },
  sendDisabled: { color: "#ccc" },
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
}); 