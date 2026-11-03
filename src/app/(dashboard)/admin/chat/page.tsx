'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Search,
  Plus,
  MessageCircle,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Select from '@/components/ui/select'

interface Message {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  content: string
  timestamp: string
  read: boolean
}

interface Conversation {
  userId: string
  userName: string
  lastMessage: string
  lastTimestamp: string
  unreadCount: number
  messages: Message[]
}

const userOptions = [
  { value: '1', label: 'Dr. Smith - Principal' },
  { value: '2', label: 'Mrs. Johnson - Parent' },
  { value: '3', label: 'Mr. Davis - Teacher' },
  { value: '4', label: 'Mrs. Wilson - Teacher' },
  { value: '5', label: 'Mr. Brown - Staff' },
]

const currentUserId = 'admin-1'

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [newChatModal, setNewChatModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/messages?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      const json = await res.json()
      const messages: Message[] = json.data ?? []

      const conversationMap = new Map<string, Conversation>()
      messages.forEach((msg) => {
        const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
        const otherName = msg.senderId === currentUserId ? msg.receiverName : msg.senderName

        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            userId: otherId,
            userName: otherName,
            lastMessage: msg.content,
            lastTimestamp: msg.timestamp,
            unreadCount: 0,
            messages: [],
          })
        }
        const conv = conversationMap.get(otherId)!
        conv.messages.push(msg)
        if (!msg.read && msg.senderId !== currentUserId) {
          conv.unreadCount++
        }
        if (new Date(msg.timestamp) > new Date(conv.lastTimestamp)) {
          conv.lastMessage = msg.content
          conv.lastTimestamp = msg.timestamp
        }
      })

      const sorted = Array.from(conversationMap.values()).sort(
        (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
      )
      setConversations(sorted)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation])

  const filteredConversations = conversations.filter(c =>
    c.userName.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSend() {
    if (!messageInput.trim() || !selectedConversation) return
    try {
      setSending(true)
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: selectedConversation.userId,
          content: messageInput.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      const newMsg: Message = {
        id: Date.now().toString(),
        senderId: currentUserId,
        senderName: 'Admin',
        receiverId: selectedConversation.userId,
        receiverName: selectedConversation.userName,
        content: messageInput.trim(),
        timestamp: new Date().toISOString(),
        read: false,
      }
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMsg],
        lastMessage: newMsg.content,
        lastTimestamp: newMsg.timestamp,
      } : null)
      setMessageInput('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function selectConversation(conv: Conversation) {
    setSelectedConversation(conv)
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c =>
        c.userId === conv.userId ? { ...c, unreadCount: 0 } : c
      ))
    }
  }

  function handleStartNewChat() {
    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }
    const user = userOptions.find(u => u.value === selectedUser)
    if (!user) return
    const existing = conversations.find(c => c.userId === selectedUser)
    if (existing) {
      selectConversation(existing)
    } else {
      const newConv: Conversation = {
        userId: selectedUser,
        userName: user.label,
        lastMessage: '',
        lastTimestamp: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    setNewChatModal(false)
    setSelectedUser('')
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Parent-teacher live chat and messaging</p>
        </div>
        <Button variant="primary" onClick={() => setNewChatModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Conversation
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden">
          <div className="flex h-[600px]">
            <div className="w-80 border-r border-border flex flex-col shrink-0">
              <div className="p-3 border-b border-border">
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <Loading text="Loading..." className="py-8" />
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 px-4">
                    <MessageCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.userId}
                      onClick={() => selectConversation(conv)}
                      className={`w-full flex items-start gap-3 p-3 text-left hover:bg-muted transition-colors border-b border-border ${
                        selectedConversation?.userId === conv.userId ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">{conv.userName}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="primary" size="sm">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage || 'No messages yet'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(conv.lastTimestamp).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <MessageCircle className="h-16 w-16 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-foreground">Select a conversation</p>
                  <p className="text-sm text-muted-foreground">Choose a conversation from the left to start messaging</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedConversation.userName}</p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedConversation.messages.length === 0 && (
                      <div className="flex flex-col items-center gap-2 py-12">
                        <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                    <AnimatePresence>
                      {selectedConversation.messages.map((msg) => {
                        const isSent = msg.senderId === currentUserId
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                                isSent
                                  ? 'bg-primary text-white rounded-br-sm'
                                  : 'bg-muted text-foreground rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isSent ? 'text-white/70' : 'text-muted-foreground'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                        className="flex-1"
                      />
                      <Button variant="primary" onClick={handleSend} disabled={sending || !messageInput.trim()} size="md">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <Modal isOpen={newChatModal} onClose={() => setNewChatModal(false)} title="New Conversation" size="sm">
        <div className="space-y-4">
          <Select
            label="Select User"
            options={userOptions}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            placeholder="Choose a person to message"
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setNewChatModal(false); setSelectedUser('') }}>Cancel</Button>
            <Button variant="primary" onClick={handleStartNewChat}>Start Conversation</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
