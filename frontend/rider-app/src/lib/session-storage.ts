import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@/types";

const SESSION_KEY = "okadago.rider.session.v2";

export async function loadSavedSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  const session = JSON.parse(raw) as Session;
  if (session.expiresAt && Date.parse(session.expiresAt) <= Date.now()) {
    await clearSavedSession();
    return null;
  }

  return session;
}

export async function saveSession(session: Session) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSavedSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
