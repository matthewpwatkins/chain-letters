const addDays = (date, days) => {
  const newDate = new Date(date.valueOf());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const POINTER_DATE_STRING = '2023-12-07';
const POINTER_DATE = Date.parse(POINTER_DATE_STRING + 'T00:00:00Z');
const POINTER_PUZZLE_ID = 106;
const START_DATE = addDays(POINTER_DATE, -1 * (POINTER_PUZZLE_ID - 1));
const PUZZLE_COUNT = parseInt(process.env.REACT_APP_PUZZLE_COUNT);
const MS_IN_DAY = 86400000;

const daysBetween = (start, end) => {
  return Math.floor((end - start) / MS_IN_DAY);
};

const lPadZeroNumber = (number, length) => {
  return (number + "").padStart(length, "0");
};

const getShortDateString = (date) => {
  const year = lPadZeroNumber(date.getFullYear(), 4);
  const month = lPadZeroNumber(date.getMonth() + 1, 2);
  const dayOfMonth = lPadZeroNumber(date.getDate(), 2);
  return `${year}-${month}-${dayOfMonth}`;
};

export const convertDateToPuzzleId = (date) => {
  const dateAtStartOfDay = Date.parse(`${getShortDateString(date)}T00:00:00Z`);
  const daysSinceStartDate = daysBetween(START_DATE, dateAtStartOfDay);
  let offset = daysSinceStartDate % PUZZLE_COUNT;
  if (offset < 0) {
    offset += PUZZLE_COUNT;
  }
  return offset + 1;
};