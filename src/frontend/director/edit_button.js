export function EditButton({ onClick }) {
  return <button type="button" className="ms-btn-ghost ms-btn-ghost--sm" style={{ borderColor: 'rgba(212,175,55,0.28)', color: 'var(--ms-gold)', background: 'rgba(212,175,55,0.08)' }} onClick={onClick}>Edit</button>;
}
