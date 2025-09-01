'use client'

import { useEffect, useState } from 'react'
import type { Conversation, Message, ApiListResponse } from '@/lib/types'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

export function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    fetchJson<ApiListResponse<Conversation>>('/api/inbox/conversations')
      .then((data) => setConversations(data.data))
      .catch(() => setConversations([]))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    fetchJson<ApiListResponse<Message>>(`/api/inbox/conversations/${selectedId}/messages`)
      .then((data) => setMessages(data.data))
      .catch(() => setMessages([]))
  }, [selectedId])

  const sendMessage = async () => {
    if (!selectedId || !text.trim()) return
    await fetchJson<{ message: Message }>(
      `/api/inbox/conversations/${selectedId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      },
    ).then((data) => {
      setMessages((prev) => [...prev, data.message])
      setText('')
    })
  }

  return (
    <main className="p-6 flex gap-4">
      <aside className="w-64 border-r">
        <h2 className="font-semibold mb-2">Conversations</h2>
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`block w-full text-left px-2 py-1 rounded ${
                  selectedId === c.id ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  {c.profilePic ? (
                    <img
                      src={c.profilePic}
                      alt={c.name || c.psid}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-gray-300" />
                  )}
                  <span>{c.name || c.psid}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1 flex flex-col">
        {selectedId ? (
          <>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.direction === 'outbound' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="px-2 py-1 rounded bg-gray-200">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="Type a message"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                disabled={!text.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p>Select a conversation to view messages.</p>
        )}
      </section>
    </main>
  )
}
