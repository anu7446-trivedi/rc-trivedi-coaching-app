// =====================================================================
//  STEP 1: Firebase Console (https://console.firebase.google.com) se
//  apne project ki "Web app" config yahan paste karein.
//  (Ye keys secret nahi hoti — app me rakhna safe hai.)
// =====================================================================
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

// =====================================================================
//  STEP 2: Admin (aapka) email. Isi email se login karne par Admin Panel
//  khulega. Yahi email firestore.rules me bhi daalna hai.
// =====================================================================
export const ADMIN_EMAILS = ["YOUR_ADMIN_EMAIL@gmail.com"];

// Students mobile number se login karte hain. Andar hi andar mobile number
// ko is domain wale email me badla jata hai (jaise 9876543210@rctrivedi.app).
export const STUDENT_EMAIL_DOMAIN = "rctrivedi.app";
