export default function FactsButton({ active, onClick }) {
  return <button type="button" className={`ms-chip ${active ? 'ms-chip--active' : ''}`} onClick={onClick}>Facts</button>;
}
