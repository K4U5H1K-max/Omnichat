export default function Sidebar({ sessions, onNew, onPick, currentId }) {
  return (
    <aside className="sidebar">
      <button onClick={onNew}>+ New Chat</button>
      <ul>
        {sessions.map(s => (
          <li key={s.id}>
            <button className={s.id===currentId?'active':''} onClick={()=>onPick(s.id)}>
              {s.title || 'Untitled'}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
