# RC Trivedi Coaching Center — Android App (v4)

Coaching ka pura app: **Student** ke liye aur **Admin (aap)** ke liye. Sab kuch aapke control me.

## ✨ Features

| Student ke liye | Admin (aap) ke liye |
|---|---|
| Mobile number + password se login | Students jodna / edit / band karna, password reset |
| Notices dekhna | Batch banana |
| Notes (PDF) aur video lectures | Notices bhejna (sabko ya kisi ek batch ko) |
| Online MCQ test (timer ke saath, ek hi baar) | PDF / YouTube link daalna |
| Result + sahi/galat uttar | MCQ test banana (ek saath paste bhi kar sakte hain), Live/Draft |
| Attendance % | Merit list / results, dobara test dene dena |
| UPI se fees bharna + history | Roz ki attendance lagana |
| Password badalna | Fees: UPI verify, cash entry, baaki students ki list |
| | Admission enquiries (Call / WhatsApp) |
| | App ka naam, phone, UPI ID, courses — app ke andar se badlein |

Public home page par: courses, Call, WhatsApp, Admission form.

---

## 💰 Kharcha kitna hoga?

| Cheez | Kharcha | Kab |
|---|---|---|
| Firebase (database + login) — **Spark plan** | **₹0** (free) | — |
| Expo account (app build karne ke liye) | **₹0** (free, ~30 build/mahina) | — |
| **Google Play Developer Account** | **$25 (~₹2,100) ek baar** | Play Store par daalne se pehle |
| UPI se fees | **₹0** — paisa seedha aapke bank me | — |

> Bas ek hi payment hai: **Google Play Console ka $25**. Baaki sab free hai.

---

## 🚀 Setup — Step by step

### Step 1: Firebase (database) — free
1. https://console.firebase.google.com par Gmail se login → **Add project** → naam `rc-trivedi-coaching` → Create.
2. **Build → Authentication → Get started → Email/Password → Enable → Save.**
3. **Authentication → Users → Add user**: apna admin email + ek mazboot password. *(Ye sabse pehle karein.)*
4. **Build → Firestore Database → Create database** → location `asia-south1 (Mumbai)` → **Production mode**.
5. **Firestore → Rules** tab: `firestore.rules` file ka pura content paste karein, `YOUR_ADMIN_EMAIL@gmail.com` ki jagah apna email likhein → **Publish**.
6. **Project settings (⚙️) → General → Your apps → Web (`</>`)** → naam dekar Register → jo `firebaseConfig` dikhe wo copy karein.

### Step 2: App me config daalna
`firebaseConfig.ts` file kholein (GitHub par bhi ✏️ se edit kar sakte hain):
- `PASTE_...` ki jagah Firebase wali values daalein.
- `ADMIN_EMAILS` me apna wahi admin email likhein.

### Step 3: Expo account (APK/AAB banane ke liye) — free
1. https://expo.dev par sign up karein.
2. Account → **Access Tokens** → **Create token** → copy karein.
3. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret** → Name: `EXPO_TOKEN`, Value: token.
4. Pehli baar ek computer se `npx eas-cli init` chalana padega (project ID `app.json` me jud jayega) — ya mujhe (Claude) bolein, main kar dunga jab aap token de denge.

### Step 4: App banwana
- GitHub → **Actions → Android App Build → Run workflow**
  - `preview` = **APK** — seedha phone me install karke test karein.
  - `production` = **AAB** — Play Store ke liye.
- Build expo.dev par ~10–20 minute me banega, wahan se download karein.

### Step 5: Play Store par daalna
1. https://play.google.com/console → Developer account banayein → **$25 pay karein** (debit/credit card) → ID verification (Aadhaar/PAN, 1–3 din).
2. **Create app** → naam "RC Trivedi Coaching", Free, App.
3. Bharna hoga: App icon (512×512), feature graphic (1024×500), 2+ screenshots, short/full description, **Privacy Policy URL** (`PRIVACY_POLICY.md` ko GitHub Pages/Google Sites par daal kar link de sakte hain), Data safety form, Content rating, Target audience.
4. ⚠️ **Naye personal account** ke liye Google ka niyam: pehle **Closed testing me 12 testers, 14 din** chalana zaroori hai, tabhi Production me jaa sakte hain. (Students/parents ke Gmail tester bana sakte hain.)
5. Production → AAB upload → Review ke liye bhejein (1–7 din).

---

## 🧑‍🏫 Roz ka istemaal (Admin)
1. App kholein → **Login → Admin** → email/password.
2. Pehle **Batches** banayein → fir **Students** jodein (mobile + password student ko bata dein).
3. **App Settings** me apni **UPI ID** daalein — students isi par fees bhejenge, aap UTR milakar **Verify** karein.
4. Notes: PDF ko Google Drive par daal kar "Anyone with the link" share karein, link app me daalein.

**Student password bhool gaya?** Firebase Console → Authentication → Users me `mobile@rctrivedi.app` wala user delete karein → app me us student ko kholkar "Naya Password Set Karein". Data surakshit rahega.

---

## 🛠 Developer notes
- Expo SDK 54 + expo-router + Firebase JS SDK (Auth + Firestore). Server/Cloud Functions ki zaroorat nahi.
- `npm install` → `npx expo start` (Expo Go app me QR scan karke chalayein).
- `npm run typecheck`
- Test ke sahi uttar `testKeys` collection me alag hain; student ko sirf submit ke baad milte hain (rules dekhein).
