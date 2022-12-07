import { useEffect, useState } from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image'
import Nav from 'react-bootstrap/Nav';
import Modal from 'react-bootstrap/Modal';
import { getUserPuzzle, storeUserPuzzle, getUserPreferences, storeUserPreferences } from './StorageManager';
import { wordExists, wordsAreCloseEnough } from './WordJudge';
// https://fontawesome.com/docs/web/use-with/react/add-icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';

const ALPHA_REGEX = /^[a-z]+$/i;

const App = () => {
  // UI state elements
  const [inputWord, setInputWord] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [addWordMessage, setAddWordMessage] = useState(undefined);
  const [addWordInProgress, setAddWordInProgress] = useState(false);

  // Core data element
  const [userPuzzle, setUserPuzzle] = useState('');

  // TODO: all these are copmuted properties of the user puzzle itself. Can I eliminate them?
  const [activeLevel, setActiveLevel] = useState('easy');
  const [activeLevelDefinition, setActiveLevelDefinition] = useState({});
  const [activeLevelAttemptLinkWords, setActiveLevelAttemptLinkWords] = useState([]);

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
      const mUserPreferences = getUserPreferences();
      const mUserPuzzle = await getUserPuzzle(getShortDateString(new Date()));
      const mActiveLevel = mUserPuzzle.attempt.last_attempted_level || 'easy';
      const mActiveLevelDefinition = mUserPuzzle.definition[mActiveLevel];
      const mActiveLevelAttempt = mUserPuzzle.attempt[mActiveLevel] || {};
      mActiveLevelAttempt.link_words = mActiveLevelAttempt.link_words || [];

      setUserPuzzle(mUserPuzzle);
      setActiveLevel(mActiveLevel);
      setActiveLevelDefinition(mActiveLevelDefinition);
      setActiveLevelAttemptLinkWords(mActiveLevelAttempt.link_words);
      setGameFinished(mActiveLevelAttempt.link_words.length && mActiveLevelAttempt.link_words[mActiveLevelAttempt.link_words.length - 1] === mActiveLevelDefinition.destination_word)
      if (mUserPreferences.new_player) {
        setShowHelpModal(true);
        mUserPreferences.new_player = false;
        storeUserPreferences(mUserPreferences);
      }
    };
    load();
  }, []);

  const submitWord = async () => {
    const addWord = async () => {
      const sanitizedInputWord = inputWord?.trim().toLocaleLowerCase();
      if (!(sanitizedInputWord?.length)) {
        return;
      }

      if (!ALPHA_REGEX.test(sanitizedInputWord)) {
        setAddWordMessage("Only letters A-Z allowed");
        return;
      }

      if (sanitizedInputWord === activeLevelDefinition.source_word || activeLevelAttemptLinkWords.includes(sanitizedInputWord)) {
        setAddWordMessage("That word has already been used in the puzzle");
        return;
      }

      const previousWord = activeLevelAttemptLinkWords.length
        ? activeLevelAttemptLinkWords[activeLevelAttemptLinkWords.length - 1] : activeLevelDefinition.source_word;

      if (!wordsAreCloseEnough(previousWord, sanitizedInputWord)) {
        setAddWordMessage("That word is not close enough the previous word. Take a look at the rules again.");
        return;
      }

      if (!(await wordExists(sanitizedInputWord))) {
        setAddWordMessage("That word doesn't exist in the game dictionary.");
        return;
      }

      setActiveLevelAttemptLinkWords(w => {
        w.push(sanitizedInputWord);
        setUserPuzzle(up => {
          up.attempt[activeLevel] = {
            link_words: w
          };
          storeUserPuzzle(up);
          return up;
        });
        setInputWord("");
        if (sanitizedInputWord === activeLevelDefinition.destination_word) {
          setGameFinished(true);
          setShowWinModal(true);
        }
        setAddWordMessage(undefined);
        return w;
      });
    }

    setAddWordInProgress(true);
    try {
      await addWord();
    } finally {
      setAddWordInProgress(false);
    }
  }

  const revert = (index) => {
    setActiveLevelAttemptLinkWords(w => {
      w = w.slice(0, index);
      setUserPuzzle(up => {
        up.attempt[activeLevel] = {
          link_words: w
        };
        storeUserPuzzle(up);
        return up;
      });
      setInputWord("");
      setAddWordMessage(undefined);
      setGameFinished(false);
      return w;
    })
  }

  const share = async () => {
    try {
      await navigator.share({
        title: '⛓️ Chain Letters 🔡',
        url: window.location,
        text: `⛓️ Chain Letters 🔡\n${userPuzzle.definition.id}\n${activeLevelDefinition.source_word}=>${activeLevelDefinition.destination_word}\n\n${activeLevelAttemptLinkWords.length} links`
      });
    } catch (err) {
      console.error(err);
      alert('Your browser doesn\'t support sharing. Screenshot, I guess?');
    }
  }

  const PuzzleHeader = (props) => <>
    <h1 className="display-5 my-3 text-center">
      <Image src="https://watkins.dev/chainletters/android-chrome-192x192.png" className="me-3" style={{
        maxHeight: "2.5rem",
        marginTop: "-.5rem"
      }} />
      Chain Letters
    </h1>
    <p className="lead text-center">
      <span>&#x2014;</span>
      <span className="mx-3">{props.puzzleID}</span>
      <span>&#x2014;</span>
    </p>
  </>;

  const DefinitionRow = (props) => <ListGroup.Item variant="primary" className="d-flex">
    <div className="flex-grow-1 text-center">
      <span className="link-word">{props.sourceWord}</span>
      <FontAwesomeIcon icon={solid("arrow-right")} className="mx-2" />
      <span className="link-word">{props.destinationWord}</span>
    </div>
    <span className="ms-auto me-2" style={{ cursor: "pointer" }} onClick={() => setShowHelpModal(true)}>
      <FontAwesomeIcon icon={solid("circle-question")} />
    </span>
  </ListGroup.Item >;

  const LinkWordRow = (props) => <ListGroup.Item variant={props.isWinningWord ? "success" : ""} className="d-flex">
    <div className="me-2 text-secondary"><strong>{props.index + 1}</strong></div>
    <div className="link-word">{props.word}</div>
    <Button
      variant="warning"
      size="sm"
      className="ms-auto"
      onClick={() => revert(props.index)}
    >
      <FontAwesomeIcon icon={solid("clock-rotate-left")} />
    </Button>
  </ListGroup.Item>;

  const AddWordButton = (props) => <Button
    variant="primary"
    disabled={props.spinning}
    size="sm"
    className="ms-auto"
    onClick={submitWord}
  >
    {(props.spinning ? <>
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
      />
      <span className="visually-hidden">&hellip;</span>
    </> : <FontAwesomeIcon icon={solid("plus")} />)}
  </Button>;

  const ShareButton = () => <div className="d-grid gap-2">
    <Button variant="success" size="lg" onClick={share}>
      <FontAwesomeIcon icon={solid("share-nodes")} /> Share
    </Button>
  </div>

  const Footer = () => <Container fluid className="app-container footer py-2 mt-auto">
    <Nav fill>
      <Nav.Item>
        <Nav.Link href="https://watkins.dev" target="_blank">
          <FontAwesomeIcon icon={solid("user")} className="me-1" /> About
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link href="https://paypal.me/watkinsmatthewp" target="_blank">
          <FontAwesomeIcon icon={solid("hand-holding-dollar")} className="me-1" /> Donate
        </Nav.Link>
      </Nav.Item>
    </Nav>
  </Container>;

  const WinModal = (props) => <Modal show={props.show} fullscreen="sm-down" centered onHide={() => setShowWinModal(false)}>
    <Modal.Header closeButton>
      <Modal.Title>🎉 You won!</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>
        You chained <span className="link-word text-primary px-1">{props.sourceWord}</span>
        &rarr; <span className="link-word text-success px-1">{props.destinationWord}</span>
        using <strong>{props.chainLength}</strong> links.
      </p>
      {(navigator.canShare ? (<>
        <p>Share your results with your friends!</p>
        <ShareButton />
      </>) : (<></>))}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowWinModal(false)}>
        Back to game
      </Button>
    </Modal.Footer>
  </Modal>;

  const HelpModal = (props) => <Modal show={props.show} fullscreen="sm-down" centered onHide={() => setShowHelpModal(false)}>
    <Modal.Header closeButton>
      <Modal.Title><FontAwesomeIcon icon={solid("circle-question")} className="text-primary" /> How to play</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>
        Chain Letters is a word game where the goal is to build a chain of words from the starting word to the ending word,
        using as few links possible. Each link in the chain must be:
      </p>
      <p>
        <ol>
          <li>A valid English word</li>
          <li>Only one letter different from the word before.</li>
        </ol>
      </p>
      <p>
        To create a new word, you may do one of the following:
      </p>
      <p>
        <ul>
          <li>Remove a letter (ex. SLIT &rarr; SIT)</li>
          <li>Add a letter (ex. SIT &rarr; SITE)</li>
          <li>Replace a letter (ex. SITE &rarr; MITE)</li>
          <li>Swap two letters (ex. swap M and I, MITE &rarr; TIME)</li>
          <li>Move the first letter to the end (ex. GRIN &rarr; RING)</li>
          <li>Move the last letter to the front (ex. KISS &rarr; SKIS)</li>
        </ul>
      </p>
      <p>
        For example, to here's how you might convert the word "WRONG" to the word "RIGHT."
      </p>
      <p className="text-center">
        <Image fluid src="https://watkins.dev/chainletters/example.jpg" className="text-center" />
      </p>
      <p>
        Click the revert icon to reset your work to right before that word any time you want to go back.
        You can access this guide any time by pressing the help (?) icon
      </p>
      <p>Good luck!</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="primary" onClick={() => setShowHelpModal(false)}>
        To the game!
      </Button>
    </Modal.Footer>
  </Modal>;

  return (userPuzzle ? (<>
    <Container fluid className='app-container'>
      <PuzzleHeader puzzleID={userPuzzle.definition.id} />
      <Card border="primary" className="my-3">
        <ListGroup variant="flush">
          <DefinitionRow
            sourceWord={activeLevelDefinition.source_word}
            destinationWord={activeLevelDefinition.destination_word}
          />
          {activeLevelAttemptLinkWords.map((linkWord, index) => <LinkWordRow
            key={linkWord}
            index={index}
            word={linkWord}
            isWinningWord={gameFinished && index === activeLevelAttemptLinkWords.length - 1}
          />)}
          {(gameFinished ? (<></>) :
            <ListGroup.Item>
              <div className="d-flex gap-2">
                <Form.Control
                  className="m-0"
                  value={inputWord}
                  placeholder="Next word..."
                  onKeyUp={(e) => { if (e.code === 'Enter') { submitWord(); } }}
                  onChange={(e) => { setInputWord(e.target.value) }}
                />
                <AddWordButton spinning={addWordInProgress} />
              </div>
              {(addWordMessage ? <p className="mt-3 text-danger">
                <strong>{addWordMessage}</strong>
              </p> : <></>)}
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card>

      {(gameFinished ? (<ShareButton />) : <></>)}
    </Container>

    <Footer />

    <WinModal
      show={showWinModal}
      sourceWord={activeLevelDefinition.source_word}
      destinationWord={activeLevelDefinition.destination_word}
      chainLength={activeLevelAttemptLinkWords.length}
    />
    <HelpModal
      show={showHelpModal}
      sourceWord={activeLevelDefinition.source_word}
      destinationWord={activeLevelDefinition.destination_word}
      chainLength={activeLevelAttemptLinkWords.length}
    />
  </>) : (<></>));
};

export default App;