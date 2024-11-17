import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUkFPheiBPNb7LxSvMpx7qpjd6W3_nZZs",
  authDomain: "anime-notifier-c015b.firebaseapp.com",
  projectId: "anime-notifier-c015b",
  storageBucket: "anime-notifier-c015b.firebasestorage.app",
  messagingSenderId: "169240596890",
  appId: "1:169240596890:web:7c05563a02c39606a82a23",
  measurementId: "G-VYE7S08916",
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
