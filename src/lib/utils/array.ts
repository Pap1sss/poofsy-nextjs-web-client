/**
 * Checks if the source array contains items from the target array.
 * @param source - The array to check against
 * @param target - The items to look for
 * @param requireAll - If true, all target items must be in source. If false, at least one must be present.
 * @returns boolean
 */
export function hasItems<T>(source: T[], target: T[], requireAll = false): boolean {
  return requireAll
    ? target.every((item) => source.includes(item))
    : target.some((item) => source.includes(item));
}
