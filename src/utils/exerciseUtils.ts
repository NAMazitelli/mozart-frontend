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
    console.log(`${componentName} - Difficulty from useParams:`, urlDifficulty);
    return urlDifficulty as Difficulty;
  }

  // Fallback method: extract from window.location.pathname
  const pathname = window.location.pathname;
  console.log(`${componentName} - Current pathname:`, pathname);
  const pathParts = pathname.split('/');
  const exerciseIndex = pathParts.findIndex(part => part === 'exercise');

  if (exerciseIndex !== -1 && pathParts[exerciseIndex + 2]) {
    const fallbackDifficulty = pathParts[exerciseIndex + 2];
    if (['easy', 'medium', 'hard'].includes(fallbackDifficulty)) {
      console.log(`${componentName} - Difficulty from pathname fallback:`, fallbackDifficulty);
      return fallbackDifficulty as Difficulty;
    }
  }

  console.log(`${componentName} - No difficulty found, defaulting to easy`);
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
  if (isError) {
    console.error(`${componentName} - Failed API call was to:`, apiPath);
  } else {
    console.log(`${componentName} - Loading exercise with difficulty:`, difficulty);
    console.log(`${componentName} - API call will be made to:`, apiPath);
  }
};