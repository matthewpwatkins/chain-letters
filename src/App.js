import { useEffect, useState } from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

const ALPHA_REGEX = /^[a-z]+$/i;

const App = () => {
  const [dateString, setDateString] = useState('');
  const [inputWord, setInputWord] = useState('');
  const [linkWords, setLinkWords] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [puzzle, setPuzzle] = useState({});
  const [showWinModal, setShowWinModal] = useState(false);

  useEffect(() => {
    const lPadZeroNumber = (number, length) => {
      return (number + "").padStart(length, "0");
    };

    const getShortDateString = (date) => {
      const year = lPadZeroNumber(date.getFullYear(), 4);
      const month = lPadZeroNumber(date.getMonth() + 1, 2);
      const dayOfMonth = lPadZeroNumber(date.getDate(), 2);
      return `${year}-${month}-${dayOfMonth}`;
    };

    const load = async () => {
      const newDateString = getShortDateString(new Date());
      setDateString(newDateString);
      const puzzlePath = `./puzzles/${newDateString}.json`;
      const res = await fetch(puzzlePath);
      const responsePuzzle = await res.json();
      setPuzzle(responsePuzzle);
    };
    load();
  }, []);

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

  const submitWord = async () => {
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
        setShowWinModal(true);
      }
      return a;
    });
  }

  const resetTo = (index) => {
    setLinkWords((prev) => prev.slice(0, index));
    setGameFinished(false);
  }

  const share = async () => {
    try {
      await navigator.share({
        title: '⛓️ Chain Letters 🔡',
        url: window.location,
        text: `⛓️ Chain Letters 🔡\n${dateString}\n${puzzle.source_word}=>${puzzle.destination_word}\n\n${linkWords.length} links`
      });
    } catch (err) {
      console.error(err);
      alert('Your browser doesn\'t support sharing. Screenshot, I guess?');
    }
  }

  return (<Container fluid className='app-container'>
    <h1 className="display-5 my-3 text-center">⛓️ Chain Letters 🔡</h1>
    <p className="lead text-center">
      <span>&#x2014;</span>
      <span className="mx-3">{dateString}</span>
      <span>&#x2014;</span>
    </p>
    <Card border="primary" className="my-3">
      <ListGroup variant="flush">
        <ListGroup.Item variant="primary" className="text-center">
          <span className="link-word">{puzzle.source_word}
            &nbsp;<i className="fa-solid fa-arrow-right"></i>&nbsp;
            {puzzle.destination_word}
          </span>
        </ListGroup.Item>
        {linkWords.map((linkWord, index) => {
          const isWinningWord = (gameFinished && index === linkWords.length - 1);
          return (
            <ListGroup.Item key={linkWord} variant={isWinningWord ? "success" : ""} className="d-flex">
              <div className="me-2 text-secondary"><strong>{index + 1}</strong></div>
              <div className="link-word">{linkWord}</div>
              <Button
                variant="warning"
                size="sm"
                className="ms-auto"
                onClick={() => resetTo(index)}
              ><i className="fa-solid fa-clock-rotate-left"></i></Button>
            </ListGroup.Item>
          );
        })}
        {(gameFinished ? (<></>) :
          <ListGroup.Item className="d-flex">
            <Form.Control
              className="m-0 border-0"
              value={inputWord}
              placeholder="Next word..."
              onKeyUp={(e) => { if (e.code === 'Enter') { submitWord(); } }}
              onChange={(e) => { setInputWord(e.target.value) }}
            />
            <Button
              variant="primary"
              size="sm"
              className="ms-auto"
              onClick={submitWord}
            ><i className="fa-solid fa-plus"></i></Button>
          </ListGroup.Item>
        )}
      </ListGroup>
    </Card>

    {(gameFinished ? (<div className="d-grid gap-2">
      <Button variant="success" size="lg" onClick={share}>
        <i className="fa-solid fa-share-nodes"></i> Share
      </Button>
    </div>) : (<></>))}

    <Modal show={showWinModal} fullscreen="sm-down" centered onHide={() => setShowWinModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>🎉 You won!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          You chained <span className="link-word text-primary px-1">{puzzle.source_word}</span>
          &rarr; <span className="link-word text-success px-1">{puzzle.destination_word}</span>
          using <strong>{linkWords.length}</strong> links.
        </p>
        {(navigator.canShare ? (<>
          <p>Share your results with your friends!</p>
          <div className="d-grid gap-2">
            <Button variant="success" size="lg" onClick={share}>
              <i className="fa-solid fa-share-nodes"></i> Share
            </Button>
          </div>
        </>) : (<></>))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowWinModal(false)}>
          Back to game
        </Button>
      </Modal.Footer>
    </Modal>
  </Container>);
};

export default App;