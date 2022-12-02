import { useEffect, useState } from 'react';
import './App.css';
import { wordsAreCloseEnough, wordExists } from './WordJudge';

const ALPHA_REGEX = /^[a-z]+$/i;

const App = () => {
  const [inputWord, setInputWord] = useState('');
  const [linkWords, setLinkWords] = useState([]);
  const [puzzle, setPuzzle] = useState({});

  const load = () => {
    setPuzzle({
      sourceWord: 'out',
      destinationWord: 'side'
    });
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

    if (sanitizedInputWord === puzzle.sourceWord || linkWords.includes(inputWord)) {
      alert("No word reuse");
      return;
    }

    const previousWord = linkWords.length
      ? linkWords[linkWords.length - 1] : puzzle.sourceWord;

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
      if (inputWord === puzzle.destinationWord) {
        alert(`You won in ${a.length} turns!`);
      }
      return a;
    });
  }

  useEffect(() => {
    load();
  }, []);

  return (<>
    <h1>Chain Letters</h1>
    <div>
      <span>{puzzle.sourceWord}</span>
      &nbsp;&rarr;&nbsp;
      <span>{puzzle.destinationWord}</span>
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