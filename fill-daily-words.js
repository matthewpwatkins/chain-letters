#!/usr/bin/node
const fs = require('fs');
var rl = require('readline-sync');

const PUZZLE_DEFINITIONS_PATH = 'public/puzzle-definitions';

Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

Date.prototype.toShortIsoDateString = function () {
  return this.toISOString().substring(0, 10);
}

const now = new Date();
const todayDateString = now.toShortIsoDateString();

if (!fs.existsSync(PUZZLE_DEFINITIONS_PATH)) {
  fs.mkdirSync(PUZZLE_DEFINITIONS_PATH);
}

const existingFileNames = fs.readdirSync(PUZZLE_DEFINITIONS_PATH).sort();
const startDateString = existingFileNames.length ? existingFileNames[0].substring(0, 10) : todayDateString;
const startDate = new Date(`${startDateString}T00:00:00Z`);

const maxIterations = 365 * 10;

for (let i = 0; i < maxIterations; i++) {
  const currentDate = startDate.addDays(i);
  const currentDateString = currentDate.toShortIsoDateString();
  const fileName = `${currentDateString}.json`;
  const filePath = `${PUZZLE_DEFINITIONS_PATH}/${fileName}`;
  if (!fs.existsSync(filePath)) {
    const sourceWord = rl.question(`Source word for ${fileName}: `);
    if (!sourceWord) {
      throw new Error(sourceWord);
    }
    const destinationWord = rl.question(`Destination word for ${fileName}: `);
    if (!destinationWord) {
      throw new Error(destinationWord);
    }

    const puzzle = {
      source_word: sourceWord,
      destination_word: destinationWord
    };
    fs.writeFileSync(filePath, JSON.stringify(puzzle, undefined, '  '));
  }
}