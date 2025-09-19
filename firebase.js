import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbZ5Ca6sMcCdYTE5A1hCq6Vr3NJvPotAQ",
  authDomain: "decryptor-game.firebaseapp.com",
  databaseURL: "https://decryptor-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "decryptor-game",
  storageBucket: "decryptor-game.appspot.com",
  messagingSenderId: "285400526933",
  appId: "1:285400526933:web:8c8f9f4fc39c97c8c8a4dc"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
