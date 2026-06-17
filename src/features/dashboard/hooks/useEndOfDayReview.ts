import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import type { EndOfDayReview } from "../../../shared/types/planning";
import type { Task } from "../../../shared/types/task";
import {
  END_OF_DAY_REVIEW_STORAGE_KEY,
  normalizeEndOfDayReviews,
} from "../utils/planningStorage";

type EndOfDayReviewInput = Omit<
  EndOfDayReview,
  "id" | "createdAt" | "updatedAt"
>;

export function getTomorrowSeedTasks(
  review: EndOfDayReview | undefined,
  tasks: Task[],
) {
  const seedIds = new Set(review?.tomorrowSeedTaskIds ?? []);

  return tasks.filter((task) => seedIds.has(task.id));
}

export function useEndOfDayReview() {
  const [storedReviews, setStoredReviews] = useLocalStorage<unknown[]>(
    END_OF_DAY_REVIEW_STORAGE_KEY,
    [],
  );
  const reviews = normalizeEndOfDayReviews(storedReviews);

  function getReviewForDate(date: string) {
    return reviews.find((review) => review.date === date);
  }

  function saveReview(input: EndOfDayReviewInput) {
    const now = new Date().toISOString();

    setStoredReviews((currentValue) => {
      const currentReviews = normalizeEndOfDayReviews(currentValue);
      const existing = currentReviews.find((review) => review.date === input.date);
      const nextReview: EndOfDayReview = {
        ...input,
        id: existing?.id ?? crypto.randomUUID(),
        tomorrowSeedTaskIds: input.tomorrowSeedTaskIds ?? input.rolloverTaskIds,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      if (existing) {
        return currentReviews.map((review) =>
          review.date === input.date ? nextReview : review,
        );
      }

      return [nextReview, ...currentReviews];
    });
  }

  return {
    reviews,
    getReviewForDate,
    saveReview,
  };
}
