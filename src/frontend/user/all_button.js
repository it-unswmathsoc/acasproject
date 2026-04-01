export default function AllButton({ active, onClick }) {
  return <button type="button" className={`ms-chip ${active ? 'ms-chip--active' : ''}`} onClick={onClick}>All</button>;
}
