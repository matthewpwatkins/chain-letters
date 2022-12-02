import { useEffect, useState } from 'react';
import './App.css';

const ALPHA_REGEX = /^[a-z]+$/i;

const App = () => {
  const [dateString, setDateString] = useState('');
  const [inputWord, setInputWord] = useState('');
  const [linkWords, setLinkWords] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [puzzle, setPuzzle] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const newDateString = new Date().toISOString().substring(0, 10);
    setDateString(newDateString);
    const puzzlePath = `${process.env.PUBLIC_URL}/puzzles/${newDateString}.json`;
    const res = await fetch(puzzlePath);
    const responsePuzzle = await res.json();
    console.group(responsePuzzle);
    setPuzzle(responsePuzzle);
  };

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

  const wordsAreCloseEnough = (a, b) => {
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

  const wordExists = async (word) => {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    return res.ok;
  };

  const onSubmitWord = async () => {
    const sanitizedInputWord = inputWord?.trim().toLocaleLowerCase();
    if (!(sanitizedInputWord?.length)) {
      alert("No word entered");
      return;
    }

    if (!ALPHA_REGEX.test(sanitizedInputWord)) {
      alert("Please use A-Z only, please.");
      return;
    }

    if (sanitizedInputWord === puzzle.source_word || linkWords.includes(inputWord)) {
      alert("No word reuse");
      return;
    }

    const previousWord = linkWords.length
      ? linkWords[linkWords.length - 1] : puzzle.source_word;

    if (!wordsAreCloseEnough(previousWord, sanitizedInputWord)) {
      alert("Not close enough");
      return;
    }

    if (!(await wordExists(sanitizedInputWord))) {
      alert("Word doesn't exist");
      return;
    }

    setLinkWords(l => {
      const a = [...l];
      a.push(inputWord);
      setInputWord('');
      if (inputWord === puzzle.destination_word) {
        setGameFinished(true);
      }
      return a;
    });
  }

  return (<div className='container-fluid app-container'>
    <h1 className="display-5 my-3 text-center">⛓️ Chain Letters 🔡</h1>
    <p className="lead text-center">
      <span>&#x2014;</span>
      <span className="mx-3">{dateString}</span>
      <span>&#x2014;</span>
    </p>
    <div className="card my-3">
      <ul className="list-group list-group-flush">
        <li className="list-group-item bg-primary text-light">
          <span class="word-box">{puzzle.source_word}
            &nbsp;<i class="fa-solid fa-arrow-right"></i>&nbsp;
            {puzzle.destination_word}
          </span>
        </li>
        {linkWords.map((linkWord, index) => {
          let liClassName = "list-group-item p-1";
          let indexClassName = "badge me-2";
          if (gameFinished && index === linkWords.length - 1) {
            liClassName += " bg-success text-light";
            indexClassName += " text-bg-light";
          } else {
            indexClassName += " text-bg-secondary";
          }

          return (
            <li key={linkWord} className={liClassName}>
              <span class={indexClassName}>{index + 1}</span>
              <span class="word-box">{linkWord}</span>
            </li>
          );
        })}
        {(gameFinished ? (<></>) : <li className="list-group-item p-0 border-0">
          <div className="input-group">
            <input
              type="text"
              class="form-control m-0 border-0"
              value={inputWord}
              placeholder="Next word..."
              onKeyUp={(e) => { if (e.code === 'Enter') { onSubmitWord(); } }}
              onChange={(e) => { setInputWord(e.target.value) }}
            />
            <button
              type="button"
              className="btn btn-info border-0"
              style={{ borderRadius: 0 }}
              onClick={onSubmitWord}>Add</button>
          </div>
        </li>)}
      </ul>
    </div>
  </div >);
};

export default App;