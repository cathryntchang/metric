import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";

const userAvatar = "https://randomuser.me/api/portraits/women/2.jpg";
const noahAvatar = "https://randomuser.me/api/portraits/men/1.jpg";

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { from: "noah", text: "Hey Danica!" },
    { from: "noah", text: "This won't take long, your feedback will help!" },
    { from: "me", text: "hi noah! sure, happy to help" },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([...messages, { from: "me", text: message }]);
      setMessage("");
    }
  };

  const handleQuickReply = (text: string) => {
    setMessages([...messages, { from: "me", text }]);
    setMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("../screens/UserHomeScreen.tsx") /* or router.back() if stack */}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Image source={{ uri: noahAvatar }} style={styles.avatar} />
            <View>
              <Text style={styles.name}>Noah</Text>
              <Text style={styles.subtitle}>Daymi</Text>
            </View>
          </View>
          <Text style={styles.time}>10:00</Text>
        </View>

        {/* Chat messages */}
        <ScrollView style={styles.messages} contentContainerStyle={{ paddingBottom: 16 }}>
          {messages.map((msg, idx) =>
            msg.from === "noah" ? (
              <View key={idx} style={styles.messageRow}>
                <Image source={{ uri: noahAvatar }} style={styles.avatarSmall} />
                <View>
                  <Text style={styles.sender}>Noah</Text>
                  <View style={styles.bubbleLeft}><Text>{msg.text}</Text></View>
                </View>
              </View>
            ) : (
              <View key={idx} style={[styles.messageRow, { justifyContent: "flex-end" }]}> 
                <View>
                  <Text style={styles.senderRight}>You</Text>
                  <View style={styles.bubbleRight}><Text style={{ color: "#fff" }}>{msg.text}</Text></View>
                </View>
                <Image source={{ uri: userAvatar }} style={styles.avatarSmall} />
              </View>
            )
          )}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputRow}>
          <TouchableOpacity><Text style={styles.plus}>+</Text></TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={handleSend}>
            <Text style={styles.send}>➤</Text>
          </TouchableOpacity>
        </View>
        {/* Quick replies */}
        <View style={styles.quickReplies}>
          <TouchableOpacity style={styles.reply} onPress={() => handleQuickReply("I like it!")}><Text>I like it!</Text></TouchableOpacity>
          <TouchableOpacity style={styles.reply} onPress={() => handleQuickReply("Hm, not the best.")}><Text>Hm, not the best.</Text></TouchableOpacity>
          <TouchableOpacity style={styles.reply} onPress={() => handleQuickReply("Idk.")}><Text>Idk.</Text></TouchableOpacity>
          <Text style={styles.emoji}>😍</Text>
          <Text style={styles.emoji}>😓</Text>
          <Text style={styles.emoji}>🤔</Text>
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
  quickReplies: { flexDirection: "row", alignItems: "center", padding: 8, backgroundColor: "#fff" },
  reply: { backgroundColor: "#f3f3f3", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  emoji: { fontSize: 22, marginHorizontal: 2 },
}); 