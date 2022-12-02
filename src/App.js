import { useEffect, useState } from 'react';
import './App.css';
import { wordsAreCloseEnough, wordExists } from './WordJudge';

const ALPHA_REGEX = /^[a-z]+$/i;

const App = () => {
  const [inputWord, setInputWord] = useState('');
  const [linkWords, setLinkWords] = useState([]);
  const [puzzle, setPuzzle] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const puzzlePath = `${process.env.PUBLIC_URL}/puzzles/${new Date().toISOString().substring(0, 10)}.json`;
    const res = await fetch(puzzlePath);
    const responsePuzzle = await res.json();
    console.group(responsePuzzle);
    setPuzzle(responsePuzzle);
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
        alert(`You won in ${a.length} turns!`);
      }
      return a;
    });
  }

  return (<>
    <h1>Chain Letters</h1>
    <div>
      <span>{puzzle.source_word}</span>
      &nbsp;&rarr;&nbsp;
      <span>{puzzle.destination_word}</span>
    </div>
    <div>
      {linkWords.map(linkWord => (
        <p key={linkWord}>{linkWord}</p>
      ))}
    </div>
    <div>
      <input
        placholder="Search for movies"
        value={inputWord}
        onChange={(e) => { setInputWord(e.target.value) }}
      />
    </div>
    <button onClick={onSubmitWord}>Add</button>
  </>);
};

export default App;