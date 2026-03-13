// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB3AKaBDzQJHgiHA4q73GrBLnBefIvLU58",
    authDomain: "afterpark-c9df6.firebaseapp.com",
    databaseURL: "https://afterpark-c9df6-default-rtdb.firebaseio.com",
    projectId: "afterpark-c9df6",
    storageBucket: "afterpark-c9df6.firebasestorage.app",
    messagingSenderId: "938532798856",
    appId: "1:938532798856:web:20beb91409af7bb6b13a3d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 導出常用功能，方便 controller 使用
export { db, ref, set, onValue, update };