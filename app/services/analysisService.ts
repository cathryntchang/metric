import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { config } from '../config';

interface Question {
  id: string;
  questionText: string;
  order: number;
}

interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  keywords: string[];
}

interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  sentiment: SentimentAnalysis;
  summary: string;
  responses: string[]; // Add responses to track actual user messages
}

interface SurveyAnalysis {
  questions: QuestionAnalysis[];
  overallSummary: string;
  totalRespondents: number;
}

export const analysisService = {
  async analyzeSurveyResponses(surveyId: string): Promise<SurveyAnalysis> {
    try {
      // First, get the survey details to get question texts
      const surveyRef = doc(db, 'companies/LEyaRS2Mv7CLzP20K0Pe/surveys', surveyId);
      const surveyDoc = await getDoc(surveyRef);
      const surveyData = surveyDoc.data();
      
      if (!surveyData) {
        throw new Error('Survey not found');
      }

      // Get all user chats for this survey
      const allMessages: { [questionId: string]: string[] } = {};
      const respondentSet = new Set<string>();
      let totalRespondents = 0;

      // Query all users collection
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      // For each user, check their chats
      for (const userDoc of usersSnapshot.docs) {
        const chatsRef = collection(db, `users/${userDoc.id}/chats`);
        const chatsQuery = query(chatsRef, where('surveyId', '==', surveyId));
        const chatsSnapshot = await getDocs(chatsQuery);

        let hasResponded = false;
        
        // Process each chat
        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          if (chatData.messages && Array.isArray(chatData.messages)) {
            let currentQuestionId: string | null = null;
            let hasValidResponse = false;

            // Process messages in order
            for (const message of chatData.messages) {
              if (message.role === 'assistant' && message.questionId) {
                currentQuestionId = message.questionId;
              } else if (message.role === 'user' && currentQuestionId && message.content?.trim()) {
                if (!allMessages[currentQuestionId]) {
                  allMessages[currentQuestionId] = [];
                }
                allMessages[currentQuestionId].push(message.content.trim());
                hasValidResponse = true;
                hasResponded = true;
              }
            }
          }
        }

        if (hasResponded) {
          respondentSet.add(userDoc.id);
        }
      }

      totalRespondents = respondentSet.size;

      // Update the survey document with the respondent count
      await updateDoc(surveyRef, {
        respondentCount: totalRespondents
      });

      // Get questions data
      const questionsRef = collection(db, `companies/LEyaRS2Mv7CLzP20K0Pe/surveys/${surveyId}/questions`);
      const questionsSnapshot = await getDocs(questionsRef);
      const questions = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];

      // Analyze each question's responses
      const questionAnalyses: QuestionAnalysis[] = [];
      
      for (const question of questions) {
        const responses = allMessages[question.id] || [];
        if (responses.length > 0) {
          const analysis = await this.analyzeQuestionResponses(
            question.id,
            question.questionText,
            responses
          );
          questionAnalyses.push(analysis);
        }
      }

      // Sort questions by their order if available
      questionAnalyses.sort((a, b) => {
        const questionA = questions.find(q => q.id === a.questionId);
        const questionB = questions.find(q => q.id === b.questionId);
        return (questionA?.order || 0) - (questionB?.order || 0);
      });

      // Generate overall summary
      const overallSummary = await this.generateOverallSummary(questionAnalyses, totalRespondents);

      return {
        questions: questionAnalyses,
        overallSummary,
        totalRespondents
      };
    } catch (error) {
      console.error('Error analyzing survey responses:', error);
      throw error;
    }
  },

  async analyzeQuestionResponses(
    questionId: string,
    questionText: string,
    responses: string[]
  ): Promise<QuestionAnalysis> {
    try {
      // Ensure responses is an array and has content
      if (!Array.isArray(responses) || responses.length === 0) {
        return {
          questionId,
          questionText,
          sentiment: {
            positive: 0,
            negative: 0,
            neutral: 100,
            keywords: []
          },
          summary: "No responses received yet.",
          responses: []
        };
      }

      const prompt = `Analyze these ${responses.length} responses to the question "${questionText}" and provide:
1. Sentiment breakdown (positive, negative, neutral percentages) - calculate based on actual responses:
   - For ${responses.length} responses, each response should be counted as a whole (not split)
   - If a response is positive, count it as 100% positive
   - If a response is negative, count it as 100% negative
   - If a response is neutral, count it as 100% neutral
   - Then calculate the percentage of total responses for each sentiment
2. A brief summary that includes specific examples from the responses

Responses:
${responses.join('\n')}

Format the response as JSON with these fields:
{
  "sentiment": {
    "positive": number,  // Must be a multiple of (100/${responses.length})
    "negative": number,  // Must be a multiple of (100/${responses.length})
    "neutral": number    // Must be a multiple of (100/${responses.length})
  },
  "summary": string
}`;

      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          if (!config.openaiApiKey) {
            throw new Error('OpenAI API key is not configured. Please check your environment variables.');
          }

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
            }),
          });

          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your configuration.');
          }

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const data = await response.json();
          let analysis;
          try {
            analysis = JSON.parse(data.choices[0].message.content);
          } catch (parseError) {
            console.error('Error parsing OpenAI response:', parseError);
            analysis = {
              sentiment: {
                positive: 0,
                negative: 0,
                neutral: 100
              },
              summary: "Error analyzing responses."
            };
          }

          // Ensure percentages are multiples of (100/responses.length) and limit to 2 decimal places
          const responseUnit = 100 / responses.length;
          const positive = Number((Math.round(analysis.sentiment.positive / responseUnit) * responseUnit).toFixed(2));
          const negative = Number((Math.round(analysis.sentiment.negative / responseUnit) * responseUnit).toFixed(2));
          const neutral = Number((100 - positive - negative).toFixed(2));

          analysis.sentiment = {
            positive,
            negative,
            neutral
          };

          return {
            questionId,
            questionText,
            sentiment: analysis.sentiment,
            summary: analysis.summary,
            responses: responses
          };
        } catch (error) {
          lastError = error;
          retries--;
          if (retries > 0) {
            // Wait for 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // If we've exhausted all retries, throw the last error
      throw lastError;
    } catch (error) {
      console.error('Error analyzing question responses:', error);
      // Return a default analysis instead of throwing
      return {
        questionId,
        questionText,
        sentiment: {
          positive: 0,
          negative: 0,
          neutral: 100,
          keywords: []
        },
        summary: "Error analyzing responses. Please try again later.",
        responses: responses || []
      };
    }
  },

  async generateOverallSummary(questionAnalyses: QuestionAnalysis[], totalRespondents: number): Promise<string> {
    try {
      if (!Array.isArray(questionAnalyses) || questionAnalyses.length === 0) {
        return "No survey responses have been collected yet.";
      }

      const prompt = `Based on responses from ${totalRespondents} participants, provide a comprehensive summary of the survey results:

${questionAnalyses.map(q => `Question: ${q.questionText}
Number of responses: ${q.responses?.length || 0}
Summary: ${q.summary}
Sentiment: Positive ${q.sentiment?.positive || 0}%, Negative ${q.sentiment?.negative || 0}%, Neutral ${q.sentiment?.neutral || 100}%`).join('\n\n')}

Please provide:
1. A concise executive summary of the overall findings
2. Key trends across all questions
3. Notable insights or patterns in user sentiment
4. Any significant differences in response patterns between questions`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || "Error generating summary.";
    } catch (error) {
      console.error('Error generating overall summary:', error);
      return "Error generating overall summary.";
    }
  }
}; 