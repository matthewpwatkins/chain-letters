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
import { defineWord, wordsAreCloseEnough } from './WordJudge';
// https://fontawesome.com/docs/web/use-with/react/add-icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { convertDateToPuzzleId } from './PuzzleIdUtility';
import { getCurrentVersion } from './VersionManager';
import { Alert } from 'react-bootstrap';
import Confetti from 'react-confetti';

const ALPHA_REGEX = /^[a-z]+$/i;

const last = (arr) => arr[arr.length - 1];

const App = () => {
  // UI state elements
  const [version, setVersion] = useState(undefined);
  const [inputWord, setInputWord] = useState('');
  const [submittedWordDefinition, setSubmittedWordDefinition] = useState(undefined);
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
    const load = async () => {
      const mVersion = await getCurrentVersion();
      const pathComponents = window.location.pathname.split('/').filter(c => c?.trim()?.length);
      const pathPuzzleID = pathComponents.length ? parseInt(pathComponents[pathComponents.length - 1]) : undefined;
      const currentPuzzleID = convertDateToPuzzleId(new Date());
      const canSeeFuture = new URL(window.location).searchParams.has('future');
      const isRequestForFuture = pathPuzzleID && pathPuzzleID > currentPuzzleID;
      const puzzleID = pathPuzzleID && (!isRequestForFuture || canSeeFuture) ? pathPuzzleID : currentPuzzleID;

      const mUserPreferences = getUserPreferences();
      const mUserPuzzle = await getUserPuzzle(puzzleID);
      const mActiveLevel = mUserPuzzle.attempt.last_attempted_level || 'easy';
      const mActiveLevelDefinition = mUserPuzzle.definition[mActiveLevel];
      const mActiveLevelAttempt = mUserPuzzle.attempt[mActiveLevel] || {};
      mActiveLevelAttempt.link_words = mActiveLevelAttempt.link_words || [mActiveLevelDefinition.source_word];

      setVersion(mVersion);
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

      const definitions = await defineWord(sanitizedInputWord);
      if (!(definitions)) {
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
        console.log(definitions);
        setSubmittedWordDefinition(definitions[0]);
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
    setSubmittedWordDefinition(undefined);
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
    let longURL = `${window.location.origin}/solution?id=${userPuzzle.definition.id}&words=`;
    let isFirst = true;
    for (const linkWord of activeLevelAttemptLinkWords) {
      if (!isFirst) {
        longURL += ',';
      }
      longURL += `${linkWord}`;
      isFirst = false;
    }

    console.log('Long URL', longURL);
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
    const text = `#chainletters puzzle #${userPuzzle.definition.id}`
      + `\nI turned ${activeLevelDefinition.source_word.toUpperCase()} into ${activeLevelDefinition.destination_word.toUpperCase()}`
      + `\nin ${getEmojiNumber(activeLevelAttemptLinkWords.length)} moves`
      + (activeLevelAttemptLinkWords.length <= activeLevelDefinition.best_path.length ? ", a perfect score!"
        : `.\nCan you get a perfect score of ${activeLevelDefinition.best_path.length}?`);

    navigator.clipboard.writeText(text + `\n${link}`);
    let shared = false;
    if (navigator.userAgent.indexOf("Win") === -1 && navigator.canShare) {
      try {
        await navigator.share({
          url: link,
          text: text
        });
        shared = true;
      } catch (err) { }
    }

    if (!shared) {
      alert(`I copied the message and link to your clipboard.`);
    }
  }

  const DefinitionRow = (props) => {
    return <ListGroup.Item variant="primary" className="d-flex">
      <div className="flex-grow-1 text-center">
        <span className="link-word">{props.sourceWord}</span>
        <FontAwesomeIcon icon={solid("arrow-right")} className="mx-2" />
        <span className="link-word">{props.destinationWord}</span>
      </div>
      <span style={{ cursor: "pointer" }} onClick={() => setShowHelpModal(true)}>
        <FontAwesomeIcon icon={solid("circle-question")} size="xl" className="text-info" />
      </span>
    </ListGroup.Item>;
  };

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

  const WinModal = (props) => {
    const isPerfect = props.chainLength <= activeLevelDefinition.best_path.length;
    const title = isPerfect ? "💯 PERFECT!" : "🎉 Good job!!";
    return <>
      {props.show && isPerfect ? <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={50}
        initialVelocityY={0}
        gravity={0.2}
        recycle={false}
      /> : <></>}
      <Modal show={props.show} centered onHide={() => setShowWinModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You chained <span className="link-word text-primary px-1">{props.sourceWord}</span>
            &rarr; <span className="link-word text-success px-1">{props.destinationWord}</span>
            {isPerfect ? "getting a perfect score of " : "using "}
            <strong>{props.chainLength}</strong> links{isPerfect ? '!' : '.'} Share your results with your friends!
          </p>
          <ShareButton />
          {isPerfect ? <></> : <>
            <p className="mt-2">
              Or give it another shot and see if you can get a perfect score of <strong>{activeLevelDefinition.best_path.length}</strong>:
            </p>
            <div className="d-grid gap-2">
              <Button variant="primary" size="lg" onClick={() => setShowWinModal(false)}>
                Try again
              </Button>
            </div>
          </>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWinModal(false)}>
            Back to game
          </Button>
        </Modal.Footer>
      </Modal>
    </>;
  };

  const HelpModal = (props) => <Modal show={props.show} fullscreen="sm-down" centered onHide={() => setShowHelpModal(false)}>
    <Modal.Header closeButton>
      <Modal.Title>
        <FontAwesomeIcon icon={solid("circle-question")} className="text-info me-1" />
        How to play
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>
        In Chain Letters, you build a chain of words from the starting word to the ending word,
        using as few links possible.
      </p>
      <p>Each link in the chain must be:</p>
      <p>
        <ol>
          <li>A valid English word</li>
          <li>Only one letter different from the word before.</li>
        </ol>
      </p>
      <p>
        To create a new word, you may do one of the following:
      </p>
      <ul className="list-unstyled">
        <li><FontAwesomeIcon icon={solid("plus-square")} className="text-primary me-1" /> Add a letter (CARE &rarr; <u>S</u>CARE)</li>
        <li><FontAwesomeIcon icon={solid("trash")} className="text-primary me-1" /> Remove a letter (CAR<u>E</u> &rarr; CAR)</li>
        <li><FontAwesomeIcon icon={solid("pen")} className="text-primary me-1" /> Replace a letter (C<u>A</u>RE &rarr; C<u>U</u>RE)</li>
        <li><FontAwesomeIcon icon={solid("arrow-right-long")} className="text-primary me-1" /> Move a letter (CARE<u>S</u> &rarr; <u>S</u>CARE)</li>
        <li><FontAwesomeIcon icon={solid("shuffle")} className="text-primary me-1" /> Swap two letters (<u>C</u>A<u>R</u>E &rarr; <u>R</u>A<u>C</u>E)</li>
        <li><FontAwesomeIcon icon={solid("right-left")} className="text-primary me-1" /> Reverse the word (ex. FREE &rarr; REEF)</li>
      </ul>
      <p>
        For example, to here's how you might convert the word "WRONG" to the word "RIGHT."
      </p>
      <p className="text-center">
        <Image fluid src="https://chainlettersgame.com/example.jpg" className="text-center" />
      </p>
      <p>The badge at the top shows you the difficulty level of the puzzle and the shortest number of links it can be solved using common words.</p>
      <p>
        Click the revert icon <FontAwesomeIcon icon={solid("clock-rotate-left")} className="text-primary mx-1" />
        to reset your work to that word and try again from there.
        You can access this guide any time by pressing the help
        <FontAwesomeIcon icon={solid("circle-question")} className="text-info mx-1" /> icon
      </p>
      <p>Good luck!</p>
      <p>-- Matthew</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="primary" onClick={() => setShowHelpModal(false)}>
        To the game!
      </Button>
    </Modal.Footer>
  </Modal>;

  const stripXml = (text) => {
    return text.replace(/<[^>]+>([^<]+)<\/[^>]+>/g, "$1")
  }

  const DefinitionCard = (props) => <Alert variant="info">
    <strong>{props.definition.word}</strong> {props.definition.partOfSpeech ? (<>({last(props.definition.partOfSpeech.split(' '))})</>) : (<></>)}
    <br />{stripXml(props.definition.text)}
    {props.definition.exampleUses?.length ? (<><br />Ex: <em>{stripXml(props.definition.exampleUses[0].text)}</em></>) : (<></>)}
  </Alert>

  return (userPuzzle ? (<>
    <Container fluid className='app-container'>
      <PuzzleHeader puzzleID={userPuzzle.definition.id} points={activeLevelDefinition.best_path.length} />
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

      {(submittedWordDefinition ? (<DefinitionCard definition={submittedWordDefinition}></DefinitionCard>) : <></>)}

      {(gameFinished ? (<ShareButton />) : <></>)}
    </Container>

    <Footer version={version} />

    <WinModal
      show={showWinModal}
      perfect={activeLevelAttemptLinkWords.length <= activeLevelDefinition.best_path.length}
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