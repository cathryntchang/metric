import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Dimensions,
} from "react-native";

interface SurveyCardProps {
  title: string;
  description: string;
  surveyCount: number;
  imageUrl: string;
  onMetricsPress?: () => void;
  style?: object;
}

const { width } = Dimensions.get("window");
const cardWidth = Math.min(width - 32, 448);

export const SurveyCard: React.FC<SurveyCardProps> = ({
  title,
  description,
  surveyCount,
  imageUrl,
  onMetricsPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Image source={{ uri: imageUrl }} style={styles.icon} />
            <Text style={styles.surveyCount}>
              {surveyCount} people surveyed
            </Text>
          </View>
          <View style={styles.textContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          <View style={styles.spacer} />
        </View>
        <TouchableOpacity style={styles.metricsButton} onPress={onMetricsPress}>
          <Text style={styles.metricsText}>See Metrics</Text>
          <Image source={{ uri: "https://cdn.builder.io/api/v1/image/assets/TEMP/dddb5842f00d0aeaedcaf1b1fb21e376f737d5c5?placeholderIfAbsent=true" }} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#446388",
    flexDirection: "row",
    width: cardWidth,
    overflow: "hidden",
    marginBottom: 14,
  },
  leftBorder: {
    width: 4,
    borderRadius: 8,
    backgroundColor: "#446388",
  },
  content: {
    flex: 1,
    paddingRight: 12,
    paddingBottom: 9,
    paddingLeft: 14,
  },
  mainContent: {
    maxWidth: 261,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  icon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  surveyCount: {
    fontSize: 12,
    color: "#9a9a9a",
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  textContent: {
    marginTop: 6,
    height: 50,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1B1B",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  description: {
    fontSize: 11,
    color: "#585A66",
    marginTop: 4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  spacer: {
    minHeight: 18,
    marginTop: 6,
  },
  metricsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3F6E5E",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#446388",
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  metricsText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  arrowIcon: {
    width: 24,
    height: 24 * 0.92,
    resizeMode: "contain",
  },
});
