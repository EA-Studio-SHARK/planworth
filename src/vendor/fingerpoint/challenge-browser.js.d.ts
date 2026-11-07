export function generateChallenges(
  count?: number,
  usedLengths?: number[],
): { id: string; expected_count: number; prompt: string }[];
