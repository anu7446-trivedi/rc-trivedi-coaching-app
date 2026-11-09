// Firestore rules ki jaanch. Chalane ke liye (Java chahiye):
//   npm i -D firebase-tools @firebase/rules-unit-testing firebase
//   npx firebase emulators:exec --only firestore --project demo-rc "node tests/firestore-rules.test.mjs"
// (firebase.json me emulators.firestore.port = 8085 set karein)
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, getDocs, collection, query, where, updateDoc, Timestamp } from "firebase/firestore";
import fs from "fs";
const env = await initializeTestEnvironment({ projectId: "demo-rc", firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url),"utf8"), host:"127.0.0.1", port:8085 } });
const future = Timestamp.fromMillis(Date.now()+86400000), past = Timestamp.fromMillis(Date.now()-1000);
await env.withSecurityRulesDisabled(async (c) => {
  const d = c.firestore();
  await setDoc(doc(d,"courses/paid"),{published:true,price:999,title:"P"});
  await setDoc(doc(d,"courses/free"),{published:true,price:0,title:"F"});
  await setDoc(doc(d,"courses/draft"),{published:false,price:10});
  await setDoc(doc(d,"courses/paid/items/t1"),{type:"test",title:"T"});
  await setDoc(doc(d,"courses/paid/keys/t1"),{answers:[1]});
  await setDoc(doc(d,"courses/free/items/f1"),{type:"pdf"});
  await setDoc(doc(d,"students/alice"),{name:"A",phone:"+911111111111",active:true});
  await setDoc(doc(d,"students/bob"),{name:"B",phone:"+912222222222",active:true});
  await setDoc(doc(d,"enrollments/alice_paid"),{uid:"alice",courseId:"paid",expiresAt:future});
  await setDoc(doc(d,"enrollments/bob_paid"),{uid:"bob",courseId:"paid",expiresAt:past});
});
const guest = env.unauthenticatedContext().firestore();
const alice = env.authenticatedContext("alice",{phone_number:"+911111111111"}).firestore();
const bob = env.authenticatedContext("bob",{phone_number:"+912222222222"}).firestore();
const carl = env.authenticatedContext("carl",{phone_number:"+913333333333"}).firestore();
const adminDb = env.authenticatedContext("adm",{email:"rct.anurag.2015@gmail.com"}).firestore();
const t = async (name, p) => { try { await p; console.log("ok  ", name); } catch(e) { console.log("FAIL", name, e.message.slice(0,150)); process.exitCode=1; } };
await t("guest lists published", assertSucceeds(getDocs(query(collection(guest,"courses"),where("published","==",true)))));
await t("guest cannot read draft", assertFails(getDoc(doc(guest,"courses/draft"))));
await t("admin reads draft", assertSucceeds(getDoc(doc(adminDb,"courses/draft"))));
await t("guest no items", assertFails(getDocs(collection(guest,"courses/paid/items"))));
await t("alice enrolled lists items", assertSucceeds(getDocs(collection(alice,"courses/paid/items"))));
await t("bob expired no items", assertFails(getDocs(collection(bob,"courses/paid/items"))));
await t("bob reads free items", assertSucceeds(getDocs(collection(bob,"courses/free/items"))));
await t("alice no key before result", assertFails(getDoc(doc(alice,"courses/paid/keys/t1"))));
await t("alice cannot self-enroll", assertFails(setDoc(doc(alice,"enrollments/alice_draft"),{uid:"alice",courseId:"draft",expiresAt:future})));
await t("alice gets own enrollment", assertSucceeds(getDoc(doc(alice,"enrollments/alice_paid"))));
await t("alice lists own enrollments", assertSucceeds(getDocs(query(collection(alice,"enrollments"),where("uid","==","alice")))));
await t("alice cannot get bob enrollment", assertFails(getDoc(doc(alice,"enrollments/bob_paid"))));
await t("alice submits result", assertSucceeds(setDoc(doc(alice,"results/t1_alice"),{courseId:"paid",itemId:"t1",testTitle:"T",studentId:"alice",studentName:"A",answers:[1]})));
await t("alice no resubmit", assertFails(setDoc(doc(alice,"results/t1_alice"),{courseId:"paid",itemId:"t1",testTitle:"T",studentId:"alice",studentName:"A",answers:[0]})));
await t("alice key after result", assertSucceeds(getDoc(doc(alice,"courses/paid/keys/t1"))));
await t("bob expired cannot submit", assertFails(setDoc(doc(bob,"results/t1_bob"),{courseId:"paid",itemId:"t1",testTitle:"T",studentId:"bob",studentName:"B",answers:[1]})));
await t("carl creates profile", assertSucceeds(setDoc(doc(carl,"students/carl"),{name:"C",phone:"+913333333333",active:true})));
await t("carl cannot fake phone", assertFails(setDoc(doc(env.authenticatedContext("dan",{phone_number:"+914"}).firestore(),"students/dan"),{name:"D",phone:"+915",active:true})));
await t("carl cannot set batch", assertFails(updateDoc(doc(carl,"students/carl"),{batchId:"x"})));
await t("carl updates name", assertSucceeds(updateDoc(doc(carl,"students/carl"),{name:"Carl"})));
await t("alice cannot write orders", assertFails(setDoc(doc(alice,"orders/o1"),{uid:"alice",status:"paid"})));
await t("admin grants", assertSucceeds(setDoc(doc(adminDb,"enrollments/carl_paid"),{uid:"carl",courseId:"paid",expiresAt:future})));
await t("guest settings read", assertSucceeds(getDoc(doc(guest,"settings/app"))));
await env.cleanup();
