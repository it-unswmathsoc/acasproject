export default function DirectorPuzzles({ active, onClick }) {
  return <button type="button" className={`ms-dash-tab ${active ? 'ms-dash-tab--active' : ''}`} onClick={onClick}>Posts & Puzzles</button>;
}
