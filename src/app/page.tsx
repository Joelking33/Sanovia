'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore, useChatStore } from '@/store'

// ============================================================
// NUMÉROS D'URGENCE CI
// ============================================================
const URGENCES = [
  { icon: '🚑', label: 'SAMU / Urgences médicales', num: '185' },
  { icon: '🔥', label: 'Pompiers', num: '180' },
  { icon: '👮', label: 'Police secours', num: '111' },
  { icon: '🏥', label: 'CHU de Treichville', num: '+225 27 21 24 90 00' },
  { icon: '🏥', label: 'CHU de Cocody', num: '+225 27 22 44 08 20' },
  { icon: '🏥', label: 'CHU de Yopougon', num: '+225 27 23 46 36 36' },
  { icon: '🏥', label: 'Clinique Sainte Marie', num: '+225 27 22 44 49 00' },
  { icon: '☎️', label: 'Centre Anti-Poison', num: '+225 27 21 35 60 20' },
  { icon: '🧠', label: 'Urgences psychiatriques', num: '+225 27 22 44 23 11' },
  { icon: '🩸', label: 'Transfusion sanguine', num: '+225 27 22 40 00 91' },
  { icon: '🚨', label: 'Croix-Rouge CI', num: '+225 27 22 32 31 27' },
  { icon: '🌡️', label: 'Infoline santé', num: '143' },
]

// ============================================================
// LANGUES
// ============================================================
const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ba', label: 'Baoulé', flag: '🌍' },
  { code: 'dy', label: 'Dioula', flag: '🌍' },
  { code: 'bq', label: 'Bété', flag: '🌍' },
]

