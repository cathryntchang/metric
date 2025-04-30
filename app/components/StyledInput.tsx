import React from "react";
import {
  TextInput,
  View,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";

interface StyledInputProps {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
}

const { width } = Dimensions.get("window");
const inputWidth = Math.min(width - 40, 319);

export const StyledInput: React.FC<StyledInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
}) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#909090"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: inputWidth,
    height: 63,
    backgroundColor: "#D1DACF",
    borderRadius: 31.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  input: {
    width: "100%",
    height: "80%",
    fontSize: 18,
    color: "#000000",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
});
