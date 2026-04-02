import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGSjhotwBBzyxszqn27WlGkLbsGxiEePM",
  authDomain: "fortified-portal.firebaseapp.com",
  projectId: "fortified-portal",
  storageBucket: "fortified-portal.firebasestorage.app",
  messagingSenderId: "23183607188",
  appId: "1:23183607188:web:a57ff3d5434d15b82ebb81"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);