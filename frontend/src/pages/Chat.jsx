import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Send } from 'lucide-react';
import { clearTyping, fetchChatUsers, fetchMessages, markConversationRead, sendMessage, setActive } from '../store/chatSlice';
import { emitTyping } from '../socket';
import { timeOnly } from '../utils/format';

export default function Chat() {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const { users, activeId, messages, online, typing } = useSelector((s) => s.chat);
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const lastTyping = useRef(0);

  const active = users.find((u) => u.id === activeId);
  const thread = messages[activeId] || [];

  useEffect(() => {
    dispatch(fetchChatUsers());
    return () => dispatch(setActive(null));
  }, [dispatch]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length, activeId]);

  useEffect(() => {
    const last = thread[thread.length - 1];
    if (activeId && last && last.sender_id !== me.id) dispatch(markConversationRead(activeId));
  }, [thread.length, activeId, me.id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => dispatch(clearTyping()), 2000);
    return () => clearTimeout(t);
  }, [typing, dispatch]);

  const open = (id) => {
    dispatch(setActive(id));
    dispatch(fetchMessages(id));
  };

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    dispatch(sendMessage({ userId: activeId, body }));
  };

  const onType = (e) => {
    setText(e.target.value);
    if (Date.now() - lastTyping.current > 1500) {
      lastTyping.current = Date.now();
      emitTyping(activeId);
    }
  };

  return (
    <div className="panel flex h-[calc(100vh-8.5rem)] min-h-[420px] overflow-hidden">
      {/* People */}
      <aside className={`w-full shrink-0 border-r border-rule md:block md:w-72 ${activeId ? 'hidden' : 'block'}`}>
        <div className="border-b border-rule px-4 py-3 font-semibold">People</div>
        <ul className="h-[calc(100%-49px)] overflow-y-auto">
          {users.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No other users yet.</li>}
          {users.map((u) => (
            <li key={u.id}>
              <button onClick={() => open(u.id)}
                className={`flex w-full items-center gap-3 border-b border-rule px-4 py-3 text-left hover:bg-paper ${u.id === activeId ? 'bg-ledger-tint/50' : ''}`}>
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
                  {u.name[0]}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${online.includes(u.id) ? 'bg-ledger' : 'bg-slate-300'}`}
                    title={online.includes(u.id) ? 'Online' : 'Offline'} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{u.name}</span>
                  <span className="block text-xs text-slate-500">{u.role}</span>
                </span>
                {u.unread > 0 && <span className="rounded-full bg-ledger px-2 text-xs font-medium text-white">{u.unread}</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Conversation */}
      <section className={`min-w-0 flex-1 flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-500">
            Pick someone from the list to start a conversation.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
              <button className="rounded-md p-1 hover:bg-paper md:hidden" onClick={() => dispatch(setActive(null))} aria-label="Back to people">
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-sm font-semibold">{active.name}</p>
                <p className="text-xs text-slate-500">
                  {typing === active.id ? 'Typing…' : online.includes(active.id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-paper px-4 py-4">
              {thread.length === 0 && <p className="pt-8 text-center text-sm text-slate-500">No messages yet. Say hello.</p>}
              {thread.map((m) => {
                const mine = m.sender_id === me.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-ledger text-white' : 'border border-rule bg-white'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-right text-[11px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>{timeOnly(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-rule p-3">
              <input className="field" placeholder={`Message ${active.name}`} value={text} onChange={onType} aria-label="Message" />
              <button className="btn-primary" disabled={!text.trim()}><Send size={16} />Send</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
