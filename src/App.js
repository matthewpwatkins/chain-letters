import { useEffect, useState } from 'react';
import './App.css';

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
    setLinkWords(l => {
      const a = [...l];
      a.push(inputWord);
      return a;
    });
    setInputWord('');
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