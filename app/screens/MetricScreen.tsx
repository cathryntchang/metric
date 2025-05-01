import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { analysisService } from "../services/analysisService";
import { getSurveyById } from "../firebase/firebase";

export default function SurveySummaryScreen() {
  const { surveyId } = useLocalSearchParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const surveyAnalysis = await analysisService.analyzeSurveyResponses(surveyId as string);
        setAnalysis(surveyAnalysis);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to load survey analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [surveyId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C4DFF" />
          <Text style={styles.loadingText}>Analyzing survey responses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Survey Analysis</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsHeaderTitle}>Survey Results</Text>
          <Text style={styles.statsHeaderSubtitle}>
            Based on {analysis?.totalRespondents || 0} {(analysis?.totalRespondents || 0) === 1 ? 'response' : 'responses'}
          </Text>
        </View>

        {(analysis?.questions || []).map((question: any, index: number) => (
          <View key={question.questionId || index} style={styles.questionCard}>
            <Text style={styles.questionTitle}>Q{index + 1}. {question.questionText || 'Unknown Question'}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View 
                  style={[
                    styles.statBar, 
                    { 
                      width: `${question.sentiment?.positive || 0}%`, 
                      backgroundColor: '#4CAF50' 
                    }
                  ]} 
                />
                <Text style={styles.statText}>{question.sentiment?.positive || 0}% positive</Text>
              </View>
              <View style={styles.statRow}>
                <View 
                  style={[
                    styles.statBar, 
                    { 
                      width: `${question.sentiment?.negative || 0}%`, 
                      backgroundColor: '#F44336' 
                    }
                  ]} 
                />
                <Text style={styles.statText}>{question.sentiment?.negative || 0}% negative</Text>
              </View>
              <View style={styles.statRow}>
                <View 
                  style={[
                    styles.statBar, 
                    { 
                      width: `${question.sentiment?.neutral || 0}%`, 
                      backgroundColor: '#9E9E9E' 
                    }
                  ]} 
                />
                <Text style={styles.statText}>{question.sentiment?.neutral || 0}% neutral</Text>
              </View>
            </View>

            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>{question.summary || 'No summary available yet'}</Text>
          </View>
        ))}

        <View style={styles.overallSummarySection}>
          <Text style={styles.overallSummaryTitle}>Overall Summary</Text>
          <Text style={styles.overallSummaryText}>
            {analysis?.overallSummary || 'No overall summary available yet'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getKeywordColor = (index: number) => {
  const colors = ["#FFB800", "#9747FF", "#FF4747", "#666666", "#1E7F2C"];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B6B6B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4747',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6C4DFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: "#F4F0FF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    color: "#181818",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 16,
    fontWeight: "400",
  },
  statsContainer: {
    marginBottom: 24,
  },
  statRow: {
    marginBottom: 12,
  },
  statBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: "#6B6B6B",
    marginLeft: 0,
    fontWeight: "400",
  },
  keywordsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#181818",
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  keywordPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  keywordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  keywordText: {
    fontSize: 14,
    color: "#181818",
    fontWeight: "500",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#181818",
  },
  summaryText: {
    fontSize: 14,
    color: "#6B6B6B",
    lineHeight: 20,
  },
  overallSummarySection: {
    backgroundColor: '#FFFDEB',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  overallSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#181818",
  },
  overallSummaryText: {
    fontSize: 14,
    color: "#6B6B6B",
    lineHeight: 20,
  },
  statsHeader: {
    backgroundColor: '#F4F0FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#181818',
    marginBottom: 4,
  },
  statsHeaderSubtitle: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  noDataText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontStyle: 'italic',
  },
}); 