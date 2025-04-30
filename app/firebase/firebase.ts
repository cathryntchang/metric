import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import firebaseConfig from '../../keys.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
const companiesRef = collection(db, 'companies');
const usersRef = collection(db, 'users');

// Company functions
export const createCompany = async (companyData: {
  companyName: string;
  id?: string;
}) => {
  const companyRef = doc(companiesRef);
  await setDoc(companyRef, {
    ...companyData,
    id: companyRef.id,
    surveys: []
  });
  return companyRef.id;
};

// Survey functions
export const createSurvey = async (companyId: string, surveyData: {
  title: string;
  questions: string[];
  peopleInvited: string[];
}) => {
  try {
    // Get reference to the company's surveys collection
    const companyRef = doc(companiesRef, companyId);
    const surveysRef = collection(companyRef, 'surveys');
    const surveyRef = doc(surveysRef);
    const surveyId = surveyRef.id;

    // Create the main survey document
    await setDoc(surveyRef, {
      id: surveyId,
      title: surveyData.title,
      createdAt: new Date().toISOString()
    });

    // Create questions collection and add each question as a document
    const questionsRef = collection(surveyRef, 'questions');
    const questionPromises = surveyData.questions.map((question, index) => {
      const questionDoc = doc(questionsRef);
      return setDoc(questionDoc, {
        id: questionDoc.id,
        questionText: question,
        order: index + 1
      });
    });
    await Promise.all(questionPromises);

    // Create invites document to store invited people
    const invitesRef = doc(surveyRef, 'invites');
    await setDoc(invitesRef, {
      people: surveyData.peopleInvited
    });

    // Create answers collection (initially empty)
    const answersRef = doc(surveyRef, 'answers');
    await setDoc(answersRef, {
      responses: {}  // Will store responses by username
    });

    // Add survey ID to company's surveys array
    await updateDoc(companyRef, {
      surveys: arrayUnion(surveyId)
    });

    return surveyId;
  } catch (error) {
    console.error('Error creating survey:', error);
    throw error;
  }
};

// Function to add a response to a survey
export const addSurveyResponse = async (
  companyId: string,
  surveyId: string,
  responseData: {
    username: string;
    responses: { [questionId: string]: string }
  }
) => {
  try {
    const surveyRef = doc(companiesRef, companyId, 'surveys', surveyId);
    const answersRef = doc(surveyRef, 'answers');

    // Get current answers document
    const answersDoc = await getDoc(answersRef);
    const currentResponses = answersDoc.exists() ? answersDoc.data().responses : {};

    // Add or update the user's responses
    await updateDoc(answersRef, {
      responses: {
        ...currentResponses,
        [responseData.username]: responseData.responses
      }
    });
  } catch (error) {
    console.error('Error adding survey response:', error);
    throw error;
  }
};

// User functions
export const createUser = async (userData: {
  username: string;
  surveyAccess: string[];
}) => {
  const userRef = doc(usersRef);
  await setDoc(userRef, {
    ...userData,
    id: userRef.id
  });
  return userRef.id;
};

// Add this function to check if company exists
export const getCompanyById = async (companyId: string) => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }
    return companyDoc.data();
  } catch (error) {
    console.error('Error getting company:', error);
    throw error;
  }
};

// Add function to get user by username
export const getUserByUsername = async (username: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
};

export const createNewSurvey = async (
  companyId: string,
  title: string,
  invitedUsers: string[], // These are usernames
  questions: { questionText: string, order: number }[]
) => {
  try {
    // First check if company exists
    const company = await getCompanyById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Get user IDs for all invited users
    const userPromises = invitedUsers.map(username => getUserByUsername(username));
    const users = await Promise.all(userPromises);
    
    // Filter out any usernames that weren't found
    const validUsers = users.filter((user): user is NonNullable<typeof user> => user !== null);
    
    if (validUsers.length === 0) {
      throw new Error('No valid users found');
    }

    if (validUsers.length !== invitedUsers.length) {
      const foundUsernames = validUsers.map(user => user.username);
      const missingUsernames = invitedUsers.filter(username => !foundUsernames.includes(username));
      console.warn('Some users not found:', missingUsernames);
    }

    // Create a new survey document
    const surveyDoc = doc(collection(db, `companies/${companyId}/surveys`));
    const surveyId = surveyDoc.id;

    // Set the main survey data
    await setDoc(surveyDoc, {
      id: surveyId,
      title,
      invitedUsers: validUsers.map(user => ({
        id: user.id,
        username: user.username
      })),
      createdAt: new Date().toISOString(),
      companyId,
      status: 'pending'
    });

    // Add questions as separate documents
    for (const question of questions) {
      const questionDoc = doc(collection(db, `companies/${companyId}/surveys/${surveyId}/questions`));
      await setDoc(questionDoc, {
        id: questionDoc.id,
        ...question
      });
    }

    // Create metadata documents
    await setDoc(
      doc(db, `companies/${companyId}/surveys/${surveyId}/metadata`, 'invites'),
      {
        people: validUsers.map(user => user.id)
      }
    );

    await setDoc(
      doc(db, `companies/${companyId}/surveys/${surveyId}/metadata`, 'answers'),
      {
        responses: {}
      }
    );

    // Update company's surveys array
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      surveys: arrayUnion(surveyId)
    });

    // Add survey to each valid user's document and collection
    const addToUserPromises = validUsers.map(async (user) => {
      // Add survey to user's surveys subcollection
      const userSurveyRef = doc(db, `users/${user.id}/surveys/${surveyId}`);
      await setDoc(userSurveyRef, {
        id: surveyId,
        companyId,
        title,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });

      // Add survey ID to user's surveys array in their document
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        surveys: arrayUnion(surveyId)
      });
    });

    await Promise.all(addToUserPromises);

    return surveyId;
  } catch (error) {
    console.error('Error creating survey:', error);
    throw error;
  }
};

export const searchUsers = async (searchTerm: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Update getUserSurveys to work with username
export const getUserSurveys = async (username: string) => {
  try {
    // First get the user document
    const user = await getUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all surveys from user's surveys subcollection
    const userSurveysRef = collection(db, `users/${user.id}/surveys`);
    const querySnapshot = await getDocs(userSurveysRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user surveys:', error);
    throw error;
  }
};

// Export db instance for direct use if needed
export { db }; 