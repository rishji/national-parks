import { findRuns } from "./sheetGrid";

test("findRuns returns [start, end) spans where the profile is at or above the threshold, ignoring short blips", () => {
  const profile = [0, 0, 5, 9, 9, 9, 0, 0, 1, 0, 7, 8, 9, 9, 0];
  expect(findRuns(profile, 5, 3)).toEqual([
    [2, 6],
    [10, 14],
  ]);
});

test("findRuns closes a run that reaches the end of the profile", () => {
  expect(findRuns([0, 6, 6, 6], 5, 2)).toEqual([[1, 4]]);
});
