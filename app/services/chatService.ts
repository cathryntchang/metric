import { config } from '../config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getSurveyQuestions } from '../firebase/firebase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  chatId: string;
  messages: Message[];
  currentQuestionIndex: number;
  questions: { id: string; questionText: string; order: number }[];
  userResponses: { [key: string]: string };
  conversationState: 'initial' | 'asking' | 'complete';
  hasAskedForAdditionalFeedback: boolean;
  lastMessageTime: number;
}

export const chatService = {
  chatContexts: new Map<string, ChatContext>(),

  async sendMessage(chatId: string, message: string) {
    try {
      console.log('Starting sendMessage with:', { chatId, message });
      
      // Validate API key
      if (!config.openaiApiKey || config.openaiApiKey.length < 10) {
        console.error('Invalid OpenAI API key');
        throw new Error('OpenAI API key is not properly configured. Please check your configuration.');
      }

      // Get or create chat context
      if (!this.chatContexts.has(chatId)) {
        console.log('Creating new chat context for:', chatId);
        
        // Fetch survey data from Firestore
        const surveyRef = doc(db, 'companies/LEyaRS2Mv7CLzP20K0Pe/surveys', chatId);
        const surveyDoc = await getDoc(surveyRef);
        const surveyData = surveyDoc.data();
        
        // Fetch questions
        const questions = await getSurveyQuestions(chatId);
        
        let initialMessage = 'Hi! I\'d like to get your feedback on ';
        
        if (surveyData) {
          if (surveyData.title) {
            initialMessage += surveyData.title;
          }
          if (surveyData.context) {
            initialMessage += `. We're looking to ${surveyData.context.toLowerCase()}.`;
          }
        }
        
        initialMessage += ' Would you like to share your thoughts?';

        this.chatContexts.set(chatId, {
          chatId,
          messages: [
            {
              role: 'assistant',
              content: initialMessage
            }
          ],
          currentQuestionIndex: -1,
          questions,
          userResponses: {},
          conversationState: 'initial',
          hasAskedForAdditionalFeedback: false,
          lastMessageTime: Date.now()
        });
      }

      const context = this.chatContexts.get(chatId)!;
      console.log('Current context:', context);

      // Add user message to context
      context.messages.push({
        role: 'user',
        content: message
      });
      context.lastMessageTime = Date.now();

      // Handle different conversation states
      switch (context.conversationState) {
        case 'initial':
          if (message.toLowerCase().includes('yes') || 
              message.toLowerCase().includes('sure') || 
              message.toLowerCase().includes('ok') || 
              message.toLowerCase().includes('alright')) {
            context.conversationState = 'asking';
            context.currentQuestionIndex = 0;
            const nextQuestion = context.questions[0];
            context.messages.push({
              role: 'assistant',
              content: nextQuestion.questionText
            });
            return nextQuestion.questionText;
          } else {
            return "I understand. Let me know if you change your mind and would like to participate in the survey.";
          }

        case 'asking':
          // Store the user's response
          const currentQuestion = context.questions[context.currentQuestionIndex];
          context.userResponses[currentQuestion.id] = message;

          // Get GPT response based on the conversation context
          const gptResponse = await this.getGPTResponse(context.messages);
          context.messages.push({
            role: 'assistant',
            content: gptResponse
          });

          // If we've asked all questions, move to complete state
          if (context.currentQuestionIndex === context.questions.length - 1) {
            context.conversationState = 'complete';
          } else {
            context.currentQuestionIndex++;
            const nextQuestion = context.questions[context.currentQuestionIndex];
            context.messages.push({
              role: 'assistant',
              content: nextQuestion.questionText
            });
            return nextQuestion.questionText;
          }

          return gptResponse;

        case 'complete':
          // Continue conversation with GPT responses
          const finalResponse = await this.getGPTResponse([
            ...context.messages,
            {
              role: 'system',
              content: context.hasAskedForAdditionalFeedback 
                ? 'Respond naturally to the user\'s feedback. If they haven\'t provided any additional feedback yet, ask again if they have any other thoughts or questions about the survey topic.'
                : 'Respond naturally to the user\'s feedback. If the conversation seems to be concluding naturally (e.g., user has provided a comprehensive response or seems satisfied), ask if they have any additional feedback or questions about the survey topic. Otherwise, continue the conversation naturally.'
            }
          ]);
          context.messages.push({
            role: 'assistant',
            content: finalResponse
          });
          if (!context.hasAskedForAdditionalFeedback) {
            context.hasAskedForAdditionalFeedback = true;
          }
          return finalResponse;
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  async getGPTResponse(messages: Message[]): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a friendly and engaging survey assistant. Your goal is to have a natural conversation while gathering feedback. Ask follow-up questions when appropriate, show genuine interest in the responses, and maintain a conversational tone. Keep responses concise but engaging. When the conversation naturally concludes, ask if the user has any additional feedback or questions about the survey topic.'
            },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting GPT response:', error);
      return "I understand. Please continue with your thoughts.";
    }
  },

  clearContext(chatId: string) {
    this.chatContexts.delete(chatId);
  },

  getContext(chatId: string) {
    return this.chatContexts.get(chatId)?.messages || [];
  }
}; 