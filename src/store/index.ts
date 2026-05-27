import { create } from 'zustand'
import { toast } from 'sonner'

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
  role: 'user' | 'assistant' | 'error'
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
  view: 'login' | 'register' | 'chat' | 'forgot-password' | 'reset-password'
  resetToken: string | null

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string, language?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  restoreSession: () => Promise<void>

  // Password reset actions
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; devToken?: string }>
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>

  // View actions
  setView: (view: 'login' | 'register' | 'chat' | 'forgot-password' | 'reset-password') => void
  setResetToken: (token: string | null) => void

  // User actions
  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) => Promise<void>
  updateLanguage: (language: string) => Promise<void>
}

// ============================================================
// AUTH STORE
// ============================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  view: 'login',
  resetToken: null,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!data.success) {
        const errorMsg = data.error || 'Erreur de connexion.'
        toast.error('Connexion échouée', { description: errorMsg })
        return { success: false, error: errorMsg }
      }

      localStorage.setItem('sanoovia_token', data.data.token)
      set({ user: data.data.user, token: data.data.token, view: 'chat', isLoading: false })
      toast.success('Bienvenue !', { description: `Connecté en tant que ${data.data.user.name}` })
      return { success: true }
    } catch (err) {
      set({ isLoading: false })
      toast.error('Erreur réseau', { description: 'Impossible de se connecter. Vérifiez votre connexion internet.' })
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
      if (!data.success) {
        const errorMsg = data.error || "Erreur d'inscription."
        toast.error("Inscription échouée", { description: errorMsg })
        return { success: false, error: errorMsg }
      }

      localStorage.setItem('sanoovia_token', data.data.token)
      set({ user: data.data.user, token: data.data.token, view: 'chat', isLoading: false })
      toast.success('Bienvenue !', { description: `Compte créé pour ${data.data.user.name}` })
      return { success: true }
    } catch {
      set({ isLoading: false })
      toast.error('Erreur réseau', { description: "Impossible de créer le compte. Vérifiez votre connexion internet." })
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
  setResetToken: (token) => set({ resetToken: token }),

  forgotPassword: async (email) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        set({ isLoading: false })
        toast.success('Email envoyé', { description: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' })
        return {
          success: true,
          devToken: data.data?.token || data.data?.devToken || null
        }
      }
      set({ isLoading: false })
      const errorMsg = data.error || 'Erreur lors de la demande.'
      toast.error('Erreur', { description: errorMsg })
      return { success: false, error: errorMsg }
    } catch {
      set({ isLoading: false })
      toast.error('Erreur réseau', { description: 'Impossible de traiter la demande. Vérifiez votre connexion.' })
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.' }
    }
  },

  resetPassword: async (token, password, confirmPassword) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      })
      const data = await res.json()
      if (data.success) {
        set({ isLoading: false, resetToken: null })
        toast.success('Mot de passe modifié', { description: 'Votre mot de passe a été changé avec succès.' })
        return { success: true }
      }
      set({ isLoading: false })
      const errorMsg = data.error || 'Erreur lors de la réinitialisation.'
      toast.error('Erreur', { description: errorMsg })
      return { success: false, error: errorMsg }
    } catch {
      set({ isLoading: false })
      toast.error('Erreur réseau', { description: 'Impossible de réinitialiser le mot de passe. Vérifiez votre connexion.' })
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.' }
    }
  },

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
      if (data.success) {
        set({ user: { ...get().user!, ...data.data } })
        toast.success('Profil mis à jour')
      } else {
        toast.error('Erreur', { description: data.error || 'Impossible de mettre à jour le profil.' })
      }
    } catch (err) {
      toast.error('Erreur réseau', { description: 'Impossible de mettre à jour le profil. Vérifiez votre connexion.' })
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
      if (data.success) {
        set({ user: { ...get().user!, language: data.data.language } })
      } else {
        toast.error('Erreur', { description: data.error || 'Impossible de changer la langue.' })
      }
    } catch {
      toast.error('Erreur réseau', { description: 'Impossible de changer la langue. Vérifiez votre connexion.' })
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
  sendError: string | null

  fetchConversations: () => Promise<void>
  createConversation: (title?: string, category?: string, language?: string) => Promise<Conversation | null>
  selectConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<boolean>
  deleteConversation: (id: string) => Promise<void>
  clearCurrent: () => void
  clearSendError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoadingMessages: false,
  isSendingMessage: false,
  sendError: null,

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
      } else {
        toast.error('Erreur', { description: data.error || 'Impossible de charger les conversations.' })
      }
    } catch (err) {
      toast.error('Erreur réseau', { description: 'Impossible de charger les conversations. Vérifiez votre connexion internet.' })
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
      toast.error('Erreur', { description: data.error || 'Impossible de créer la conversation.' })
      return null
    } catch (err) {
      toast.error('Erreur réseau', { description: 'Impossible de créer la conversation. Vérifiez votre connexion internet.' })
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
        set({ currentConversation: conv, sendError: null })
      } else {
        toast.error('Erreur', { description: data.error || 'Impossible de charger la conversation.' })
      }
    } catch (err) {
      toast.error('Erreur réseau', { description: 'Impossible de charger la conversation. Vérifiez votre connexion internet.' })
    }
    set({ isLoadingMessages: false })
  },

  sendMessage: async (content) => {
    const { currentConversation } = get()
    const token = localStorage.getItem('sanoovia_token')
    if (!currentConversation || !token) {
      toast.error('Erreur', { description: 'Aucune conversation active. Créez-en une ou sélectionnez-en une.' })
      return false
    }

    set({ isSendingMessage: true, sendError: null })

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
          },
          sendError: null
        })
        // Refresh conversation list
        get().fetchConversations()
        set({ isSendingMessage: false })
        return true
      }

      // API returned an error
      const errorMsg = data.error || "Erreur lors de l'envoi du message."

      // Rollback: remove optimistic user message
      const conv = get().currentConversation
      if (conv) {
        set({
          currentConversation: {
            ...conv,
            messages: conv.messages.filter(m => m.id !== userMsg.id)
          }
        })
      }

      // Add error message in the chat
      const errorMsgBlock: Message = {
        id: 'error_' + Date.now(),
        role: 'error',
        content: errorMsg,
        language: currentConversation.language,
        createdAt: new Date().toISOString()
      }
      const updatedConv = get().currentConversation
      if (updatedConv) {
        set({
          currentConversation: {
            ...updatedConv,
            messages: [...updatedConv.messages, errorMsgBlock]
          }
        })
      }

      set({ isSendingMessage: false, sendError: errorMsg })

      // Show toast alert
      toast.error('Sanovia — Erreur', {
        description: errorMsg,
        duration: 8000,
      })

      return false
    } catch (err: any) {
      // Network error
      const networkMsg = 'Erreur réseau : impossible d\'envoyer le message. Vérifiez votre connexion internet et réessayez.'

      // Rollback: remove optimistic user message
      const conv = get().currentConversation
      if (conv) {
        set({
          currentConversation: {
            ...conv,
            messages: conv.messages.filter(m => m.id !== userMsg.id)
          }
        })
      }

      // Add error message in the chat
      const errorMsgBlock: Message = {
        id: 'error_' + Date.now(),
        role: 'error',
        content: networkMsg,
        language: currentConversation.language,
        createdAt: new Date().toISOString()
      }
      const updatedConv = get().currentConversation
      if (updatedConv) {
        set({
          currentConversation: {
            ...updatedConv,
            messages: [...updatedConv.messages, errorMsgBlock]
          }
        })
      }

      set({ isSendingMessage: false, sendError: networkMsg })

      toast.error('Sanovia — Erreur réseau', {
        description: networkMsg,
        duration: 10000,
      })

      console.error('[sendMessage] Erreur réseau:', err)
      return false
    }
  },

  deleteConversation: async (id) => {
    const token = localStorage.getItem('sanoovia_token')
    if (!token) return
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!data.success && data.error) {
        toast.error('Erreur', { description: data.error || 'Impossible de supprimer la conversation.' })
        return
      }
      const { conversations, currentConversation } = get()
      set({
        conversations: conversations.filter(c => c.id !== id),
        currentConversation: currentConversation?.id === id ? null : currentConversation
      })
      toast.success('Conversation supprimée')
    } catch (err) {
      toast.error('Erreur réseau', { description: 'Impossible de supprimer la conversation. Vérifiez votre connexion.' })
    }
  },

  clearCurrent: () => set({ currentConversation: null, sendError: null }),
  clearSendError: () => set({ sendError: null })
}))
