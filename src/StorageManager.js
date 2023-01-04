const readLocalStorage = (key, defaultValue) => {
  const fullKey = `chain_letters.${key}`;
  const json = window.localStorage.getItem(fullKey);
  return json?.length ? JSON.parse(json) : defaultValue;
}

const setLocalStorage = (key, value) => {
  const fullKey = `chain_letters.${key}`;
  window.localStorage.setItem(fullKey, JSON.stringify(value));
}

export const getPuzzleDefinition = async (id) => {
  const puzzleFileID = ('' + id).padStart(5, '0');
  const puzzlePath = `${window.location.origin}/puzzle-definitions/${puzzleFileID}.json`;
  const res = await fetch(puzzlePath);
  const puzzleDefinition = await res.json();
  return puzzleDefinition.easy ? puzzleDefinition : {
    id: id,
    easy: puzzleDefinition
  };
};

export const getUserPreferences = () => {
  return readLocalStorage('user.preferences', {
    new_player: true
  });
}

export const storeUserPreferences = (prefs) => {
  setLocalStorage('user.preferences', prefs);
}

export const getUserPuzzle = async (id) => {
  let userPuzzle = readLocalStorage(`puzzles.${id}`);
  if (userPuzzle) {
    return userPuzzle;
  }

  return {
    definition: await getPuzzleDefinition(id),
    attempt: {}
  };
};

export const storeUserPuzzle = (userPuzzle) => {
  setLocalStorage(`puzzles.${userPuzzle.definition.id}`, userPuzzle);
};
