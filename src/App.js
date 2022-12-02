import { useEffect, useState } from 'react';
import './App.css';
import wordsAreCloseEnough from './WordJudge';

const App = () => {
  const [inputWord, setInputWord] = useState('');
  const [linkWords, setLinkWords] = useState([]);
  const [puzzle, setPuzzle] = useState({});

  const load = () => {
    setPuzzle({
      sourceWord: 'please',
      destinationWord: 'thank'
    });
  };

  const onSubmitWord = () => {
    const sanitizedInputWord = inputWord?.trim().toLocaleLowerCase();
    if (sanitizedInputWord?.length) {
      const previousWord = linkWords.length
        ? linkWords[linkWords.length - 1] : puzzle.sourceWord;
      if (wordsAreCloseEnough(previousWord, sanitizedInputWord)) {
        setLinkWords(l => {
          const a = [...l];
          a.push(inputWord);
          return a;
        });
        setInputWord('');
        return;
      }
    }
    alert('No bueno, señor');
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