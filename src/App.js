import { useEffect, useState } from 'react';
import './App.css';
import { wordsAreCloseEnough, wordExists } from './WordJudge';

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
    <h1 className="display-5 mb-4 text-center">⛓️ Chain Letters 🔡</h1>
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