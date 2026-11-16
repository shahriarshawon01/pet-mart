import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Inbox, ArrowUpRight, ArrowDownLeft, Send, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AccountLayout } from '../components/layout/AccountLayout';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { formatDate, formatRelativeTime, initials } from '../lib/format';

const MAX_REPLY = 1000;

/** One conversation: a listing + the other person. Reply goes to them (POST /inquiries/{id}/reply). */
function Conversation({ convo, onReplied, onRead }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const last = convo.messages[convo.messages.length - 1];
  const inputId = `reply-${convo.key.replace(/[^a-z0-9]/gi, '-')}`;

  const send = async (e) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text) {
      toast.error('Write a message first.');
      document.getElementById(inputId)?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await api.post(`/inquiries/${last.id}/reply`, { message: text });
      setReply('');
      onReplied(res.data?.data);
      if (convo.unread) onRead(convo, last.id, true);
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Your reply could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const markRead = async () => {
    setMarking(true);
    await onRead(convo, last.id);
    setMarking(false);
  };

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white ${convo.unread ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'}`}
      aria-label={`Conversation with ${convo.otherName} about ${convo.title}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-zinc-50 px-4 py-3">
        <div className="min-w-0">
          {convo.productSlug ? (
            <Link to={`/product/${convo.productSlug}`} className="truncate font-bold text-ink hover:text-primary-hover hover:underline">
              {convo.title}
            </Link>
          ) : (
            <span className="font-bold text-ink">{convo.title}</span>
          )}
          <p className="text-xs text-muted">
            With {convo.otherName} · {convo.messages.length} message{convo.messages.length !== 1 ? 's' : ''} · last{' '}
            {formatRelativeTime(new Date(convo.latest).toISOString())}
          </p>
        </div>
        {convo.unread > 0 && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">{convo.unread} new</span>
            <Button size="sm" variant="ghost" onClick={markRead} loading={marking} iconLeft={<CheckCheck size={14} />}>
              Mark as read
            </Button>
          </div>
        )}
      </header>

      <ol className="space-y-3 p-4">
        {convo.messages.map((m) => (
          <li key={m.id} className={`flex gap-3 ${m.is_mine ? 'flex-row-reverse' : ''}`}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                m.is_mine ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-700'
              }`}
              aria-hidden="true"
            >
              {initials(m.sender_name)}
            </span>
            <div className={`max-w-[85%] sm:max-w-[70%] ${m.is_mine ? 'text-right' : ''}`}>
              <p className="mb-1 flex items-center gap-1 text-xs text-muted">
                {m.is_mine ? <ArrowUpRight size={12} aria-hidden="true" /> : <ArrowDownLeft size={12} aria-hidden="true" />}
                {m.is_mine ? `You → ${m.receiver_name}` : `${m.sender_name} → you`}
                <time dateTime={m.created_at} title={formatDate(m.created_at)} className="ml-1">
                  · {formatRelativeTime(m.created_at)}
                </time>
              </p>
              <p
                className={`inline-block whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-left text-sm ${
                  m.is_mine ? 'rounded-tr-sm bg-primary/10 text-ink' : 'rounded-tl-sm bg-zinc-100 text-zinc-800'
                } ${!m.is_read && !m.is_mine ? 'font-semibold' : ''}`}
              >
                {m.message}
              </p>
              {m.edited_by_admin && (
                <p className="mt-1 text-[11px] italic text-muted">Edited by PetMart moderator</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {convo.productSlug ? (
        <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
          <label htmlFor={inputId} className="sr-only">
            Reply to {convo.otherName}
          </label>
          <textarea
            id={inputId}
            rows={1}
            maxLength={MAX_REPLY}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(e);
            }}
            placeholder={`Reply to ${convo.otherName}…`}
            className="min-h-[42px] flex-1 resize-y rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button type="submit" loading={sending} iconLeft={<Send size={16} />}>
            Send
          </Button>
        </form>
      ) : (
        <p className="border-t border-border px-4 py-3 text-xs text-muted">This listing has been removed, so you can no longer reply.</p>
      )}
    </section>
  );
}

export default function Inquiries() {
  useDocumentTitle('Inquiries');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api
      .get('/inquiries')
      .then((res) => setItems(res.data?.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // One conversation per listing and other person, newest first
  const conversations = useMemo(() => {
    const map = new Map();
    items.forEach((m) => {
      const key = m.conversation_key || `${m.product_id}:${m.other_user_id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          productSlug: m.product_slug,
          title: m.product_title || 'Deleted listing',
          otherName: m.other_user_name || 'Member',
          messages: [],
        });
      }
      map.get(key).messages.push(m);
    });
    return [...map.values()]
      .map((c) => {
        const messages = [...c.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return {
          ...c,
          messages,
          latest: new Date(messages[messages.length - 1].created_at).getTime(),
          unread: messages.filter((m) => !m.is_read && !m.is_mine).length,
        };
      })
      .sort((a, b) => b.latest - a.latest);
  }, [items]);

  const onReplied = (message) => {
    if (message) setItems((list) => [message, ...list]);
  };

  const onRead = async (convo, inquiryId, silent = false) => {
    try {
      await api.post(`/inquiries/${inquiryId}/read`);
      const ids = new Set(convo.messages.filter((m) => !m.is_mine).map((m) => m.id));
      setItems((list) => list.map((m) => (ids.has(m.id) ? { ...m, is_read: true } : m)));
    } catch {
      if (!silent) toast.error('Could not update. Please try again.');
    }
  };

  return (
    <AccountLayout title="Inquiries" subtitle="Messages between you and other members about listings.">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-white">
          <EmptyState icon={Inbox} title="Messages could not be loaded" action={load} actionLabel="Try again" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white">
          <EmptyState
            icon={Inbox}
            title="No messages yet"
            description="When you message a seller, or a buyer messages you, the conversation shows up here."
            actionTo="/browse"
            actionLabel="Browse listings"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((c) => (
            <Conversation key={c.key} convo={c} onReplied={onReplied} onRead={onRead} />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
