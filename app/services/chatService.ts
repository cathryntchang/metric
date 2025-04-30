import { config } from '../config';
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getSurveyQuestions } from '../firebase/firebase';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatContext {
  chatId: string;
  userId: string;
  chatDocId: string;
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

  // Helper function to generate unique chat key
  getChatKey(surveyId: string, userId: string): string {
    return `${surveyId}_${userId}`;
  },

  async sendMessage(chatId: string, message: string, userId: string) {
    try {
      console.log('Starting sendMessage with:', { chatId, message, userId });
      
      // Validate API key
      if (!config.openaiApiKey || config.openaiApiKey.length < 10) {
        console.error('Invalid OpenAI API key');
        throw new Error('OpenAI API key is not properly configured. Please check your configuration.');
      }

      const chatKey = this.getChatKey(chatId, userId);

      // Get or create chat context
      if (!this.chatContexts.has(chatKey)) {
        console.log('Creating new chat context for:', chatKey);
        
        // Fetch survey data from Firestore
        const surveyRef = doc(db, 'companies/LEyaRS2Mv7CLzP20K0Pe/surveys', chatId);
        const surveyDoc = await getDoc(surveyRef);
        const surveyData = surveyDoc.data();
        
        // Fetch questions
        const questions = await getSurveyQuestions(chatId);
        console.log('Fetched questions:', questions);
        
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

        // Create a new chat document in Firebase
        const chatRef = await addDoc(collection(db, `users/${userId}/chats`), {
          surveyId: chatId,
          createdAt: Date.now(),
          messages: [{
            role: 'assistant',
            content: initialMessage,
            timestamp: Date.now()
          }]
        });

        this.chatContexts.set(chatKey, {
          chatId,
          userId,
          chatDocId: chatRef.id,
          messages: [
            {
              role: 'assistant',
              content: initialMessage,
              timestamp: Date.now()
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

      const context = this.chatContexts.get(chatKey)!;
      console.log('Current context:', context);

      // Add user message to context and Firebase
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: Date.now()
      };
      context.messages.push(userMessage);
      context.lastMessageTime = Date.now();

      // Update Firebase with the new message using the stored chat document ID
      const chatRef = doc(db, `users/${userId}/chats/${context.chatDocId}`);
      await updateDoc(chatRef, {
        messages: arrayUnion(userMessage)
      });

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
            const assistantMessage = {
              role: 'assistant' as const,
              content: nextQuestion.questionText,
              timestamp: Date.now()
            };
            context.messages.push(assistantMessage);
            
            // Update Firebase with the assistant's message
            await updateDoc(chatRef, {
              messages: arrayUnion(assistantMessage)
            });
            
            return nextQuestion.questionText;
          } else {
            const declineMessage = {
              role: 'assistant' as const,
              content: "I understand. Let me know if you change your mind and would like to participate in the survey.",
              timestamp: Date.now()
            };
            context.messages.push(declineMessage);
            
            // Update Firebase with the assistant's message
            await updateDoc(chatRef, {
              messages: arrayUnion(declineMessage)
            });
            
            return declineMessage.content;
          }

        case 'asking':
          // Store the user's response
          const currentQuestion = context.questions[context.currentQuestionIndex];
          context.userResponses[currentQuestion.id] = message;

          // Get GPT response based on the conversation context
          const gptResponse = await this.getGPTResponse([
            ...context.messages,
            {
              role: 'system',
              content: 'You are discussing the current survey question. Engage naturally with the user\'s response. If the conversation about this topic seems complete, naturally transition to the next question.',
              timestamp: Date.now()
            }
          ]);

          const assistantMessage = {
            role: 'assistant' as const,
            content: gptResponse,
            timestamp: Date.now()
          };
          context.messages.push(assistantMessage);
          
          // Update Firebase with the assistant's message
          await updateDoc(chatRef, {
            messages: arrayUnion(assistantMessage)
          });

          // Check if we should move to the next question
          const shouldMoveToNextQuestion = 
            gptResponse.toLowerCase().includes('next question') || 
            gptResponse.toLowerCase().includes('moving on') ||
            gptResponse.toLowerCase().includes('let\'s move on') ||
            // Add a message count check to prevent getting stuck
            context.messages.filter(m => m.role === 'user').length > 3;

          if (shouldMoveToNextQuestion) {
            // If we've asked all questions, move to complete state
            if (context.currentQuestionIndex >= context.questions.length - 1) {
              context.conversationState = 'complete';
              return gptResponse;
            }

            // Move to next question
            context.currentQuestionIndex++;
            const nextQuestion = context.questions[context.currentQuestionIndex];
            console.log('Moving to next question:', nextQuestion);
            
            const nextQuestionMessage = {
              role: 'assistant' as const,
              content: nextQuestion.questionText,
              timestamp: Date.now()
            };
            context.messages.push(nextQuestionMessage);
            
            // Update Firebase with the next question
            await updateDoc(chatRef, {
              messages: arrayUnion(nextQuestionMessage)
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
                : 'Respond naturally to the user\'s feedback. If the conversation seems to be concluding naturally (e.g., user has provided a comprehensive response or seems satisfied), ask if they have any additional feedback or questions about the survey topic. Otherwise, continue the conversation naturally.',
              timestamp: Date.now()
            }
          ]);

          const finalMessage = {
            role: 'assistant' as const,
            content: finalResponse,
            timestamp: Date.now()
          };
          context.messages.push(finalMessage);
          
          // Update Firebase with the final message
          await updateDoc(chatRef, {
            messages: arrayUnion(finalMessage)
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

  async getGPTResponse(messages: Message[], retryCount = 0): Promise<string> {
    try {
      // Ensure we have a valid API key
      if (!config.openaiApiKey) {
        console.error('OpenAI API key is missing');
        throw new Error('OpenAI API key is not configured');
      }

      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly and engaging survey assistant. Your goal is to have a natural conversation while gathering feedback. Ask follow-up questions when appropriate, show genuine interest in the responses, and maintain a conversational tone. Keep responses concise but engaging. If the conversation about the current topic seems complete, naturally transition to the next question.'
          },
          ...messages.filter(msg => msg.role === 'user' || msg.role === 'assistant')
        ],
        temperature: 0.7,
        max_tokens: 150
      };

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openaiApiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse error response' } }));
          console.error('OpenAI API error response:', errorData);
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (networkError) {
        console.error('Network error in getGPTResponse:', networkError);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          console.log(`Retrying GPT request (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return this.getGPTResponse(messages, retryCount + 1);
        }

        // If all retries failed, move to next question
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          return "Thank you for sharing that. Let's move on to the next question.";
        }
        return "I understand. Please continue with your thoughts.";
      }
    } catch (error) {
      console.error('Error in getGPTResponse:', error);
      return "I understand. Please continue with your thoughts.";
    }
  },

  clearContext(chatId: string, userId: string) {
    const chatKey = this.getChatKey(chatId, userId);
    this.chatContexts.delete(chatKey);
  },

  getContext(chatId: string, userId: string) {
    const chatKey = this.getChatKey(chatId, userId);
    return this.chatContexts.get(chatKey)?.messages || [];
  }
}; 