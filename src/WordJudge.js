// https://www.tutorialspoint.com/levenshtein-distance-in-javascript
const getLevenshteinDistance = (a, b) => {
  const track = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[b.length][a.length];
};

const isSingleLetterSwap = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  if (a === b) {
    return false;
  }

  const diffIndices = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      diffIndices.push(i);
    }
    if (diffIndices.length > 2) {
      break;
    }
  }
  if (diffIndices.length > 2) {
    return false;
  }
  return a[diffIndices[0]] === b[diffIndices[1]]
    && b[diffIndices[0]] === a[diffIndices[1]];
};

const isShift = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  if (a === b) {
    return false;
  }

  return b === a.substring(1) + a[0]
    || b === a[a.length - 1] + a.substring(0, a.length - 1);
};

export const wordsAreCloseEnough = (a, b) => {
  if (isShift(a, b)) {
    return true;
  }

  const lDist = getLevenshteinDistance(a, b);

  if (lDist === 1) {
    // Single insertion or deletion
    return true;
  }

  if (lDist === 2 && isSingleLetterSwap(a, b)) {
    return true;
  }

  // Too many changes
  return false;
};

export const wordExists = async (word) => {
  const res = await fetch(`https://cdn.jsdelivr.net/gh/TodoCleverNameHere/valid-words@master/en_US/${word}.json`);
  return res.ok;
};
