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
    <main className="tw-:p-6">
      <h1 className="tw-:text-xl tw-:font-semibold tw-:mb-4">{pageName}</h1>
      <div className="tw-:flex tw-:gap-4">
        <aside className="tw-:w-64 tw-:border-r">
          <h2 className="tw-:font-semibold tw-:mb-2">Conversations</h2>
          <ul className="tw-:space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`tw-:block tw-:w-full tw-:text-left tw-:px-2 tw-:py-1 tw-:rounded ${
                    selectedId === c.id
                      ? "tw-:bg-gray-200 dark:tw-:bg-gray-700"
                      : "hover:tw-:bg-gray-100"
                  }`}
                >
                  <span className="tw-:flex tw-:items-center tw-:gap-2">
                    {c.profilePic ? (
                      <Image
                        src={c.profilePic}
                        alt={c.name || c.psid}
                        className="tw-:w-6 tw-:h-6 tw-:rounded-full"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <span className="tw-:w-6 tw-:h-6 tw-:rounded-full tw-:bg-gray-300" />
                    )}
                    <span>{c.name || c.psid}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="tw-:flex-1 tw-:flex tw-:flex-col">
          {selectedId ? (
            <>
              <div className="tw-:flex-1 tw-:overflow-y-auto tw-:mb-4 tw-:space-y-2 tw-:max-h-[75vh]">
                {messages.map((m) => (
                <div
                  key={m.id}
                  className={`tw-:flex ${
                    m.direction === "outbound" ? "tw-:justify-end" : "tw-:justify-start"
                  }`}
                >
                  <div className="tw-:px-2 tw-:py-1 tw-:rounded tw-:bg-gray-200 dark:tw-:bg-gray-700 tw-:flex tw-:items-end tw-:gap-1">
                    {m.text}
                    {m.direction === "outbound" && (
                      <span
                        className={`tw-:text-xs ${
                          m.readAt ? "tw-:text-blue-500" : "tw-:text-gray-500"
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
              <div className="tw-:flex tw-:gap-2 tw-:items-center">
                {selectedConversation && (
                  <div className="tw-:flex tw-:items-center tw-:gap-2 tw-:flex-1 tw-:border dark:tw-:border-gray-600 tw-:rounded tw-:px-2 tw-:py-1">
                    {selectedConversation.profilePic ? (
                      <Image
                        src={selectedConversation.profilePic}
                        alt={selectedConversation.name || selectedConversation.psid}
                        className="tw-:w-6 tw-:h-6 tw-:rounded-full"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <span className="tw-:w-6 tw-:h-6 tw-:rounded-full tw-:bg-gray-300" />
                    )}
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="tw-:flex-1 tw-:outline-none tw-:bg-transparent"
                      placeholder={`Message ${
                        selectedConversation.name || selectedConversation.psid
                      }`}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={sendMessage}
                  className="tw-:px-3 tw-:py-1 tw-:rounded tw-:bg-blue-600 tw-:text-white disabled:tw-:opacity-50"
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
      </div>
    </main>
  );
}
