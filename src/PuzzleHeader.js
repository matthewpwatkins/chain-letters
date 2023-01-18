import { Badge } from 'react-bootstrap';
import Image from 'react-bootstrap/Image';
import { convertPuzzleIdToDate } from './PuzzleIdUtility';

const formatPuzzleDate = (date) => {
  const dateComponents = date.toDateString().split(' ');
  return `${dateComponents[1]} ${dateComponents[2]}, ${dateComponents[3]}`;
};

export const PuzzleHeader = (props) => {
  const difficulty = props.points >= 16 ? "insane" : (props.points >= 12 ? 'hard' : (props.points >= 8 ? 'medium' : 'easy'));
  const bgClass = props.points >= 12 ? 'danger' : (props.points >= 8 ? 'warning' : 'success');
  const detailsClassName = `lead${props.points ? " d-flex me-auto" : ""}`;
  const textClassName = props.points ? "me-auto" : "";
  return <>
    <h1 className="display-5 my-3 text-center">
      <a className='remove-decoration' href="/">
        <Image src="https://chainlettersgame.com/android-chrome-192x192.png" className="me-3" style={{
          maxHeight: "2.5rem",
          marginTop: "-.5rem"
        }} />
        Chain Letters
      </a>
    </h1>
    <div className={detailsClassName}>
      <div className={textClassName}>
        <span>#{props.puzzleID}</span>
        <span className="mx-1">&#x2022;</span>
        <span>{formatPuzzleDate(convertPuzzleIdToDate(props.puzzleID))}</span>
      </div>
      {props.points ? <Badge bg={bgClass} text="light" className="text-uppercase">{difficulty} &#x2022; {props.points}</Badge> : <></>}
    </div>
  </>;
};