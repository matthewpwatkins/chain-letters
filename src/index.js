import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import SolutionApp from './SolutionApp';
import 'bootstrap/dist/css/bootstrap.min.css';

const container = document.getElementById("root");
const root = createRoot(container);

// TODO: use react router
if (window.location.pathname.endsWith('/solution')) {
  const url = new URL(window.location);
  const puzzleID = url.searchParams.get('id');
  const linkWords = url.searchParams.get('words').split(',');

  root.render(<SolutionApp
    puzzleID={puzzleID}
    linkWords={linkWords}
  />);
} else {
  root.render(<App />);
}
