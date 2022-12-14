import './App.css';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { PuzzleHeader } from './PuzzleHeader';
import { Footer } from './Footer';
// https://fontawesome.com/docs/web/use-with/react/add-icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';

const SolutionApp = (props) => {
  // TODO: rename / move these components and dedupe
  const DefinitionRow = (props) => <ListGroup.Item variant="primary">
    <div className="text-center">
      <span className="link-word">{props.sourceWord}</span>
      <FontAwesomeIcon icon={solid("arrow-right")} className="mx-2" />
      <span className="link-word">{props.destinationWord}</span>
    </div>
  </ListGroup.Item>;

  const LinkWordRow = (props) => <ListGroup.Item variant={props.variant} className="d-flex">
    <div className="me-2 text-secondary"><strong>{props.index + 1}</strong></div>
    <div className="link-word">{props.word}</div>
  </ListGroup.Item>;

  return <><Container fluid className='app-container'>
    <PuzzleHeader puzzleID={props.puzzleID} />
    <Card border="primary" className="my-3">
      <ListGroup variant="flush">
        <DefinitionRow
          sourceWord={props.linkWords[0]}
          destinationWord={props.linkWords[props.linkWords.length - 1]}
        />
        {props.linkWords.map((linkWord, index) => <LinkWordRow
          key={linkWord}
          index={index}
          hasNextWord={index !== props.linkWords.length - 1}
          word={linkWord}
          variant={index === props.linkWords.length - 1 ? "success" : ""}
        />)}
      </ListGroup>
    </Card>
  </Container>
    <Footer /></>
};

export default SolutionApp;