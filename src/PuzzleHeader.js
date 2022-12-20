import Image from 'react-bootstrap/Image';

export const PuzzleHeader = (props) => <>
  <h1 className="display-5 my-3 text-center">
    <a className='remove-decoration' href="/">
      <Image src="https://chainlettersgame.com/android-chrome-192x192.png" className="me-3" style={{
        maxHeight: "2.5rem",
        marginTop: "-.5rem"
      }} />
      Chain Letters
    </a>
  </h1>
  <p className="lead text-center">
    <span>&#x2014;</span>
    <span className="mx-3">#{props.puzzleID}</span>
    <span>&#x2014;</span>
  </p>
</>;