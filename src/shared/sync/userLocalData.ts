import { CLOUD_SAVE_USER_ID_KEY } from "../firebase/cloudSaveMetadata";
import { APP_STORAGE_KEYS, APP_STORAGE_PREFIXES } from "../utils/appBackup";
import {
  notifyLocalStorageChange,
  readLocalStorageValue,
  writeLocalStorageValue,
} from "../utils/localStorageSync";

export type UserLocalDataIsolationResult = {
  previousUid: string;
  nextUid: string;
  removedKeys: string[];
};

export function shouldIsolateLocalDataForUserSwitch(
  previousUid: string | null | undefined,
  nextUid: string | null | undefined,
) {
  return Boolean(previousUid && nextUid && previousUid !== nextUid);
}

function isRecognizedUserDataKey(key: string) {
  return (
    APP_STORAGE_KEYS.some((definition) => definition.key === key) ||
    APP_STORAGE_PREFIXES.some((definition) => key.startsWith(definition.prefix))
  );
}

export function isolateLocalDataForUserSwitch(
  nextUid: string,
): UserLocalDataIsolationResult | null {
  const previousUid = readLocalStorageValue<string | null>(
    CLOUD_SAVE_USER_ID_KEY,
    null,
  );

  if (!previousUid || !shouldIsolateLocalDataForUserSwitch(previousUid, nextUid)) {
    writeLocalStorageValue(CLOUD_SAVE_USER_ID_KEY, nextUid);
    return null;
  }

  const removedKeys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || key === CLOUD_SAVE_USER_ID_KEY || !isRecognizedUserDataKey(key)) {
      continue;
    }

    removedKeys.push(key);
  }

  removedKeys.forEach((key) => {
    window.localStorage.removeItem(key);
    notifyLocalStorageChange(key);
  });

  writeLocalStorageValue(CLOUD_SAVE_USER_ID_KEY, nextUid);

  return {
    previousUid,
    nextUid,
    removedKeys,
  };
}
