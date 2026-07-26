import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import {
  QUICK_CAPTURES_STORAGE_KEY,
  type CapturedItem,
} from "../utils/planningStorage";
export type { CapturedItem } from "../utils/planningStorage";

export function useDashboardCaptures() {
  const [capturedItems, setCapturedItems] = useLocalStorage<CapturedItem[]>(
    QUICK_CAPTURES_STORAGE_KEY,
    [],
  );

  function saveCapture(text: string) {
    const newItem: CapturedItem = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setCapturedItems((currentItems) => [newItem, ...currentItems]);
  }

  function deleteCapture(id: string) {
    setCapturedItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  }

  function clearCaptures() {
    setCapturedItems([]);
  }

  return {
    capturedItems,
    saveCapture,
    deleteCapture,
    clearCaptures,
  };
}
