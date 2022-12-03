const readLocalStorage = (key, defaultValue) => {
  const fullKey = `chain_letters.${key}`;
  const json = window.localStorage.getItem(fullKey);
  console.log(`Fetched localStorage ${fullKey}`, json);
  return json?.length ? JSON.parse(json) : defaultValue;
}

const setLocalStorage = (key, value) => {
  const fullKey = `chain_letters.${key}`;
  console.log(`Storing localStorage ${fullKey}`, value);
  window.localStorage.setItem(fullKey, JSON.stringify(value));
}

export const getPuzzleDefinition = async (id) => {
  const puzzlePath = `${window.location}/puzzle-definitions/${id}.json`;
  const res = await fetch(puzzlePath);
  const puzzleDefinition = await res.json();
  return puzzleDefinition.easy ? puzzleDefinition : {
    id: id,
    easy: puzzleDefinition
  };
};

export const getUserPuzzle = async (id) => {
  let userPuzzle = readLocalStorage(`puzzles.${id}`);
  if (userPuzzle) {
    return userPuzzle;
  }

  return {
    definition: await this.getPuzzleDefinition(id),
    attempt: {}
  };
};

export const storeUserPuzzle = (userPuzzle) => {
  setLocalStorage(`puzzles.${userPuzzle.definition.id}`, userPuzzle);
};
