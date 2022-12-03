#!/usr/bin/node
const fs = require('fs');
var rl = require('readline-sync');

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

if (!fs.existsSync('puzzle-definitions')) {
  fs.mkdirSync('puzzle-definitions');
}

const existingFileNames = fs.readdirSync('puzzle-definitions').sort();
const startDateString = existingFileNames.length ? existingFileNames[0].substring(0, 10) : todayDateString;
const startDate = new Date(`${startDateString}T00:00:00Z`);

const usedWords = new Set();
const maxIterations = 365 * 10;

for (let i = 0; i < maxIterations; i++) {
  const currentDate = startDate.addDays(i);
  const currentDateString = currentDate.toShortIsoDateString();
  const fileName = `${currentDateString}.json`;
  const filePath = `puzzle-definitions/${fileName}`;
  if (fs.existsSync(filePath)) {
    const puzzle = JSON.parse(fs.readFileSync(filePath));
    usedWords.add(puzzle.source_word);
    usedWords.add(puzzle.destination_word);
  } else {
    const sourceWord = rl.question(`Source word for ${fileName}: `);
    if (!sourceWord || usedWords.has(sourceWord)) {
      throw new Error(sourceWord);
    }
    usedWords.add(sourceWord);

    const destinationWord = rl.question(`Destination word for ${fileName}: `);
    if (!destinationWord || usedWords.has(destinationWord)) {
      throw new Error(destinationWord);
    }
    usedWords.add(destinationWord);

    const puzzle = {
      source_word: sourceWord,
      destination_word: destinationWord
    };
    fs.writeFileSync(filePath, JSON.stringify(puzzle, undefined, '  '));
  }
}