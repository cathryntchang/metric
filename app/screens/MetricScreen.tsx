import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface ResponseData {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface QuestionMetrics {
  questionText: string;
  responses: ResponseData[];
  metrics: {
    positive: number;
    negative: number;
    neutral: number;
    keywords: {
      [key: string]: {
        count: number;
        sentiment: 'positive' | 'negative' | 'neutral';
        examples: string[];
      }
    }
  };
  totalResponses: number;
}

interface Question {
  id: string;
  questionText: string;
  order: number;
}

interface KeywordType {
  text: string;
  color: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const SENTIMENT_CATEGORIES = {
  positive: {
    keywords: ['yes', 'like', 'good', 'love', 'great', 'awesome', 'perfect', 'excellent', 'amazing', 'wonderful'],
    color: '#7AD6B9'  // Green
  },
  negative: {
    keywords: ['no', 'don\'t like', 'bad', 'hate', 'terrible', 'awful', 'dislike', 'poor', 'worst', 'unhappy'],
    color: '#E6A7A7'  // Red
  },
  neutral: {
    keywords: ['maybe', 'okay', 'somewhat', 'sometimes', 'depends', 'unsure', 'not sure'],
    color: '#B6A7E6'  // Purple
  }
};

const MetricScreen = () => {
  const { surveyId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<QuestionMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [surveyId]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get survey responses
      const answersRef = doc(db, `companies/LEyaRS2Mv7CLzP20K0Pe/surveys/${surveyId}/metadata/answers`);
      const answersDoc = await getDoc(answersRef);
      const responses = answersDoc.data()?.responses || {};

      // Get questions
      const questionsRef = collection(db, `companies/LEyaRS2Mv7CLzP20K0Pe/surveys/${surveyId}/questions`);
      const questionsSnapshot = await getDocs(questionsRef);
      const questions = questionsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Question))
        .sort((a, b) => a.order - b.order);

      // Process metrics for each question
      const questionMetrics: QuestionMetrics[] = questions.map((question: Question) => {
        // Get all responses for this question with their full text
        const questionResponses: ResponseData[] = Object.entries(responses)
          .map(([username, userResponses]: [string, any]) => {
            const response = userResponses[question.id];
            if (!response) return null;

            // Determine sentiment for this response
            const lowerResponse = response.toLowerCase();
            let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';

            if (SENTIMENT_CATEGORIES.positive.keywords.some(keyword => lowerResponse.includes(keyword))) {
              sentiment = 'positive';
            } else if (SENTIMENT_CATEGORIES.negative.keywords.some(keyword => lowerResponse.includes(keyword))) {
              sentiment = 'negative';
            }

            return {
              text: response,
              sentiment
            };
          })
          .filter((r): r is ResponseData => r !== null);

        // Initialize metrics
        const metrics = {
          positive: 0,
          negative: 0,
          neutral: 0,
          keywords: {} as { [key: string]: { count: number; sentiment: 'positive' | 'negative' | 'neutral'; examples: string[] } }
        };

        // Process each response
        questionResponses.forEach(response => {
          // Count sentiments
          metrics[response.sentiment]++;

          // Extract and categorize keywords
          const words = response.text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);

          words.forEach(word => {
            if (!metrics.keywords[word]) {
              metrics.keywords[word] = {
                count: 0,
                sentiment: response.sentiment,
                examples: []
              };
            }
            metrics.keywords[word].count++;
            if (!metrics.keywords[word].examples.includes(response.text) && 
                metrics.keywords[word].examples.length < 3) {
              metrics.keywords[word].examples.push(response.text);
            }
          });
        });

        return {
          questionText: question.questionText,
          responses: questionResponses,
          metrics,
          totalResponses: questionResponses.length
        };
      });

      setMetrics(questionMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to load metrics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const assignKeywordColors = (keywords: { [key: string]: { count: number; sentiment: string } }): KeywordType[] => {
    return Object.entries(keywords)
      .map(([text, { count, sentiment }]) => ({
        text,
        count,
        sentiment: sentiment as 'positive' | 'negative' | 'neutral',
        color: SENTIMENT_CATEGORIES[sentiment as keyof typeof SENTIMENT_CATEGORIES].color
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7B61FF" />
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Survey Results</Text>
        <TouchableOpacity>
          <Text style={styles.settingsButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {metrics.map((questionMetric, index) => {
          const { positive, negative, neutral } = questionMetric.metrics;
          const total = questionMetric.totalResponses;
          
          const positivePercentage = Math.round((positive / total) * 100) || 0;
          const negativePercentage = Math.round((negative / total) * 100) || 0;
          const neutralPercentage = Math.round((neutral / total) * 100) || 0;

          // Get top keywords for each sentiment
          const getTopKeywords = (sentiment: 'positive' | 'negative' | 'neutral') => {
            return Object.entries(questionMetric.metrics.keywords)
              .filter(([_, data]) => data.sentiment === sentiment)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 3)
              .map(([word, data]) => ({
                text: word,
                count: data.count,
                color: SENTIMENT_CATEGORIES[sentiment].color,
                examples: data.examples
              }));
          };

          const positiveKeywords = getTopKeywords('positive');
          const negativeKeywords = getTopKeywords('negative');
          const neutralKeywords = getTopKeywords('neutral');

          return (
            <View key={index} style={styles.questionCard}>
              <Text style={styles.questionText}>Q{index + 1}. {questionMetric.questionText}</Text>
              <Text style={styles.subheader}>Total Responses: {total}</Text>

              {/* Sentiment Distribution */}
              <View style={styles.sentimentSection}>
                <Text style={styles.sectionTitle}>Sentiment Distribution</Text>
                <View style={styles.metricsContainer}>
                  {positive > 0 && (
                    <View style={styles.metricSection}>
                      <View style={styles.metricRow}>
                        <View style={[styles.dot, { backgroundColor: SENTIMENT_CATEGORIES.positive.color }]} />
                        <Text style={styles.metricLabel}>Positive</Text>
                        <Text style={styles.metricValue}>{positivePercentage}%</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar,
                            { 
                              width: `${positivePercentage}%`,
                              backgroundColor: SENTIMENT_CATEGORIES.positive.color
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}

                  {negative > 0 && (
                    <View style={styles.metricSection}>
                      <View style={styles.metricRow}>
                        <View style={[styles.dot, { backgroundColor: SENTIMENT_CATEGORIES.negative.color }]} />
                        <Text style={styles.metricLabel}>Negative</Text>
                        <Text style={styles.metricValue}>{negativePercentage}%</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar,
                            { 
                              width: `${negativePercentage}%`,
                              backgroundColor: SENTIMENT_CATEGORIES.negative.color
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}

                  {neutral > 0 && (
                    <View style={styles.metricSection}>
                      <View style={styles.metricRow}>
                        <View style={[styles.dot, { backgroundColor: SENTIMENT_CATEGORIES.neutral.color }]} />
                        <Text style={styles.metricLabel}>Neutral</Text>
                        <Text style={styles.metricValue}>{neutralPercentage}%</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar,
                            { 
                              width: `${neutralPercentage}%`,
                              backgroundColor: SENTIMENT_CATEGORIES.neutral.color
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Keywords Section */}
              <View style={styles.keywordsSection}>
                <Text style={styles.sectionTitle}>Common Keywords</Text>
                
                {positiveKeywords.length > 0 && (
                  <View style={styles.keywordCategory}>
                    <Text style={styles.keywordCategoryTitle}>Positive Keywords</Text>
                    <View style={styles.keywordContainer}>
                      {positiveKeywords.map((keyword, idx) => (
                        <View key={idx} style={styles.keywordWrapper}>
                          <View style={[styles.keywordDot, { backgroundColor: keyword.color }]} />
                          <Text style={styles.keywordText}>{keyword.text} ({keyword.count})</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {negativeKeywords.length > 0 && (
                  <View style={styles.keywordCategory}>
                    <Text style={styles.keywordCategoryTitle}>Negative Keywords</Text>
                    <View style={styles.keywordContainer}>
                      {negativeKeywords.map((keyword, idx) => (
                        <View key={idx} style={styles.keywordWrapper}>
                          <View style={[styles.keywordDot, { backgroundColor: keyword.color }]} />
                          <Text style={styles.keywordText}>{keyword.text} ({keyword.count})</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {neutralKeywords.length > 0 && (
                  <View style={styles.keywordCategory}>
                    <Text style={styles.keywordCategoryTitle}>Neutral Keywords</Text>
                    <View style={styles.keywordContainer}>
                      {neutralKeywords.map((keyword, idx) => (
                        <View key={idx} style={styles.keywordWrapper}>
                          <View style={[styles.keywordDot, { backgroundColor: keyword.color }]} />
                          <Text style={styles.keywordText}>{keyword.text} ({keyword.count})</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    fontSize: 24,
    color: '#333333',
  },
  settingsButton: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  sentimentSection: {
    marginBottom: 24,
  },
  metricsContainer: {
    gap: 12,
  },
  metricSection: {
    gap: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  keywordsSection: {
    gap: 16,
  },
  keywordCategory: {
    gap: 8,
  },
  keywordCategoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  keywordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  keywordText: {
    fontSize: 12,
    color: '#333333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#E6A7A7',
    textAlign: 'center',
    padding: 16,
  },
});

export default MetricScreen; 