/**
 * Returns a new array with the elements shuffled (Fisher–Yates). Does not
 * mutate the input, unlike the web app's in-place version.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
