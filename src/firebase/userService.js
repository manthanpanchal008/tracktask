import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

const USERS_COLLECTION = "users";

// Save or update user profile in Firestore (called on login/signup)
export const saveUserProfile = async (user) => {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  const data = {
    uid: user.uid,
    displayName: user.displayName || user.email.split("@")[0],
    email: user.email,
    photoURL: user.photoURL || null,
    lastSeen: serverTimestamp(),
  };
  if (!snap.exists()) {
    data.joinedAt = serverTimestamp();
  }
  await setDoc(ref, data, { merge: true });
};

// Subscribe to all team members (real-time)
export const subscribeToTeamMembers = (callback) => {
  return onSnapshot(collection(db, USERS_COLLECTION), (snapshot) => {
    const members = snapshot.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
      joinedAt: d.data().joinedAt?.toDate?.() || null,
      lastSeen: d.data().lastSeen?.toDate?.() || null,
    }));
    callback(members);
  });
};
