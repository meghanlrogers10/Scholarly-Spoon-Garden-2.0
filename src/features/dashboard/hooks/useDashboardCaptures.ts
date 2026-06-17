import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";

export type CapturedItem = {
  id: string;
  text: string;
  createdAt: string;
};

export function useDashboardCaptures() {
  const [capturedItems, setCapturedItems] = useLocalStorage<CapturedItem[]>(
    "ssg2.quickCaptures",
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