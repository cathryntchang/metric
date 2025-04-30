const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, query, where, getDocs, deleteDoc } = require('firebase/firestore');
const firebaseConfig = require('../../keys.json');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to create the users
const setupUsers = async () => {
  try {
    // First, check for and delete any existing users
    const usersRef = collection(db, 'users');
    const usernames = ['Danica', 'Christy', 'Cathryn'];
    
    // Delete existing users
    const q = query(usersRef, where('username', 'in', usernames));
    const querySnapshot = await getDocs(q);
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      console.log('Deleting existing user with ID:', doc.id);
      deletePromises.push(deleteDoc(doc.ref));
    });
    await Promise.all(deletePromises);
    
    // Create new users
    const createPromises = usernames.map(username => {
      const userDoc = doc(usersRef);
      return setDoc(userDoc, {
        username: username,
        surveys: [], // Empty array for surveys that will be added later
        id: userDoc.id
      });
    });
    
    await Promise.all(createPromises);
    console.log('Users created successfully');
    
  } catch (error) {
    console.error('Error creating users:', error);
    throw error;
  }
};

module.exports = { setupUsers }; 