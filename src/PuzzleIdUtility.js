// Dec 1, 2022
const START_DATE_UTC = Date.parse('2022-12-01T00:00:00Z');
const MS_IN_DAY = 86400000;
console.log(`Puzzle count: ${process.env.REACT_APP_PUZZLE_COUNT}`);
const PUZZLE_COUNT = parseInt(process.env.REACT_APP_PUZZLE_COUNT);

const lPadZeroNumber = (number, length) => {
  return (number + "").padStart(length, "0");
};

const getShortDateString = (date) => {
  const year = lPadZeroNumber(date.getFullYear(), 4);
  const month = lPadZeroNumber(date.getMonth() + 1, 2);
  const dayOfMonth = lPadZeroNumber(date.getDate(), 2);
  return `${year}-${month}-${dayOfMonth}`;
};

export const convertPuzzleIdToDate = (puzzleID) => {
  return new Date(START_DATE_UTC + ((parseInt(puzzleID) - 1) * MS_IN_DAY));
};

export const convertDateToPuzzleId = (date) => {
  const comparisonUtc = Date.parse(`${getShortDateString(date)}T00:00:00Z`);
  // Modulo rotates the puzzles so that we never fully run out
  return (Math.round((comparisonUtc - START_DATE_UTC) / MS_IN_DAY) + 1) % (PUZZLE_COUNT + 1);
};