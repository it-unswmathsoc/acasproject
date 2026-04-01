export default function NewPostButton({ onClick }) {
  return <button type="button" className="ms-btn-secondary" style={{ padding: '12px 22px', letterSpacing: '0.2em' }} onClick={onClick}>+ New Post</button>;
}
