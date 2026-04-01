export default function CurrentQuestion({ title, content }) {
  return (
    <div className="ms-post-card" style={{ marginBottom: '12px' }}>
      <h3 className="ms-post-card__title">{title}</h3>
      <p className="ms-post-card__body">{content}</p>
    </div>
  );
}
