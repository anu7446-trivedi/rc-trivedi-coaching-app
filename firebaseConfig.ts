// =====================================================================
//  App ki Firebase settings.
//  Android app ki Firebase keys "google-services.json" file me hain
//  (Firebase Console > Project settings > Your apps > Android).
// =====================================================================

// Admin (aap). Isi email/password se login karne par Admin Panel khulega.
// Yahi email firestore.rules aur storage.rules me bhi hai.
export const ADMIN_EMAILS = ["rct.anurag.2015@gmail.com"];

// Cloud Functions (payment) kis region me chalte hain — Mumbai.
export const FUNCTIONS_REGION = "asia-south1";