// ============================================================
// UTILS
// ============================================================
function getTime(): string {
  const n = new Date()
  return n.getHours().toString().padStart(2, '0') + ':' + n.getMinutes().toString().padStart(2, '0')
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Home() {
  const { view, restoreSession, user, token } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Show loading while restoring session
  if (view === 'login' && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <p className="text-[#8b949e]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (view === 'chat' && user) {
    return <ChatView />
  }

  if (view === 'register') {
    return <RegisterView />
  }

  return <LoginView />
}

// ============================================================
// LOGIN VIEW
// ============================================================
function LoginView() {
  const { login, isLoading, setView } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    const result = await login(email, password)
    if (!result.success) setError(result.error || 'Erreur de connexion.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.2),rgba(0,168,232,.2))', border: '1px solid rgba(0,198,167,.3)' }}>
            <span className="text-5xl">🧠</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sanovia
          </h1>
          <p className="text-[#8b949e] mt-2 text-sm">Assistant santé intelligent pour la Côte d&apos;Ivoire</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-7" style={{ background: '#161b22', border: '1px solid #21262d' }}>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-6 text-center">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="votre@email.com" />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors pr-10"
                  style={{ background: '#0d1117', border: '1px solid #21262d' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                  onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] text-sm">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)' }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="typing-dot" style={{ background: '#fff' }} />
                  <span className="typing-dot" style={{ background: '#fff' }} />
                  <span className="typing-dot" style={{ background: '#fff' }} />
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-[#8b949e]">
              Pas encore de compte ?{' '}
              <button onClick={() => setView('register')} className="font-semibold" style={{ color: '#00c6a7' }}>
                Créer un compte
              </button>
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-[#484f58] mt-6 px-4">
          ⚠️ Sanovia est un assistant informatif, pas un médecin. Les informations fournies ne remplacent pas un avis médical professionnel.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// REGISTER VIEW
// ============================================================
function RegisterView() {
  const { register, isLoading, setView } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [language, setLanguage] = useState('fr')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password || !confirmPassword) { setError('Veuillez remplir tous les champs.'); return }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) { setError('Le mot de passe doit contenir au moins une majuscule et un chiffre.'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    const result = await register(email, password, name, language)
    if (!result.success) setError(result.error || 'Erreur d\'inscription.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.2),rgba(0,168,232,.2))', border: '1px solid rgba(0,198,167,.3)' }}>
            <span className="text-4xl">🧠</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Créer un compte
          </h1>
          <p className="text-[#8b949e] mt-1 text-sm">Rejoignez Sanovia pour accéder à l&apos;assistant santé</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-7" style={{ background: '#161b22', border: '1px solid #21262d' }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">Nom complet</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="Jean Kouassi" />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="votre@email.com" />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors pr-10"
                  style={{ background: '#0d1117', border: '1px solid #21262d' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                  onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                  placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] text-sm">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">Confirmer le mot de passe</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="Confirmez votre mot de passe" />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">Langue préférée</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} type="button" onClick={() => setLanguage(lang.code)}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all text-center"
                    style={{
                      background: language === lang.code ? 'rgba(0,198,167,.15)' : '#0d1117',
                      border: language === lang.code ? '1px solid rgba(0,198,167,.4)' : '1px solid #21262d',
                      color: language === lang.code ? '#00c6a7' : '#8b949e'
                    }}>
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50 mt-1"
              style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)' }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="typing-dot" style={{ background: '#fff' }} />
                  <span className="typing-dot" style={{ background: '#fff' }} />
                  <span className="typing-dot" style={{ background: '#fff' }} />
                </span>
              ) : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-[#8b949e]">
              Déjà un compte ?{' '}
              <button onClick={() => setView('login')} className="font-semibold" style={{ color: '#00c6a7' }}>
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CATEGORY CONFIG
// ============================================================
const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  general: { icon: '💬', label: 'Santé', color: '#00c6a7' },
  premiers_secours: { icon: '🚑', label: 'Urgences', color: '#ef4444' },
  grossesse: { icon: '🤰', label: 'Grossesse', color: '#a78bfa' },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ============================================================
// CHAT VIEW
// ============================================================
function ChatView() {
  const { user, logout } = useAuthStore()
  const { conversations, currentConversation, fetchConversations, createConversation, selectConversation, sendMessage, deleteConversation, clearCurrent, isSendingMessage, isLoadingMessages } = useChatStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [category, setCategory] = useState<string>('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages?.length])

  // Theme toggle
  const toggleTheme = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
    document.documentElement.classList.toggle('light')
  }

  // New conversation — clear current to show welcome
  const handleNewConv = async () => {
    clearCurrent()
    setCategory('general')
    setInputValue('')
    closeSidebar()
    inputRef.current?.focus()
  }

  // Send message
  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isSendingMessage) return

    if (!currentConversation) {
      const conv = await createConversation(text.substring(0, 60) + (text.length > 60 ? '...' : ''), category)
      if (conv) {
        setInputValue('')
        useChatStore.getState().sendMessage(text)
      }
      return
    }

    setInputValue('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    await sendMessage(text)
  }

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto resize textarea
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const closeSidebar = () => setSidebarOpen(false)

  const handleChangeLanguage = async (langCode: string) => {
    await useAuthStore.getState().updateLanguage(langCode)
  }

  const handleDeleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteConversation(id)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* URGENCES BAR */}
      <div className="flex-shrink-0 h-9 flex items-center overflow-hidden px-4"
        style={{ background: 'linear-gradient(90deg, #7b0000 0%, #b91c1c 50%, #7b0000 100%)', borderBottom: '1px solid #ef4444' }}>
        <div className="flex items-center gap-1.5 pr-3.5 mr-3.5 flex-shrink-0"
          style={{ borderRight: '1px solid rgba(255,255,255,.2)' }}>
          <div className="w-[7px] h-[7px] rounded-full bg-[#ef4444] urgence-pulse" />
          <span className="text-[11px] font-bold tracking-wide text-[#fca5a5] uppercase whitespace-nowrap">
            🚨 Urgences CI
          </span>
        </div>
        <div className="flex-1 overflow-hidden urgences-mask">
          <div className="flex w-max urgences-scroll">
            {[...URGENCES, ...URGENCES].map((u, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 mr-6 text-xs text-white whitespace-nowrap px-2.5 py-0.5 rounded-full cursor-default transition-colors"
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
                {u.icon} <span className="text-[#fca5a5] font-semibold">{u.label}</span> —{' '}
                <a href={`tel:${u.num.replace(/\s/g, '')}`} className="text-[#fde68a] font-bold no-underline">{u.num}</a>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* TOPBAR */}
      <div className="flex items-center justify-between px-5 h-[52px] flex-shrink-0 relative z-50"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          {/* Hamburger mobile */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex flex-col gap-[5px] p-1.5 rounded-md transition-colors hover:bg-white/10 cursor-pointer"
            style={{ display: undefined }}>
            <span className={`block w-5 h-[2px] rounded-sm transition-all ${sidebarOpen ? 'translate-y-[7px] rotate-45' : ''}`} style={{ background: 'var(--foreground)' }} />
            <span className={`block w-5 h-[2px] rounded-sm transition-all ${sidebarOpen ? 'opacity-0' : ''}`} style={{ background: 'var(--foreground)' }} />
            <span className={`block w-5 h-[2px] rounded-sm transition-all ${sidebarOpen ? '-translate-y-[7px] -rotate-45' : ''}`} style={{ background: 'var(--foreground)' }} />
          </button>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.3),rgba(0,168,232,.3))', border: '1px solid rgba(0,198,167,.4)' }}>
              🧠
            </div>
            <span className="text-base font-bold sanovia-gradient-text">Sanovia</span>
          </div>
          {/* Conversation title in topbar */}
          {currentConversation && (
            <div className="hidden md:flex items-center gap-2 ml-4">
              <span className="text-xs" style={{ color: '#8b949e' }}>│</span>
              <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--foreground)' }}>
                {currentConversation.title}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{
                background: `${CATEGORY_CONFIG[currentConversation.category]?.color}20`,
                color: CATEGORY_CONFIG[currentConversation.category]?.color,
                fontSize: '10px'
              }}>
                {CATEGORY_CONFIG[currentConversation.category]?.icon} {CATEGORY_CONFIG[currentConversation.category]?.label}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px]"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)' }}>
            <select
              value={user?.language || 'fr'}
              onChange={e => handleChangeLanguage(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer"
              style={{ color: 'var(--foreground)', fontSize: '13px' }}>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code} style={{ background: '#161b22', color: '#e6edf3' }}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          <button onClick={toggleTheme} className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-base cursor-pointer transition-colors hover:bg-white/10"
            style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,.06)' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button onClick={logout} className="text-[13px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/10"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            Se déconnecter
          </button>

          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)' }}>
            {user ? getInitials(user.name) : '?'}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-[90] md:hidden" onClick={closeSidebar} />
        )}

        {/* SIDEBAR — visible on desktop, slide on mobile */}
        <div className={`
          flex-shrink-0 flex flex-col gap-0 transition-transform duration-300
          w-[280px] p-4
          fixed top-[90px] bottom-0 left-0 z-[95] w-[260px]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:top-auto md:bottom-auto md:z-auto md:w-[280px]
        `}
          style={{ background: 'var(--background)', borderRight: '1px solid var(--border)' }}>

          {/* ── NEW CHAT SECTION ── */}
          <div className="mb-3">
            {/* Category selector */}
            <div className="flex gap-1 p-1 rounded-lg mb-3" style={{ background: 'var(--card)' }}>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setCategory(key)}
                  className="flex-1 text-center text-[11px] py-1.5 rounded-md font-medium transition-all cursor-pointer leading-tight"
                  style={{
                    background: category === key ? `${cfg.color}20` : 'transparent',
                    color: category === key ? cfg.color : '#8b949e',
                    border: category === key ? `1px solid ${cfg.color}50` : '1px solid transparent'
                  }}>
                  {cfg.icon}<br />{cfg.label}
                </button>
              ))}
            </div>

            {/* New conversation button */}
            <button onClick={handleNewConv}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)' }}>
              <span className="text-base font-bold">+</span> Nouveau chat
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#484f58' }}>
              📋 Historique — {conversations.length}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* ── HISTORY SECTION ── */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 custom-scrollbar pb-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px dashed var(--border)' }}>
                  💬
                </div>
                <p className="text-xs text-center leading-relaxed" style={{ color: '#484f58' }}>
                  Aucune conversation pour le moment.<br />Commencez par poser une question de santé !
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const catCfg = CATEGORY_CONFIG[conv.category] || CATEGORY_CONFIG.general
                const isActive = currentConversation?.id === conv.id
                return (
                  <div key={conv.id}
                    onClick={() => { selectConversation(conv.id); closeSidebar() }}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all group relative ${isActive ? 'ring-1' : ''}`}
                    style={{
                      background: isActive ? `${catCfg.color}15` : 'rgba(255,255,255,.04)',
                      ringColor: isActive ? `${catCfg.color}40` : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.08)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm flex-shrink-0">{catCfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate" style={{ color: isActive ? catCfg.color : 'var(--foreground)' }}>
                          {conv.title}
                        </div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: '#484f58' }}>
                          {conv.lastMessage
                            ? (conv.lastMessage.role === 'user' ? '👤 ' : '🧠 ') + conv.lastMessage.content.substring(0, 35) + (conv.lastMessage.content.length > 35 ? '...' : '')
                            : 'Nouvelle conversation'
                          }
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px]" style={{ color: '#484f58' }}>{formatDate(conv.updatedAt || conv.createdAt)}</span>
                        <button onClick={(e) => handleDeleteConv(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all cursor-pointer hover:bg-red-500/20"
                          style={{ color: '#ef4444' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* User info + logout at bottom */}
          <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)' }}>
                {user ? getInitials(user.name) : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{user?.name}</div>
                <div className="text-xs truncate" style={{ color: '#8b949e' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={logout}
              className="w-full text-sm py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/10 text-center"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}>
              Se déconnecter
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 scroll-smooth custom-scrollbar">
            {!currentConversation || currentConversation.messages.length === 0 ? (
              /* WELCOME */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-5">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl"
                  style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.2),rgba(0,168,232,.2))', border: '1px solid rgba(0,198,167,.3)' }}>
                  🧠
                </div>
                <h2 className="text-xl font-bold sanovia-gradient-text">Sanovia</h2>
                <p className="text-sm max-w-[380px] leading-relaxed" style={{ color: '#8b949e' }}>
                  Bonjour {user?.name?.split(' ')[0]} ! Je suis votre assistant d&apos;information santé.
                  Je peux vous aider sur des questions de santé, de prévention et de bien-être.
                </p>
                <div className="px-4 py-2.5 rounded-xl text-xs leading-relaxed max-w-[400px]"
                  style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.25)', color: '#fbbf24' }}>
                  ⚠️ Je ne suis pas un médecin. Ces informations sont à titre éducatif.
                  Consultez toujours un professionnel de santé pour votre situation personnelle.
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[500px]">
                  {[
                    { q: 'Comment traiter une petite brûlure ?', cat: 'premiers_secours' },
                    { q: 'Signes de grossesse au premier trimestre', cat: 'grossesse' },
                    { q: 'Symptômes du paludisme', cat: 'general' },
                  ].map(s => (
                    <button key={s.q} onClick={() => { setInputValue(s.q); setCategory(s.cat); inputRef.current?.focus() }}
                      className="text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors text-left max-w-[220px]"
                      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', color: '#8b949e' }}>
                      {s.q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* MESSAGE LIST */
              currentConversation.messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-base"
                      style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.3),rgba(0,168,232,.3))', border: '1px solid rgba(0,198,167,.4)' }}>
                      🧠
                    </div>
                  )}
                  <div className={msg.role === 'user' ? 'text-right' : ''}>
                    <div className="max-w-[65%] max-[768px]:max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                      style={msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', color: '#fff', borderBottomRightRadius: '4px' }
                        : { background: 'var(--card)', border: '1px solid var(--border)', borderBottomLeftRadius: '4px', color: 'var(--foreground)' }
                      }>
                      {msg.content}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: '#8b949e' }}>
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isSendingMessage && (
              <div className="flex gap-2.5 items-end">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-base"
                  style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.3),rgba(0,168,232,.3))', border: '1px solid rgba(0,198,167,.4)' }}>
                  🧠
                </div>
                <div className="px-4 py-0 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderBottomLeftRadius: '4px' }}>
                  <div className="flex gap-1.5 py-3 px-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-3.5 max-[768px]:p-2.5" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
            <div className="flex items-end gap-2.5 px-3 py-2 rounded-xl transition-colors"
              style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
              onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); autoResize(e.target) }}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question de santé..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none max-h-[120px] leading-relaxed py-1 text-sm"
                style={{ color: 'var(--foreground)' }}
              />
              <div className="flex gap-1.5 items-center flex-shrink-0">
                <button className="w-9 h-9 rounded-full bg-transparent cursor-pointer text-lg transition-colors hover:bg-[rgba(0,198,167,.1)]"
                  style={{ color: '#8b949e' }}>
                  🎤
                </button>
                <button onClick={handleSend} disabled={isSendingMessage || !inputValue.trim()}
                  className="w-9 h-9 rounded-full cursor-pointer flex items-center justify-center text-base transition-all disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', color: '#fff' }}>
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
