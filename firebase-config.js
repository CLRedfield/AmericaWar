// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAVXLcXI4UowNLAJPW2V1v9ycdXfEadHSU",
    authDomain: "project-6663045726406403667.firebaseapp.com",
    databaseURL: "https://project-6663045726406403667-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-6663045726406403667",
    storageBucket: "project-6663045726406403667.firebasestorage.app",
    messagingSenderId: "901298595323",
    appId: "1:901298595323:web:9764ec9e1080ad07d9175e"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

window.auth = auth;
window.database = database;

let firebaseReadyPromise = null;

async function ensureFirebaseReady() {
    if (auth.currentUser) {
        return auth.currentUser;
    }

    if (!firebaseReadyPromise) {
        firebaseReadyPromise = auth.signInAnonymously()
            .then((credential) => credential.user || auth.currentUser)
            .catch((error) => {
                firebaseReadyPromise = null;
                throw error;
            });
    }

    return firebaseReadyPromise;
}

window.ensureFirebaseReady = ensureFirebaseReady;
ensureFirebaseReady().catch((error) => {
    console.error("Firebase anonymous auth failed:", error);
});
