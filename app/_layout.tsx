import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="user-login" />
      <Stack.Screen name="company-login" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="create-survey" />
      <Stack.Screen name="screens/MetricScreen" />
    </Stack>
    </AuthProvider>
  );
}
