// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcK0629HfKpnX3JAv9q-srQKoP1jk_64E",
  authDomain: "aleemmonsur.firebaseapp.com",
  projectId: "aleemmonsur",
  storageBucket: "aleemmonsur.appspot.com",
  messagingSenderId: "374740229205",
  appId: "1:374740229205:web:53c543fa39a522c7a3c8dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const storage = getStorage(app);