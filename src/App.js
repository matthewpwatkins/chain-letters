import { useEffect, useState } from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Modal from 'react-bootstrap/Modal';
import { Footer } from './Footer';
import { PuzzleHeader } from './PuzzleHeader';
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
      mActiveLevelAttempt.link_words = mActiveLevelAttempt.link_words || [mActiveLevelDefinition.source_word];

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

  const resetTo = (index) => {
    setActiveLevelAttemptLinkWords(w => {
      w = w.slice(0, index + 1);
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

  const getEmojiDigit = (digit) => {
    switch (digit + '') {
      case '0':
        return '0️⃣';
      case '1':
        return '1️⃣'
      case '2':
        return '2️⃣';
      case '3':
        return '3️⃣';
      case '4':
        return '4️⃣';
      case '5':
        return '5️⃣';
      case '6':
        return '6️⃣';
      case '7':
        return '7️⃣';
      case '8':
        return '8️⃣';
      case '9':
        return '9️⃣';
      default:
        throw new Error("Can't get an emoji digit for " + digit);
    }
  }

  const getEmojiNumber = (number) => {
    let result = '';
    const numberString = '' + number;
    for (let i = 0; i < numberString.length; i++) {
      result += getEmojiDigit(numberString[i]);
    }
    return result;
  }

  const generateSolutionUrl = async () => {
    let longURL = `https://chainlettersgame.com/solution?id=${userPuzzle.definition.id}&words=${activeLevelDefinition.source_word}`;
    for (const linkWord of activeLevelAttemptLinkWords) {
      longURL += `,${linkWord}`;
    }

    const encodedParams = new URLSearchParams();
    encodedParams.append("url", longURL);

    const options = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': 'c02613d5a5msh726328d982e08f2p137f50jsn3b6a0ebeb75c',
        'X-RapidAPI-Host': 'url-shortener-service.p.rapidapi.com'
      },
      body: encodedParams
    };

    const shortenerRes = await fetch('https://url-shortener-service.p.rapidapi.com/shorten', options);
    const res = await shortenerRes.json();
    return res.result_url;
  }

  const share = async () => {
    const link = await generateSolutionUrl();
    let text = `Chain Letters \n${userPuzzle.definition.id}`;
    text += `\n${activeLevelDefinition.source_word.toUpperCase()} => ${activeLevelDefinition.destination_word.toUpperCase()}`;
    text += `\n🔗 ${getEmojiNumber(activeLevelAttemptLinkWords.length)} links`;

    try {
      await navigator.clipboard.writeText(text);
      await navigator.share({
        url: link,
        text: text
      });
    } catch (err) {
      console.error(err);
      alert('Your browser doesn\'t support sharing. Screenshot, I guess?');
    }
  }

  const DefinitionRow = (props) => <ListGroup.Item variant="primary" className="d-flex">
    <div className="flex-grow-1 text-center">
      <span className="link-word">{props.sourceWord}</span>
      <FontAwesomeIcon icon={solid("arrow-right")} className="mx-2" />
      <span className="link-word">{props.destinationWord}</span>
    </div>
    <span className="ms-auto me-2" style={{ cursor: "pointer" }} onClick={() => setShowHelpModal(true)}>
      <FontAwesomeIcon icon={solid("circle-question")} size="xl" className="text-info" />
    </span>
  </ListGroup.Item >;

  const LinkWordRow = (props) => <ListGroup.Item variant={props.variant} className="d-flex">
    <div className="me-2 text-secondary"><strong>{props.index + 1}</strong></div>
    <div className="link-word">{props.word}</div>
    {props.hasNextWord ? <Button
      variant="warning"
      size="sm"
      className="ms-auto"
      onClick={() => resetTo(props.index)}
    >
      <FontAwesomeIcon icon={solid("clock-rotate-left")} />
    </Button> : <></>}
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
          <li>Reverse the word (ex. FREE &rarr; REEF)</li>
        </ul>
      </p>
      <p>
        For example, to here's how you might convert the word "WRONG" to the word "RIGHT."
      </p>
      <p className="text-center">
        <Image fluid src="https://chainlettersgame.com/example.jpg" className="text-center" />
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
            hasNextWord={index !== activeLevelAttemptLinkWords.length - 1}
            word={linkWord}
            variant={gameFinished && index === activeLevelAttemptLinkWords.length - 1 ? "success" : ""}
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