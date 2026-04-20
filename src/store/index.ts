import { create } from 'zustand'

// ============================================================
// TYPES
// ============================================================

interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  phone: string | null
  language: string
  role: string
  authProvider: string
  createdAt: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  language: string
  createdAt: string
}

interface Conversation {
  id: string
  title: string
  category: string
  language: string
  isArchived: boolean
  messages: Message[]
  messageCount: number
  lastMessage: { content: string; createdAt: string; role: string } | null
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  view: 'login' | 'register' | 'chat'

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string, language?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  restoreSession: () => Promise<void>

  // View actions
  setView: (view: 'login' | 'register' | 'chat') => void

  // User actions
  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) => Promise<void>
  updateLanguage: (language: string) => Promise<void>
}

// ============================================================
// STORE
// ============================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  view: 'login',

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!data.success) return { success: false, error: data.error || 'Erreur de connexion.' }

      localStorage.setItem('sanoovia_token', data.data.token)
      set({ user: data.data.user, token: data.data.token, view: 'chat', isLoading: false })
      return { success: true }
    } catch {
      set({ isLoading: false })
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.' }
    }
  },

  register: async (email, password, name, language = 'fr') => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, language })
      })
      const data = await res.json()
      if (!data.success) return { success: false, error: data.error || 'Erreur d\'inscription.' }

      localStorage.setItem('sanoovia_token', data.data.token)
      set({ user: data.data.user, token: data.data.token, view: 'chat', isLoading: false })
      return { success: true }
    } catch {
      set({ isLoading: false })
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.' }
    }
  },

  logout: () => {
    localStorage.removeItem('sanoovia_token')
    set({ user: null, token: null, view: 'login' })
  },

  restoreSession: async () => {
    const token = localStorage.getItem('sanoovia_token')
    if (!token) {
      set({ view: 'login' })
      return
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        set({ user: data.data, token, view: 'chat' })
      } else {
        localStorage.removeItem('sanoovia_token')
        set({ view: 'login' })
      }
    } catch {
      set({ view: 'login' })
    }
  },

  setView: (view) => set({ view }),

  updateProfile: async (profileData) => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData)
      })
      const data = await res.json()
      if (data.success) set({ user: { ...get().user!, ...data.data } })
    } catch (err) {
      console.error('Profile update error', err)
    }
  },

  updateLanguage: async (language) => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch('/api/users/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language })
      })
      const data = await res.json()
      if (data.success) set({ user: { ...get().user!, language: data.data.language } })
    } catch (err) {
      console.error('Language update error', err)
    }
  }
}))

// ============================================================
// CONVERSATION STORE
// ============================================================

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  isLoadingMessages: boolean
  isSendingMessage: boolean

  fetchConversations: () => Promise<void>
  createConversation: (title?: string, category?: string, language?: string) => Promise<Conversation | null>
  selectConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  clearCurrent: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoadingMessages: false,
  isSendingMessage: false,

  fetchConversations: async () => {
    const token = localStorage.getItem('sanoovia_token')
    if (!token) return
    try {
      const res = await fetch('/api/conversations?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        set({ conversations: data.data.conversations })
      }
    } catch (err) {
      console.error('Fetch conversations error', err)
    }
  },

  createConversation: async (title = 'Nouvelle conversation', category = 'general', language = 'fr') => {
    const token = localStorage.getItem('sanoovia_token')
    if (!token) return null
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category, language })
      })
      const data = await res.json()
      if (data.success) {
        const newConv: Conversation = { ...data.data, messages: [], lastMessage: null }
        set({ conversations: [newConv, ...get().conversations], currentConversation: newConv })
        return newConv
      }
      return null
    } catch (err) {
      console.error('Create conversation error', err)
      return null
    }
  },

  selectConversation: async (id) => {
    const token = localStorage.getItem('sanoovia_token')
    if (!token) return
    set({ isLoadingMessages: true })
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        const conv: Conversation = data.data
        set({ currentConversation: conv })
      }
    } catch (err) {
      console.error('Select conversation error', err)
    }
    set({ isLoadingMessages: false })
  },

  sendMessage: async (content) => {
    const { currentConversation } = get()
    const token = localStorage.getItem('sanoovia_token')
    if (!currentConversation || !token) return

    set({ isSendingMessage: true })

    // Optimistic update: add user message immediately
    const userMsg: Message = {
      id: 'temp_' + Date.now(),
      role: 'user',
      content,
      language: currentConversation.language,
      createdAt: new Date().toISOString()
    }
    set({
      currentConversation: {
        ...currentConversation,
        messages: [...currentConversation.messages, userMsg]
      }
    })

    try {
      const res = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content })
      })
      const data = await res.json()

      if (data.success) {
        const { userMessage, assistantMessage } = data.data
        const aiMsg: Message = {
          id: assistantMessage.id,
          role: 'assistant',
          content: assistantMessage.content,
          language: assistantMessage.language,
          createdAt: assistantMessage.createdAt
        }
        set({
          currentConversation: {
            ...currentConversation,
            messages: [...currentConversation.messages.filter(m => m.id !== userMsg.id), {
              id: userMessage.id,
              role: 'user' as const,
              content: userMessage.content,
              language: userMessage.language,
              createdAt: userMessage.createdAt
            }, aiMsg],
            title: currentConversation.messages.length === 0
              ? content.substring(0, 60) + (content.length > 60 ? '...' : '')
              : currentConversation.title
          }
        })
        // Refresh conversation list
        get().fetchConversations()
      }
    } catch (err) {
      console.error('Send message error', err)
    }

    set({ isSendingMessage: false })
  },

  deleteConversation: async (id) => {
    const token = localStorage.getItem('sanoovia_token')
    if (!token) return
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const { conversations, currentConversation } = get()
      set({
        conversations: conversations.filter(c => c.id !== id),
        currentConversation: currentConversation?.id === id ? null : currentConversation
      })
    } catch (err) {
      console.error('Delete conversation error', err)
    }
  },

  clearCurrent: () => set({ currentConversation: null })
}))
