'use client'

import { useEffect, useRef, useState } from 'react'
import { socket } from "@/lib/socketClient";
import type {
  Conversation,
  Message,
  ApiListResponse,
  ApiItemResponse,
} from '@/lib/types'
import Image from 'next/image';
import { getUserProfile } from "@/lib/meta";
import { decrypt, unpack } from '@/lib/crypto';
import { Badge } from '@/components/ui/badge';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

export function InboxPage({
  tenantId,
  pageId,
  pageName,
}: {
  tenantId: string
  pageId: string
  pageName: string
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const socketRef = useRef<typeof socket | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!tenantId || !pageId) return
    fetchJson<ApiListResponse<Conversation>>(
      `/api/inbox/conversations?tenantId=${tenantId}&pageId=${pageId}`,
    )
      .then((data) => setConversations(data.data))
      .catch(() => setConversations([]))
  }, [tenantId, pageId])

  useEffect(() => {
    if (!selectedId) return
    fetchJson<ApiListResponse<Message>>(
      `/api/inbox/conversations/${selectedId}/messages?tenantId=${tenantId}&pageId=${pageId}`,
    )
      .then((data) => setMessages(data.data))
      .catch(() => setMessages([]))
  }, [selectedId, tenantId, pageId])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket setup and cleanup on mount/unmount
  useEffect(() => {
    socketRef.current = socket
    // Join tenant and page rooms for realtime updates
    if (tenantId && pageId) {
      socket.emit('join', [`tenant:${tenantId}`, `page:${pageId}`])
    }

    const handleMessageNew = ({
      conversationId,
      message,
      conversation,
    }: {
      conversationId: string
      message: Message
      conversation: Conversation
    }) => {
      if (selectedIdRef.current === conversationId) {
        setMessages((prev) => [...prev, message])
      }
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) {
          return prev.map((c) => (c.id === conversation.id ? conversation : c));
        }
        return [conversation, ...prev];
      });

      // Fetch profile info if missing
      ;(async () => {
        try {
          if (!conversation.name || !conversation.profilePic) {
            const { data } = await fetchJson<
              ApiItemResponse<{ pageTokenEnc: string }>
            >(
              `/api/inbox/conversations/${conversation.id}/token?tenantId=${tenantId}&pageId=${pageId}`,
            )
            const token = decrypt(unpack(data.pageTokenEnc))
            const profile = await getUserProfile(conversation.psid, token)
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversation.id
                  ? {
                      ...c,
                      name: profile.name,
                      profilePic: profile.picture?.data?.url,
                    }
                  : c,
              ),
            )
          }
        } catch (err) {
          console.error('Failed to fetch profile', err)
        }
      })()
    }

    socket.on('message:new', handleMessageNew)

      return () => {
        socket.off('message:new', handleMessageNew)
      }
  }, [tenantId, pageId])

  const sendMessage = async () => {
    if (!selectedId || !text.trim()) return
    await fetchJson<{ message: Message }>(
      `/api/inbox/conversations/${selectedId}/messages?tenantId=${tenantId}&pageId=${pageId}`,
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

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4 pb-4 border-b">
        {pageName} <Badge variant={"outline"}>{conversations.length}</Badge>
      </h1>
      <div className="flex gap-4">
        <aside className="w-64 border-r">
          <ul className="space-y-1 h-[75vh]">
            {conversations.length > 0 &&
              conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`block w-full text-left px-2 py-1 rounded ${
                      selectedId === c.id
                        ? "bg-gray-200 dark:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {c.profilePic ? (
                        <Image
                          src={c.profilePic}
                          alt={c.name || c.psid}
                          className="w-6 h-6 rounded-full"
                          width={24}
                          height={24}
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-gray-300" />
                      )}
                      <span>{c.name} {c.psid}</span>
                    </span>
                  </button>
                </li>
              ))}

            {conversations.length === 0 && (
              <li className='text-muted-foreground'>No conversations yet!</li>
            )}
          </ul>
        </aside>
        <section className="flex-1 flex flex-col">
          {selectedId ? (
            <>
              <div className="flex-1 overflow-y-auto mb-4 space-y-2 h-[75vh]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.direction === "outbound"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 flex items-end gap-1">
                      {m.text}
                      {m.direction === "outbound" && (
                        <span
                          className={`text-xs ${
                            m.readAt ? "text-blue-500" : "text-gray-500"
                          }`}
                        >
                          {m.readAt ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 items-center">
                {selectedConversation && (
                  <div className="flex items-center gap-2 flex-1 border dark:border-gray-600 rounded px-2 py-1">
                    {selectedConversation.profilePic ? (
                      <Image
                        src={selectedConversation.profilePic}
                        alt={
                          selectedConversation.name || selectedConversation.psid
                        }
                        className="w-6 h-6 rounded-full"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-gray-300" />
                    )}
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 outline-none bg-transparent"
                      placeholder={`Message ${
                        selectedConversation.name || selectedConversation.psid
                      }`}
                    />
                  </div>
                )}
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
          ) : conversations.length > 0 && (
            <p className="text-muted-foreground">
              Select a conversation to view messages.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
