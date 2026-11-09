// =====================================================================
//  STEP 1: Firebase Console (https://console.firebase.google.com) se
//  apne project ki "Web app" config yahan paste karein.
//  (Ye keys secret nahi hoti — app me rakhna safe hai.)
// =====================================================================
export const firebaseConfig = {
  apiKey: "AIzaSyDzwO0iRAMK9BDeCVVgTHfVzouX0kuyznQ",
  authDomain: "rc-trivedi-coaching.firebaseapp.com",
  projectId: "rc-trivedi-coaching",
  storageBucket: "rc-trivedi-coaching.firebasestorage.app",
  messagingSenderId: "2257172402",
  appId: "1:2257172402:web:7fdf806014477a5676d6ab",
};

// =====================================================================
//  STEP 2: Admin (aapka) email. Isi email se login karne par Admin Panel
//  khulega. Yahi email firestore.rules me bhi daalna hai.
// =====================================================================
export const ADMIN_EMAILS = ["YOUR_ADMIN_EMAIL@gmail.com"];

// Students mobile number se login karte hain. Andar hi andar mobile number
// ko is domain wale email me badla jata hai (jaise 9876543210@rctrivedi.app).
export const STUDENT_EMAIL_DOMAIN = "rctrivedi.app";
