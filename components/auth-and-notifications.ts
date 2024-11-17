import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  // Your Firebase configuration here
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other config options
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const subscribeToAnime = async (
  userId: string,
  animeId: number,
  animeTitle: string,
  broadcastTime: string
) => {
  try {
    await setDoc(doc(db, "subscriptions", `${userId}_${animeId}`), {
      userId,
      animeId,
      animeTitle,
      broadcastTime,
    });
  } catch (error) {
    console.error("Error subscribing to anime", error);
    throw error;
  }
};

export const unsubscribeFromAnime = async (userId: string, animeId: number) => {
  try {
    await deleteDoc(doc(db, "subscriptions", `${userId}_${animeId}`));
  } catch (error) {
    console.error("Error unsubscribing from anime", error);
    throw error;
  }
};
