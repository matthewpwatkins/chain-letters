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


const withoutIndex = (word, i) => {
  return word.slice(0, i) + word.slice(i + 1);
}

const isSingleLetterAdd = (shorterWord, longerWord) => {
  if (longerWord.length === shorterWord.length + 1) {
    for (let i = 0; i < longerWord.length; i++) {
      if (shorterWord === withoutIndex(longerWord, i)) {
        return true;
      }
    }
  }
  return false;
};

const isReverse = (a, b) => {
  return a.length === b.length
    && b === a.split('').reverse().join('');
};

const isLetterSwap = (a, b) => {
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

const rotateRight = (word) => {
  return word.substring(word.length - 1, word.length) + word.substring(0, word.length - 1);
};

const isSingleLetterShift = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  if (a === b) {
    return false;
  }

  let startIndex, endIndex;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      startIndex = i;
      break;
    }
  }

  for (let i = 0; i < a.length; i++) {
    if (a[a.length - 1 - i] !== b[b.length - 1 - i]) {
      endIndex = a.length - 1 - i;
      break;
    }
  }

  const aSlice = a.substring(startIndex, endIndex + 1);
  const bSlice = b.substring(startIndex, endIndex + 1);
  return aSlice === rotateRight(bSlice)
    || bSlice === rotateRight(aSlice);
};

export const wordsAreCloseEnough = (a, b) => {
  if (getLevenshteinDistance(a, b) === 1) {
    return true;
  }

  const lengthDifference = b.length - a.length;
  if (lengthDifference === 0) {
    return isReverse(a, b) || isLetterSwap(a, b) || isSingleLetterShift(a, b);
  }

  if (Math.abs(lengthDifference) === 1) {
    const longerWord = lengthDifference === 1 ? b : a;
    const shorterWord = lengthDifference === 1 ? a : b;
    return isSingleLetterAdd(shorterWord, longerWord);
  }

  return false;
};

const LABEL_TEXTS_TO_IGNORE = new Set(['obsolete', 'slang', 'urban', 'informal', 'dialect', 'obs', 'obs.', 'prov. eng.', 'obs. or prov. eng.', 'archaic']);

const isAcceptableDefinition = (definition) => {
  if (!definition.text) {
    return false;
  }
  if (definition.text === "abbreviation") {
    return false;
  }

  const lowerCaseDefinition = definition.text.toLocaleLowerCase();
  if (lowerCaseDefinition.startsWith("obsolete ")) {
    return false;
  } else if (lowerCaseDefinition.startsWith("<xref>acronym</xref> ")) {
    return false;
  } else if (lowerCaseDefinition.startsWith("acronym ")) {
    return false;
  } else if (lowerCaseDefinition.startsWith("archaic ")) {
    return false;
  } else if (lowerCaseDefinition.indexOf("dialectal ") >= 0) {
    return false;
  } else if (lowerCaseDefinition.indexOf('obsolete spelling of ') >= 0) {
    return false;
  }

  if (definition.labels) {
    for (const label of definition.labels) {
      if (LABEL_TEXTS_TO_IGNORE.has(label.text.toLocaleLowerCase())) {
        return false;
      } else if (label.type === "region" && label.text !== "US") {
        return false;
      } else if (label.type === "field" || label.type === "fld") {
        return false;
      }
    }
  }

  return true;
};

const compareDefinition = (def1, def2) => {
  if (def1.exampleUses?.length) {
    if (def2.exampleUses?.length) {
      return def2.exampleUses.length - def1.exampleUses.length;
    }
    return -1;
  } else if (def2.exampleUses?.length) {
    return 1;
  }

  if (def1.sequence) {
    if (def2.sequence) {
      return parseInt(def1.sequence) - parseInt(def2.sequence);
    } else {
      return -1;
    }
  } else {
    if (def2.sequence) {
      return 1;
    } else {
      return 0;
    }
  }
};

const getWordnikDefinitions = async (word) => {
  const definitionURL = `https://api.wordnik.com/v4/word.json/${word}/definitions?limit=200&includeRelated=false&useCanonical=false&includeTags=false&api_key=c23b746d074135dc9500c0a61300a3cb7647e53ec2b9b658e`;
  const definitionRes = await fetch(definitionURL);
  if (definitionRes.status === 404) {
    return 0;
  }

  if (!definitionRes.ok) {
    return undefined;
  }

  const wordnikDefinitions = await definitionRes.json();
  const acceptableDefinitions = wordnikDefinitions
    .filter(isAcceptableDefinition)
    .map(d => {
      d.exampleUses = d.exampleUses?.filter(u => u.text.indexOf(d.word) >= 0);
      if (!d.exampleUses?.length) {
        d.exampleUses = d.citations?.filter(c => c.cite?.indexOf(d.word) >= 0)
          .map(c => {
            return { text: c.cite };
          });
      }
      return d;
    })
    .sort(compareDefinition);
  return {
    totalDefinitionCount: wordnikDefinitions.length,
    acceptableDefinitions: acceptableDefinitions,
    acceptableDefinitionsPercent: acceptableDefinitions.length / wordnikDefinitions.length
  };
};

const getWordnikFrequenciesCount = async (word) => {
  const frequencyURL = `https://api.wordnik.com/v4/word.json/${word}/frequency?useCanonical=false&startYear=1950&api_key=c23b746d074135dc9500c0a61300a3cb7647e53ec2b9b658e`;
  const frequencyRes = await fetch(frequencyURL);
  if (frequencyRes.status === 404) {
    return 0;
  }
  if (frequencyRes.ok) {
    const wordnikFrequencies = await frequencyRes.json();
    return wordnikFrequencies.totalCount;
  }
  return undefined;
};

const wordExistsInPermissiveWordList = async (word) => {
  const res = await fetch(`https://cdn.jsdelivr.net/gh/TodoCleverNameHere/valid-words@master/en_US/${word}.json`);
  return res.ok;
}

export const defineWord = async (word) => {
  const existsInPermissiveWordList = await wordExistsInPermissiveWordList(word);
  if (!existsInPermissiveWordList) {
    console.log("Not in the permissive list");
    return false;
  }

  const wordnikFrequencyCount = await getWordnikFrequenciesCount(word);
  if (wordnikFrequencyCount !== undefined && wordnikFrequencyCount < 100) {
    console.log("Not enough frequency: " + wordnikFrequencyCount);
    return false;
  }

  const wordnikDefinitions = await getWordnikDefinitions(word);
  if (wordnikDefinitions) {
    if (wordnikDefinitions.acceptableDefinitions.length === 0) {
      console.log("Not enough definitions: " + wordnikDefinitions.acceptableDefinitions.length);
      return false;
    }
    if (wordnikDefinitions.totalDefinitionCount > 3 && wordnikDefinitions.acceptableDefinitionsPercent < .5) {
      console.log(`Low acceptable definition %: ${wordnikDefinitions.acceptableDefinitionsPercent}`);
      return false;
    }
  }

  return wordnikDefinitions;
};
