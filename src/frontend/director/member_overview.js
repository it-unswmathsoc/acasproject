export default function MemberOverview({ active, onClick }) {
  return <button type="button" className={`ms-dash-tab ${active ? 'ms-dash-tab--active' : ''}`} onClick={onClick}>Members</button>;
}
