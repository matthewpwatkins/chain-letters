#!/usr/bin/node
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
  const fileName = `${(number + '').padStart(5, '0')}.json`;
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