const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, query, where, getDocs, deleteDoc, updateDoc } = require('firebase/firestore');
const firebaseConfig = require('../../keys.json');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to create the company account
const setupCompany = async () => {
  try {
    // First, check for existing Daymi companies
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, where("name", "==", "Daymi"));
    const querySnapshot = await getDocs(q);
    
    // Delete any existing Daymi companies
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      console.log('Deleting existing Daymi company with ID:', doc.id);
      deletePromises.push(deleteDoc(doc.ref));
    });
    await Promise.all(deletePromises);
    
    // Create a new document in the companies collection
    const companyDoc = doc(companiesRef);
    const companyId = companyDoc.id;
    
    // Set the company data with email and password
    await setDoc(companyDoc, {
      name: 'Daymi',
      email: 'admin@daymi.com',
      password: 'daymi123', // In a real app, this should be hashed
      id: companyId,
      surveys: [] // Initialize empty surveys array
    });

    // Create a test survey
    const testSurveyDoc = doc(collection(db, `companies/${companyId}/surveys`));
    const surveyId = testSurveyDoc.id;

    // Create main survey document
    await setDoc(testSurveyDoc, {
      id: surveyId,
      title: 'Test Survey: Product Feature Feedback',
      createdAt: new Date().toISOString()
    });

    // Add questions as separate documents
    const questions = [
      {
        questionText: "How likely are you to use the new chat summarization feature on a daily basis?",
        order: 1
      },
      {
        questionText: "What aspects of the AI-powered meeting notes would be most valuable to your workflow?",
        order: 2
      },
      {
        questionText: "Would you prefer automatic summarization after each meeting or manual trigger? Please explain why.",
        order: 3
      }
    ];

    for (const question of questions) {
      const questionDoc = doc(collection(db, `companies/${companyId}/surveys/${surveyId}/questions`));
      await setDoc(questionDoc, {
        id: questionDoc.id,
        ...question
      });
    }

    // Create invites document
    await setDoc(
      doc(db, `companies/${companyId}/surveys/${surveyId}/metadata`, 'invites'),
      {
        people: ['Cathryn', 'Danica', 'Christy']
      }
    );

    // Create answers document (initially empty)
    await setDoc(
      doc(db, `companies/${companyId}/surveys/${surveyId}/metadata`, 'answers'),
      {
        responses: {}
      }
    );

    // Add survey ID to company's surveys array
    await updateDoc(companyDoc, {
      surveys: [surveyId]
    });

    console.log('Created surveys collection with test survey');
    console.log('Company created successfully with ID:', companyId);
    return companyId;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

module.exports = { setupCompany }; 