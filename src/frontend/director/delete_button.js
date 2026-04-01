export function DeleteButton({ onClick }) {
  return <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" style={{ borderColor: 'rgba(220,60,60,0.35)', color: '#ff8a8a', background: 'rgba(220,60,60,0.08)' }} onClick={onClick}>Delete</button>;
}