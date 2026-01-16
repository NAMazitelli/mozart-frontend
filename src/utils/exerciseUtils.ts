/**
 * Utility functions for exercise components
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Extract difficulty from URL parameters with mobile fallback.
 * This addresses an issue where useParams might not work correctly on mobile.
 *
 * @param urlDifficulty - Difficulty from useParams hook
 * @param componentName - Name of the component for logging (optional)
 * @returns The extracted difficulty or 'easy' as default
 */
export const getDifficultyFromUrl = (
  urlDifficulty: string | undefined,
  componentName: string = 'Exercise'
): Difficulty => {
  // Primary method: useParams hook
  if (urlDifficulty && ['easy', 'medium', 'hard'].includes(urlDifficulty)) {
    return urlDifficulty as Difficulty;
  }

  // Fallback method: extract from window.location.pathname
  const pathname = window.location.pathname;
  const pathParts = pathname.split('/');
  const exerciseIndex = pathParts.findIndex(part => part === 'exercise');

  if (exerciseIndex !== -1 && pathParts[exerciseIndex + 2]) {
    const fallbackDifficulty = pathParts[exerciseIndex + 2];
    if (['easy', 'medium', 'hard'].includes(fallbackDifficulty)) {
      return fallbackDifficulty as Difficulty;
    }
  }
  return 'easy';
};

/**
 * Log API call information for debugging
 *
 * @param componentName - Name of the component
 * @param exerciseType - Type of exercise (e.g., 'guess-note', 'panning')
 * @param difficulty - The difficulty being used
 * @param isError - Whether this is an error log
 */
export const logApiCall = (
  componentName: string,
  exerciseType: string,
  difficulty: string,
  isError: boolean = false
) => {
  const apiPath = `/exercise/${exerciseType}/${difficulty}`;
};

/**
 * Submit exercise results to backend for leaderboard tracking
 * @param exerciseCategory - Category of exercise (guess-note, intervals, etc.)
 * @param difficulty - Exercise difficulty
 * @param isCorrect - Whether the answer was correct
 * @param userAnswer - User's answer
 * @param correctAnswer - The correct answer
 * @param accuracy - Accuracy percentage (0-100)
 * @param exerciseData - Additional exercise data
 * @returns Promise that resolves when submission is complete
 */
export const submitExerciseResult = async (params: {
  exerciseCategory: string;
  difficulty: string;
  isCorrect: boolean;
  userAnswer: any;
  correctAnswer: any;
  accuracy: number;
  exerciseData: any;
}): Promise<void> => {
  try {
    const { exerciseService } = await import('../services/api');
    const submitResponse = await exerciseService.submitExercise({
      exerciseCategory: params.exerciseCategory,
      difficulty: params.difficulty,
      isCorrect: params.isCorrect,
      userAnswer: params.userAnswer,
      correctAnswer: params.correctAnswer,
      accuracy: params.accuracy,
      timeTaken: undefined,
      exerciseData: params.exerciseData
    });
    console.log('Exercise submitted successfully:', submitResponse);
  } catch (submitError) {
    console.error('Error submitting exercise:', submitError);
    // Don't throw error - validation succeeded, this is just for stats
  }
};