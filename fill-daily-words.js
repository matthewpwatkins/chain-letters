#!/usr/bin/node
const START_DATE_UTC = Date.parse('2022-12-01T00:00:00Z');
const MS_IN_DAY = 86400000;

const lPadZeroNumber = (number, length) => {
  return (number + "").padStart(length, "0");
};

const getShortDateString = (date) => {
  const year = lPadZeroNumber(date.getFullYear(), 4);
  const month = lPadZeroNumber(date.getMonth() + 1, 2);
  const dayOfMonth = lPadZeroNumber(date.getDate(), 2);
  return `${year}-${month}-${dayOfMonth}`;
};

const convertPuzzleIdToDate = (puzzleID) => {
  return new Date(START_DATE_UTC + ((parseInt(puzzleID) - 1) * MS_IN_DAY));
};

const fs = require('fs');
var rl = require('readline-sync');

const PUZZLE_DEFINITIONS_PATH = 'public/puzzle-definitions';

if (!fs.existsSync(PUZZLE_DEFINITIONS_PATH)) {
  fs.mkdirSync(PUZZLE_DEFINITIONS_PATH);
}

const fileNames = fs.readdirSync(PUZZLE_DEFINITIONS_PATH).sort();
const nextNumber = parseInt(fileNames[fileNames.length - 1].substring(0, 5)) + 1;

for (let i = 0; i < 100; i++) {
  const number = nextNumber + i;
  const date = getShortDateString(convertPuzzleIdToDate(number));
  const fileName = `${(number + '').padStart(5, '0')}.json`;
  const filePath = `${PUZZLE_DEFINITIONS_PATH}/${fileName}`;
  if (!fs.existsSync(filePath)) {
    const sourceWord = rl.question(`${date}: ${fileName} - source: `);
    if (!sourceWord) {
      throw new Error(sourceWord);
    }
    const destinationWord = rl.question(`${date}: ${fileName} - destination: `);
    if (!destinationWord) {
      throw new Error(destinationWord);
    }
    const bestPath = rl.question(`${date}: ${fileName} - best path ${sourceWord} => ${destinationWord}: `);

    const puzzle = {
      source_word: sourceWord,
      destination_word: destinationWord,
      best_path: bestPath.split(',')
    };
    fs.writeFileSync(filePath, JSON.stringify(puzzle, undefined, '  '));
  }
}