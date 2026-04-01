export default function PuzzlesButton({ active, onClick }) {
  return <button type="button" className={`ms-chip ${active ? 'ms-chip--active' : ''}`} onClick={onClick}>Puzzles</button>;
}
