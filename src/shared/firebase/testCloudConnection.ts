import { doc, getDoc, setDoc } from "firebase/firestore";
import { BACKUP_APP_NAME } from "../utils/appBackup";
import { db } from "./firebaseClient";
import { getAppStatusDocumentSegments, getUserFirestorePaths } from "./firestorePaths";

export type CloudConnectionTestResult = {
  path: string;
  timestamp: string;
};

export async function testCloudConnection(
  uid: string
): Promise<CloudConnectionTestResult> {
  if (!db) {
    throw new Error("Firebase is not configured for this app build.");
  }

  const timestamp = new Date().toISOString();
  const appStatusRef = doc(db, ...getAppStatusDocumentSegments(uid));

  await setDoc(
    appStatusRef,
    {
      timestamp,
      appName: BACKUP_APP_NAME,
      localModeStillAvailable: true,
      testStatus: "ok",
    },
    { merge: true }
  );

  const snapshot = await getDoc(appStatusRef);

  if (!snapshot.exists()) {
    throw new Error("The cloud test document was not readable after writing.");
  }

  const data = snapshot.data();

  if (data.testStatus !== "ok" || data.localModeStillAvailable !== true) {
    throw new Error("The cloud test document did not contain the expected status.");
  }

  return {
    path: getUserFirestorePaths(uid).appStatus,
    timestamp,
  };
}
