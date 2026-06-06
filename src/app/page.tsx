'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore, useChatStore } from '@/store'
import { t, LANGUAGES as I18N_LANGUAGES, getLanguageInfo } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'

// ============================================================
// NUMÉROS D'URGENCE CI
// ============================================================
const URGENCES = [
  { icon: '🚑', labelKey: 'urgency.samu', num: '185' },
  { icon: '🔥', labelKey: 'urgency.firefighters', num: '180' },
  { icon: '👮', labelKey: 'urgency.police', num: '111' },
  { icon: '🏥', labelKey: 'urgency.chu_treichville', num: '+225 27 21 24 90 00' },
  { icon: '🏥', labelKey: 'urgency.chu_cocody', num: '+225 27 22 44 08 20' },
  { icon: '🏥', labelKey: 'urgency.chu_yopougon', num: '+225 27 23 46 36 36' },
  { icon: '🏥', labelKey: 'urgency.chu_abidjan', num: '+225 27 22 44 49 00' },
  { icon: '☎️', labelKey: 'urgency.poison', num: '+225 27 21 35 60 20' },
  { icon: '🧠', labelKey: 'urgency.psychiatric', num: '+225 27 22 44 23 11' },
  { icon: '🩸', labelKey: 'urgency.blood', num: '+225 27 22 40 00 91' },
  { icon: '🚨', labelKey: 'urgency.redcross', num: '+225 27 22 32 31 27' },
  { icon: '🌡️', labelKey: 'urgency.healthline', num: '143' },
]

// ============================================================
// LANGUES
// ============================================================
const LANGUAGES = I18N_LANGUAGES

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  ba: 'Baoulé',
  dy: 'Dioula',
  bq: 'Bété'
}

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
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
          <img src="/logo.jpeg" alt="Sanovia" className="w-16 h-16 rounded-2xl mb-4 object-cover" />
          <p className="text-[#8b949e]">{t('loading', 'fr')}</p>
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

  if (view === 'forgot-password') {
    return <ForgotPasswordView />
  }

  if (view === 'reset-password') {
    return <ResetPasswordView />
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
    if (!email || !password) { setError(t('login.errorEmpty', 'fr')); return }
    const result = await login(email, password)
    if (!result.success) setError(result.error || t('login.errorGeneric', 'fr'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="Sanovia" className="w-20 h-20 rounded-2xl mb-4 object-cover" />
          <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sanovia
          </h1>
          <p className="text-[#8b949e] mt-2 text-sm">{t('login.subtitle', 'fr')}</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-7" style={{ background: '#161b22', border: '1px solid #21262d' }}>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-6 text-center">{t('login.title', 'fr')}</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('login.email', 'fr')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="votre@email.com" />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('login.password', 'fr')}</label>
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
              ) : t('login.submit', 'fr')}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setView('forgot-password')} className="text-xs cursor-pointer transition-colors hover:underline" style={{ color: '#8b949e' }}>
              {t('login.forgotPassword', 'fr')}
            </button>
          </div>

          <div className="mt-3 text-center">
            <p className="text-sm text-[#8b949e]">
              {t('login.noAccount', 'fr')}{' '}
              <button onClick={() => setView('register')} className="font-semibold" style={{ color: '#00c6a7' }}>
                {t('login.createAccount', 'fr')}
              </button>
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-[#484f58] mt-6 px-4">
          ⚠️ {t('disclaimer', 'fr')}
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
    if (!name || !email || !password || !confirmPassword) { setError(t('register.errorEmpty', 'fr')); return }
    if (password.length < 8) { setError(t('register.errorPasswordLength', 'fr')); return }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) { setError(t('register.errorPasswordStrength', 'fr')); return }
    if (password !== confirmPassword) { setError(t('register.errorPasswordMismatch', 'fr')); return }
    const result = await register(email, password, name, language)
    if (!result.success) setError(result.error || t('register.errorGeneric', 'fr'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/logo.jpeg" alt="Sanovia" className="w-16 h-16 rounded-2xl mb-3 object-cover" />
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('register.title', 'fr')}
          </h1>
          <p className="text-[#8b949e] mt-1 text-sm">{t('register.subtitle', 'fr')}</p>
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
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('register.name', 'fr')}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="Jean Kouassi" />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('login.email', 'fr')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="votre@email.com" />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('login.password', 'fr')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors pr-10"
                  style={{ background: '#0d1117', border: '1px solid #21262d' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                  onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                  placeholder={t('register.passwordPlaceholder', 'fr')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] text-sm">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('register.confirmPassword', 'fr')}</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder={t('register.confirmPasswordPlaceholder', 'fr')} />
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('register.language', 'fr')}</label>
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
              ) : t('register.submit', 'fr')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-[#8b949e]">
              {t('register.hasAccount', 'fr')}{' '}
              <button onClick={() => setView('login')} className="font-semibold" style={{ color: '#00c6a7' }}>
                {t('register.login', 'fr')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FORGOT PASSWORD VIEW
// ============================================================
function ForgotPasswordView() {
  const { forgotPassword, isLoading, setView } = useAuthStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [devToken, setDevToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setDevToken(null)

    if (!email) { setError(t('forgot.errorEmpty', 'fr')); return }

    const result = await forgotPassword(email)
    if (result.success) {
      setSuccessMsg(t('forgot.success', 'fr'))
      setEmail('')
      // En mode développement, afficher le token
      if (result.devToken) {
        setDevToken(result.devToken)
      }
    } else {
      setError(result.error || t('forgot.errorGeneric', 'fr'))
    }
  }

  const handleUseToken = () => {
    if (devToken) {
      useAuthStore.getState().setResetToken(devToken)
      useAuthStore.getState().setView('reset-password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.2),rgba(0,168,232,.2))', border: '1px solid rgba(0,198,167,.3)' }}>
            <span className="text-5xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sanovia
          </h1>
          <p className="text-[#8b949e] mt-2 text-sm">{t('forgot.subtitle', 'fr')}</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-7" style={{ background: '#161b22', border: '1px solid #21262d' }}>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-2 text-center">{t('forgot.title', 'fr')}</h2>
          <p className="text-sm text-[#8b949e] mb-6 text-center leading-relaxed">
            {t('forgot.description', 'fr')}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {successMsg && !devToken && (
            <div className="mb-4 p-3 rounded-lg text-sm leading-relaxed" style={{ background: 'rgba(0,198,167,.08)', border: '1px solid rgba(0,198,167,.25)', color: '#00c6a7' }}>
              ✅ {successMsg}
            </div>
          )}

          {devToken && (
            <div className="mb-4 p-3 rounded-lg text-sm leading-relaxed" style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.25)', color: '#fbbf24' }}>
              <p className="mb-2">⚙️ <strong>Mode développement</strong> — SMTP non configuré.</p>
              <p className="mb-2 text-xs opacity-80">{successMsg}</p>
              <div className="mt-2 p-2 rounded text-xs font-mono break-all" style={{ background: 'rgba(0,0,0,.3)', color: '#fde68a' }}>
                Token: {devToken}
              </div>
              <button onClick={handleUseToken}
                className="mt-2 w-full py-2 rounded-lg text-xs font-semibold text-black cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                {t('forgot.useToken', 'fr')}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('forgot.email', 'fr')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder="votre@email.com" />
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
              ) : t('forgot.submit', 'fr')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button onClick={() => setView('login')} className="text-sm cursor-pointer transition-colors hover:underline" style={{ color: '#00c6a7' }}>
              {t('forgot.backToLogin', 'fr')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// RESET PASSWORD VIEW
// ============================================================
function ResetPasswordView() {
  const { resetPassword, isLoading, setView, resetToken } = useAuthStore()
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = useAuthStore.getState().resetToken
      if (stored) return stored
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('reset')
      if (urlToken) return urlToken
    }
    return ''
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) { setError(t('reset.errorNoToken', 'fr')); return }
    if (!password || !confirmPassword) { setError(t('reset.errorEmpty', 'fr')); return }
    if (password.length < 8) { setError(t('register.errorPasswordLength', 'fr')); return }
    if (!/[A-Z]/.test(password)) { setError(t('reset.errorPasswordUpper', 'fr')); return }
    if (!/[0-9]/.test(password)) { setError(t('reset.errorPasswordDigit', 'fr')); return }
    if (password !== confirmPassword) { setError(t('register.errorPasswordMismatch', 'fr')); return }

    const result = await resetPassword(token, password, confirmPassword)
    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.error || t('reset.errorGeneric', 'fr'))
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.2),rgba(0,168,232,.2))', border: '1px solid rgba(0,198,167,.3)' }}>
            <span className="text-5xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#e6edf3' }}>{t('reset.successTitle', 'fr')}</h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: '#8b949e' }}>
            {t('reset.successMessage', 'fr')}
          </p>
          <button onClick={() => setView('login')}
            className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)' }}>
            {t('reset.loginButton', 'fr')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(0,198,167,.2),rgba(0,168,232,.2))', border: '1px solid rgba(0,198,167,.3)' }}>
            <span className="text-5xl">🔑</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sanovia
          </h1>
          <p className="text-[#8b949e] mt-2 text-sm">{t('reset.subtitle', 'fr')}</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-7" style={{ background: '#161b22', border: '1px solid #21262d' }}>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-2 text-center">{t('reset.title', 'fr')}</h2>
          <p className="text-sm text-[#8b949e] mb-6 text-center leading-relaxed">
            {t('reset.description', 'fr')}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token input (for dev/manual entry) */}
            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('reset.token', 'fr')}</label>
              <input
                type="text" value={token} onChange={e => setToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-xs text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors font-mono"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                placeholder={t('reset.tokenPlaceholder', 'fr')}
                readOnly={!!resetToken}
              />
              {resetToken && (
                <p className="text-[11px] mt-1" style={{ color: '#484f58' }}>Token pré-rempli (mode développement)</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('reset.password', 'fr')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors pr-10"
                  style={{ background: '#0d1117', border: '1px solid #21262d' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                  onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                  placeholder={t('register.passwordPlaceholder', 'fr')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] text-sm">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map(level => {
                    const filled = level <= getPasswordStrength(password)
                    const colors = ['#ef4444', '#f59e0b', '#eab308', '#00c6a7']
                    return (
                      <div key={level} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: filled ? colors[level - 1] : '#21262d' }} />
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1.5">{t('reset.confirmPassword', 'fr')}</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors pr-10"
                  style={{ background: '#0d1117', border: '1px solid #21262d' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
                  onBlur={e => e.currentTarget.style.borderColor = '#21262d'}
                  placeholder={t('reset.confirmPasswordPlaceholder', 'fr')} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] text-sm">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword && password && confirmPassword !== password && (
                <p className="text-[11px] mt-1" style={{ color: '#ef4444' }}>{t('reset.errorMismatch', 'fr')}</p>
              )}
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
              ) : t('reset.submit', 'fr')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button onClick={() => setView('login')} className="text-sm cursor-pointer transition-colors hover:underline" style={{ color: '#00c6a7' }}>
              {t('forgot.backToLogin', 'fr')}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 rounded-xl text-xs leading-relaxed"
          style={{ background: 'rgba(0,198,167,.06)', border: '1px solid rgba(0,198,167,.15)', color: '#8b949e' }}>
          {t('reset.expiry', 'fr')}
        </div>
      </div>
    </div>
  )
}

function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

// ============================================================
// CATEGORY CONFIG
// ============================================================
const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  general: { icon: '💬', label: 'Santé', color: '#00c6a7' },
  premiers_secours: { icon: '🚑', label: 'Urgences', color: '#ef4444' },
  grossesse: { icon: '🤰', label: 'Grossesse', color: '#a78bfa' },
}

function formatDate(dateStr: string, lang: Language = 'fr'): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return t('date.today', lang)
  if (diffDays === 1) return t('date.yesterday', lang)
  if (diffDays < 7) return t('date.daysAgo', lang, { n: String(diffDays) })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ============================================================
// VOICE RECORDING HOOK
// ============================================================
function useVoiceRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      // Try to use webm first, fallback to mp4, then default
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, options)
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(250) // Collect data every 250ms
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error('Microphone access error:', err)
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions de votre navigateur.')
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('Aucun enregistrement en cours'))
        return
      }

      recorder.onstop = () => {
        const stream = recorder.stream
        stream.getTracks().forEach(t => t.stop())

        // Get MIME type from recorder
        const recordedMime = recorder.mimeType || 'audio/webm'
        let ext = 'webm'
        if (recordedMime.includes('mp4')) ext = 'mp4'
        else if (recordedMime.includes('ogg')) ext = 'ogg'
        else if (recordedMime.includes('wav')) ext = 'wav'

        const blob = new Blob(chunksRef.current, { type: recordedMime })
        chunksRef.current = []
        setIsRecording(false)
        setRecordingTime(0)

        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        // Attach extension for reference
        ;(blob as any).ext = ext
        resolve(blob)
      }

      recorder.stop()

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    })
  }, [])

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      chunksRef.current = []
      const stream = recorder.stream
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.stop()
    }
    setIsRecording(false)
    setRecordingTime(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return {
    isRecording,
    recordingTime,
    isTranscribing,
    setIsTranscribing,
    startRecording,
    stopRecording,
    cancelRecording
  }
}

// ============================================================
// VOICE MESSAGE PLAYER COMPONENT
// ============================================================
function VoiceMessagePlayer({ audioBase64, format = 'mp3', role, language }: {
  audioBase64: string
  format: string
  role: 'user' | 'assistant'
  language: string
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!audioBase64) return

    const mimeType = format === 'wav' ? 'audio/wav' : format === 'mp3' ? 'audio/mpeg' : 'audio/webm'
    const byteChars = atob(audioBase64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
      setIsLoading(false)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setProgress(0)
      cancelAnimationFrame(animFrameRef.current)
    })

    audio.addEventListener('error', () => {
      setIsLoading(false)
      console.error('Audio playback error')
    })

    return () => {
      URL.revokeObjectURL(url)
      audio.pause()
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [audioBase64, format])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      cancelAnimationFrame(animFrameRef.current)
    } else {
      audio.play().then(() => {
        setIsPlaying(true)
        const updateProgress = () => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100)
          }
          animFrameRef.current = requestAnimationFrame(updateProgress)
        }
        updateProgress()
      }).catch(err => {
        console.error('Playback failed:', err)
        setIsPlaying(false)
      })
    }
  }

  const color = role === 'user' ? '#fff' : '#00c6a7'
  const bgColor = role === 'user' ? 'rgba(255,255,255,.2)' : 'rgba(0,198,167,.15)'

  // Waveform bars (simulated)
  const bars = Array.from({ length: 24 }, (_, i) => {
    const h = 6 + Math.sin(i * 0.8) * 4 + Math.cos(i * 1.3) * 3
    return h
  })

  return (
    <div className="flex items-center gap-2.5 min-w-[160px] md:min-w-[200px]">
      {/* Play button */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:scale-105 disabled:opacity-40"
        style={{ background: bgColor, border: `1px solid ${color}40` }}>
        {isLoading ? (
          <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: `${color}40`, borderTopColor: color }} />
        ) : isPlaying ? (
          <div className="flex gap-[2px] items-end h-3">
            <div className="w-[3px] rounded-full" style={{ background: color, height: '6px' }} />
            <div className="w-[3px] rounded-full" style={{ background: color, height: '12px' }} />
          </div>
        ) : (
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path d="M0 0H3V12H0V0ZM4 0H10V12H4V0Z" fill={color} />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-[2px] h-6">
        {bars.map((h, i) => {
          const isActive = progress > (i / bars.length) * 100
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-150"
              style={{
                height: `${h}px`,
                background: isActive ? color : `${color}30`,
                minWidth: '2px'
              }}
            />
          )
        })}
      </div>

      {/* Duration */}
      <span className="text-[11px] flex-shrink-0 w-10 text-right" style={{ color: role === 'user' ? 'rgba(255,255,255,.7)' : '#8b949e' }}>
        {isLoading ? '--:--' : `${formatDuration(duration || 0)}`}
      </span>

      {/* Language badge */}
      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
        style={{ background: bgColor, color, border: `1px solid ${color}30` }}>
        {LANGUAGE_LABELS[language] || 'FR'}
      </span>
    </div>
  )
}

// ============================================================
// TTS PLAY BUTTON (for bot messages)
// ============================================================
function TTSPlayButton({ text, language }: { text: string; language: string }) {
  const lang = (language || 'fr') as Language
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  // Map language codes to BCP 47 voice locale codes for SpeechSynthesis
  const langVoiceMap: Record<string, string> = {
    fr: 'fr-FR',
    ba: 'fr-CI',   // Baoulé — fallback to French (Ivory Coast)
    dy: 'fr-CI',   // Dioula — fallback to French (Ivory Coast)
    bq: 'fr-CI'    // Bété — fallback to French (Ivory Coast)
  }

  const handlePlay = async () => {
    // If already speaking, toggle pause/resume
    if (window.speechSynthesis.speaking) {
      if (isPlaying) {
        window.speechSynthesis.pause()
        setIsPlaying(false)
      } else {
        window.speechSynthesis.resume()
        setIsPlaying(true)
      }
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('sanoovia_token')
      if (!token) return

      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text, language })
      })
      const data = await res.json()
      if (data.success) {
        const textToSpeak = data.data.text || text

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(textToSpeak)
        utterance.lang = langVoiceMap[language] || 'fr-FR'
        utterance.rate = 0.95
        utterance.pitch = 1

        // Try to find a matching voice
        const voices = window.speechSynthesis.getVoices()
        const targetLang = langVoiceMap[language] || 'fr-FR'
        const match = voices.find(v => v.lang === targetLang)
          || voices.find(v => v.lang.startsWith(targetLang.split('-')[0]))
        if (match) utterance.voice = match

        utterance.onstart = () => setIsPlaying(true)
        utterance.onend = () => {
          setIsPlaying(false)
          setAudioBase64(null)
        }
        utterance.onerror = () => {
          setIsPlaying(false)
          setAudioBase64(null)
          console.error('TTS playback error')
        }

        window.speechSynthesis.speak(utterance)
        setAudioBase64('playing')  // Mark as active (for UI toggle)
      }
    } catch (err) {
      console.error('TTS generation error:', err)
    }
    setIsLoading(false)
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setAudioBase64(null)
  }

  return (
    <>
      {!audioBase64 ? (
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(0,198,167,.1)', border: '1px solid rgba(0,198,167,.25)', color: '#00c6a7' }}
          title={t('tts.listen', lang)}>
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-[1.5px] rounded-full animate-spin" style={{ borderColor: 'rgba(0,198,167,.3)', borderTopColor: '#00c6a7' }} />
              {t('tts.generating', lang)}
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              {t('tts.listenIn', lang, { lang: getLanguageInfo(lang).label })}
            </>
          )}
        </button>
      ) : (
        <button
          onClick={isPlaying ? handleStop : handlePlay}
          className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
          style={{
            background: isPlaying ? 'rgba(0,198,167,.2)' : 'rgba(0,198,167,.1)',
            border: isPlaying ? '1px solid rgba(0,198,167,.4)' : '1px solid rgba(0,198,167,.25)',
            color: '#00c6a7'
          }}
          title={isPlaying ? t('tts.stop', lang) : t('tts.listen', lang)}>
          {isPlaying ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              {t('tts.stop', lang)}
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {t('tts.replay', lang)}
            </>
          )}
        </button>
      )}
    </>
  )
}

// ============================================================
// CHAT VIEW
// ============================================================
function ChatView() {
  const { user, logout } = useAuthStore()
  const { conversations, currentConversation, fetchConversations, createConversation, selectConversation, sendMessage, deleteConversation, clearCurrent, isSendingMessage, isLoadingMessages, sendError, clearSendError } = useChatStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [inputValue, setInputValue] = useState('')
  // Autocomplétion
  const [suggestions,    setSuggestions]    = useState<string[]>([])
  const [showSugg,       setShowSugg]       = useState(false)
  const [suggIndex,      setSuggIndex]      = useState(-1)
  const [loadingSugg,    setLoadingSugg]    = useState(false)
  const autocompleteRef  = useRef<HTMLDivElement>(null)
  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [category, setCategory] = useState<string>('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Voice recording
  const {
    isRecording,
    recordingTime,
    isTranscribing,
    setIsTranscribing,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder()

  const currentLang = (user?.language || 'fr') as Language

  // Track voice messages for display: { messageId: { audioBase64, format } }
  const [voiceMessages, setVoiceMessages] = useState<Record<string, { audio: string; format: string }>>({})
  const [transcriptionError, setTranscriptionError] = useState('')
  // Feedback apprentissage — tracker quels messages ont été approuvés/rejetés
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set())
  const [feedbackNegative, setFeedbackNegative] = useState<Set<string>>(new Set())
  const [correcting, setCorrecting] = useState<string | null>(null)
  const [correctionText, setCorrectionText] = useState('')
  const [correctionValidating, setCorrectionValidating] = useState(false)
  const [correctionResult, setCorrectionResult] = useState<Record<string, {
    status: 'approved' | 'rejected' | 'uncertain'
    reason: string
    confidence: number
    sources: string[]
  }>>({})

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages?.length])

  // ─── Autocomplétion ────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (val: string) => {
    if (val.trim().length < 2) { setSuggestions([]); setShowSugg(false); return }
    setLoadingSugg(true)
    try {
      const res  = await fetch('/api/autocomplete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ input: val, language: currentLang }),
      })
      const data = await res.json()
      if (data.suggestions?.length) {
        setSuggestions(data.suggestions)
        setShowSugg(true)
        setSuggIndex(-1)
      } else {
        setShowSugg(false)
      }
    } catch { setShowSugg(false) }
    finally  { setLoadingSugg(false) }
  }, [currentLang])

  const handleInputChange = useCallback((val: string) => {
    setInputValue(val)
    setSuggIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setSuggestions([]); setShowSugg(false); return }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350)
  }, [fetchSuggestions])

  const applySuggestion = useCallback((s: string) => {
    setInputValue(s)
    setShowSugg(false)
    setSuggestions([])
    inputRef.current?.focus()
  }, [])

  const handleSuggKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSugg) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSuggIndex(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSuggIndex(i => Math.max(i - 1, -1)) }
    if (e.key === 'Tab' || e.key === 'Enter') {
      if (suggIndex >= 0) { e.preventDefault(); applySuggestion(suggestions[suggIndex]) }
    }
    if (e.key === 'Escape')     { setShowSugg(false) }
  }, [showSugg, suggestions, suggIndex, applySuggestion])

  // Fermer suggestions si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node))
        setShowSugg(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleApprove = async (msg: any) => {
    if (feedbackGiven.has(msg.id) || feedbackNegative.has(msg.id)) return
    const msgs = currentConversation?.messages ?? []
    const idx = msgs.findIndex((m: any) => m.id === msg.id)
    const question = idx > 0 ? msgs[idx - 1]?.content ?? '' : ''
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          response: msg.content,
          language: msg.language ?? currentLang,
          category,
          type: 'positive',
        }),
      })
      setFeedbackGiven(prev => new Set([...prev, msg.id]))
    } catch (err) {
      console.error('[Feedback] Erreur:', err)
    }
  }

  // Signaler une mauvaise réponse
  const handleReject = (msg: any) => {
    if (feedbackGiven.has(msg.id) || feedbackNegative.has(msg.id)) return
    setCorrecting(msg.id)
    setCorrectionText('')
  }

  // Soumettre la correction
  const handleSubmitCorrection = async (msg: any) => {
    if (!correctionText.trim() || correctionValidating) return
    const msgs = currentConversation?.messages ?? []
    const idx = msgs.findIndex((m: any) => m.id === msg.id)
    const question = idx > 0 ? msgs[idx - 1]?.content ?? '' : ''

    setCorrectionValidating(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          response:         correctionText.trim(),
          language:         msg.language ?? currentLang,
          category,
          type:             'correction',
          originalResponse: msg.content,
        }),
      })

      const data = await res.json()
      const payload = data?.data ?? data

      // Stocker le résultat de validation pour affichage
      setCorrectionResult(prev => ({
        ...prev,
        [msg.id]: {
          status:     payload.status     ?? 'uncertain',
          reason:     payload.reason     ?? '',
          confidence: payload.confidence ?? 0,
          sources:    payload.sources    ?? [],
        }
      }))

      setFeedbackNegative(prev => new Set([...prev, msg.id]))
      setCorrecting(null)
      setCorrectionText('')

    } catch (err) {
      console.error('[Feedback Correction] Erreur:', err)
      setCorrectionResult(prev => ({
        ...prev,
        [msg.id]: { status: 'uncertain', reason: 'Erreur réseau', confidence: 0, sources: [] }
      }))
    } finally {
      setCorrectionValidating(false)
    }
  }

  // Theme toggle
  const toggleTheme = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
    document.documentElement.classList.toggle('light')
  }

  // New conversation
  const handleNewConv = async () => {
    clearCurrent()
    setCategory('general')
    setInputValue('')
    setVoiceMessages({})
    setTranscriptionError('')
    closeSidebar()
    inputRef.current?.focus()
  }

  // Send text message
  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isSendingMessage) return
    setTranscriptionError('')
    clearSendError()

    if (!currentConversation) {
      const conv = await createConversation(text.substring(0, 60) + (text.length > 60 ? '...' : ''), category, currentLang)
      if (conv) {
        setInputValue('')
        if (inputRef.current) inputRef.current.style.height = 'auto'
        const success = await useChatStore.getState().sendMessage(text)
        if (!success) {
          // sendMessage already shows toast + error message in chat
        }
      }
      return
    }

    setInputValue('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    const success = await sendMessage(text)
    if (!success) {
      // Error already handled by store (toast + inline error message)
    }
  }

  // Handle voice recording completion
  const handleVoiceRecorded = async () => {
    try {
      const audioBlob = await stopRecording()
      if (audioBlob.size < 1000) {
        setTranscriptionError(t('voice.tooShort', currentLang))
        return
      }

      setIsTranscribing(true)
      setTranscriptionError('')

      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1] // Remove data:audio/...;base64, prefix

        const token = localStorage.getItem('sanoovia_token')
        if (!token) {
          setIsTranscribing(false)
          setTranscriptionError('Session expirée. Veuillez vous reconnecter.')
          return
        }

        try {
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              audio: base64Data,
              language: user?.language || 'fr'
            })
          })
          const data = await res.json()

          if (data.success && data.data.text) {
            const transcribedText = data.data.text

            // Store voice audio for the user message
            const tempId = 'voice_' + Date.now()
            setVoiceMessages(prev => ({
              ...prev,
              [tempId]: { audio: base64Data, format: audioBlob.ext || 'webm' }
            }))

            // Send as text message
            if (!currentConversation) {
              const conv = await createConversation(
                transcribedText.substring(0, 60) + (transcribedText.length > 60 ? '...' : ''),
                category,
                currentLang
              )
              if (conv) {
                await useChatStore.getState().sendMessage(transcribedText)
                // Map the real message ID to the voice
                const msgs = useChatStore.getState().currentConversation?.messages
                if (msgs && msgs.length > 0) {
                  const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')
                  if (lastUserMsg) {
                    setVoiceMessages(prev => {
                      const next = { ...prev }
                      next[lastUserMsg.id] = next[tempId]
                      delete next[tempId]
                      return next
                    })
                  }
                }
              }
            } else {
              await sendMessage(transcribedText)
              // Map the real message ID to the voice
              const msgs = useChatStore.getState().currentConversation?.messages
              if (msgs && msgs.length > 0) {
                const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')
                if (lastUserMsg) {
                  setVoiceMessages(prev => {
                    const next = { ...prev }
                    next[lastUserMsg.id] = next[tempId]
                    delete next[tempId]
                    return next
                  })
                }
              }
            }
          } else {
            setTranscriptionError(data.data?.message || t('voice.noSpeech', currentLang))
          }
        } catch (err) {
          console.error('Transcription error:', err)
          setTranscriptionError(t('voice.transcriptionError', currentLang))
        }

        setIsTranscribing(false)
      }
    } catch (err) {
      console.error('Recording error:', err)
      setIsTranscribing(false)
    }
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
            🚨 {t('urgency.title', currentLang)}
          </span>
        </div>
        <div className="flex-1 overflow-hidden urgences-mask">
          <div className="flex w-max urgences-scroll">
            {[...URGENCES, ...URGENCES].map((u, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 mr-6 text-xs text-white whitespace-nowrap px-2.5 py-0.5 rounded-full cursor-default transition-colors"
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
                {u.icon} <span className="text-[#fca5a5] font-semibold">{t(u.labelKey, currentLang)}</span> —{' '}
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
            <img src="/logo.jpeg" alt="Sanovia" className="w-8 h-8 rounded-lg object-cover" />
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
                {CATEGORY_CONFIG[currentConversation.category]?.icon} {t('category.' + currentConversation.category, currentLang)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector — desktop only */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px]"
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

          <button onClick={logout} className="hidden md:block text-[13px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/10"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            {t('chat.logout', currentLang)}
          </button>

          <div className="hidden md:flex w-[34px] h-[34px] rounded-full items-center justify-center text-xs font-bold text-white flex-shrink-0"
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
                  {cfg.icon}<br />{t('category.' + key, currentLang)}
                </button>
              ))}
            </div>

            {/* New conversation button */}
            <button onClick={handleNewConv}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)' }}>
              <span className="text-base font-bold">+</span> {t('chat.newChat', currentLang)}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#484f58' }}>
              📋 {t('chat.history', currentLang)} {conversations.length}
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
                  {t('chat.noConversations', currentLang)}
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const catCfg = CATEGORY_CONFIG[conv.category] || CATEGORY_CONFIG.general
                const isActive = currentConversation?.id === conv.id
                return (
                  <div key={conv.id}
                    onClick={() => { selectConversation(conv.id); closeSidebar(); setVoiceMessages({}) }}
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
                            : t('chat.newConversation', currentLang)
                          }
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px]" style={{ color: '#484f58' }}>{formatDate(conv.updatedAt || conv.createdAt, currentLang)}</span>
                        <button onClick={(e) => handleDeleteConv(conv.id, e)}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all cursor-pointer hover:bg-red-500/20"
                          style={{ color: '#ef4444' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* User info + language + logout at bottom */}
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
            {/* Language selector in sidebar (always visible, useful on mobile) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] mb-2.5"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)' }}>
              <select
                value={user?.language || 'fr'}
                onChange={e => handleChangeLanguage(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none cursor-pointer"
                style={{ color: 'var(--foreground)', fontSize: '13px' }}>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} style={{ background: '#161b22', color: '#e6edf3' }}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={logout}
              className="w-full text-sm py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/10 text-center"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}>
              {t('chat.logout', currentLang)}
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-5 flex flex-col gap-4 md:gap-5 scroll-smooth custom-scrollbar">
            {!currentConversation || currentConversation.messages.length === 0 ? (
              /* WELCOME */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-5">
                <img src="/logo.jpeg" alt="Sanovia" className="w-20 h-20 rounded-2xl object-cover" />
                <h2 className="text-xl font-bold sanovia-gradient-text">Sanovia</h2>
                <p className="text-sm max-w-[380px] leading-relaxed whitespace-pre-line" style={{ color: '#8b949e' }}>
                  {t('chat.welcome', currentLang, { name: user?.name || '' })}
                </p>

                {/* Voice feature hint */}
                <div className="px-4 py-2.5 rounded-xl text-xs leading-relaxed max-w-[400px]"
                  style={{ background: 'rgba(0,198,167,.08)', border: '1px solid rgba(0,198,167,.25)', color: '#00c6a7' }}>
                  🎤 {t('chat.voiceHint', currentLang, { lang: getLanguageInfo(currentLang).label })}
                </div>

                <div className="px-4 py-2.5 rounded-xl text-xs leading-relaxed max-w-[400px]"
                  style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.25)', color: '#fbbf24' }}>
                  ⚠️ {t('chat.disclaimer', currentLang)}
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[500px]">
                  {[
                    { q: t('chat.suggestion1', currentLang), cat: 'premiers_secours' },
                    { q: t('chat.suggestion2', currentLang), cat: 'grossesse' },
                    { q: t('chat.suggestion3', currentLang), cat: 'general' },
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
              currentConversation.messages.map(msg => {
                // Error message — alerte rouge claire dans le chat
                if (msg.role === 'error') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="max-w-[85%] md:max-w-[70%] w-full px-4 py-3 rounded-2xl text-sm"
                        style={{
                          background: 'rgba(239,68,68,.1)',
                          border: '1px solid rgba(239,68,68,.3)',
                          color: '#fca5a5',
                          borderBottomLeftRadius: '4px',
                          borderBottomRightRadius: '4px',
                        }}>
                        <div className="flex items-start gap-2.5">
                          <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                          <div className="flex-1">
                            <div className="font-semibold text-xs mb-1" style={{ color: '#f87171' }}>Erreur</div>
                            <div className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">{msg.content}</div>
                            <button onClick={clearSendError}
                              className="mt-2 text-xs px-3 py-1 rounded-lg cursor-pointer transition-opacity hover:opacity-100 opacity-70"
                              style={{ background: 'rgba(239,68,68,.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.25)' }}>
                              Réessayer
                            </button>
                          </div>
                          <button onClick={() => {
                            // Remove this error message from the conversation
                            const conv = useChatStore.getState().currentConversation
                            if (conv) {
                              useChatStore.setState({
                                currentConversation: {
                                  ...conv,
                                  messages: conv.messages.filter(m => m.id !== msg.id)
                                }
                              })
                            }
                          }} className="cursor-pointer opacity-50 hover:opacity-100 flex-shrink-0 mt-0.5">✕</button>
                        </div>
                      </div>
                    </div>
                  )
                }

                const voiceData = voiceMessages[msg.id]
                const isVoiceMessage = !!voiceData

                return (
                  <div key={msg.id} className={`flex gap-2.5 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <img src="/logo.jpeg" alt="Sanovia" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                    )}
                    <div className={msg.role === 'user' ? 'text-right' : ''}>
                      <div className="max-w-[85%] md:max-w-[65%] px-3.5 py-2.5 md:px-4 md:py-3 rounded-2xl text-sm leading-relaxed"
                        style={msg.role === 'user'
                          ? { background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', color: '#fff', borderBottomRightRadius: '4px' }
                          : { background: 'var(--card)', border: '1px solid var(--border)', borderBottomLeftRadius: '4px', color: 'var(--foreground)' }
                        }>
                        {/* Voice message player for user messages */}
                        {isVoiceMessage ? (
                          <>
                            <VoiceMessagePlayer
                              audioBase64={voiceData.audio}
                              format={voiceData.format}
                              role="user"
                              language={msg.language}
                            />
                            {/* Show transcription below the audio player */}
                            <div className="mt-2 pt-2 text-xs opacity-80 whitespace-pre-wrap"
                              style={{ borderTop: '1px solid rgba(255,255,255,.15)' }}>
                              {msg.content}
                            </div>
                          </>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>

                      {/* TTS + Feedback buttons for assistant messages */}
                      {msg.role === 'assistant' && (
                        <div className="mt-1">
                          {/* Boutons feedback */}
                          {!feedbackGiven.has(msg.id) && !feedbackNegative.has(msg.id) && correcting !== msg.id && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <TTSPlayButton text={msg.content} language={msg.language} />
                              <button
                                onClick={() => handleApprove(msg)}
                                title="Bonne réponse — l'IA s'en souviendra"
                                className="text-[11px] px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95"
                                style={{ background: 'rgba(0,198,167,.08)', color: '#8b949e', border: '1px solid rgba(0,198,167,.15)' }}>
                                👍 Bonne réponse
                              </button>
                              <button
                                onClick={() => handleReject(msg)}
                                title="Mauvaise réponse — corriger pour améliorer l'IA"
                                className="text-[11px] px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95"
                                style={{ background: 'rgba(239,68,68,.08)', color: '#8b949e', border: '1px solid rgba(239,68,68,.15)' }}>
                                👎 Pas bon
                              </button>
                            </div>
                          )}

                          {/* Confirmations */}
                          {feedbackGiven.has(msg.id) && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <TTSPlayButton text={msg.content} language={msg.language} />
                              <span className="text-[11px] px-2 py-1 rounded-lg"
                                style={{ background: 'rgba(0,198,167,.12)', color: '#00c6a7' }}>
                                ✅ Approuvé — merci !
                              </span>
                            </div>
                          )}
                          {feedbackNegative.has(msg.id) && (() => {
                            const r = correctionResult[msg.id]
                            if (!r) return (
                              <div className="flex items-center gap-2 flex-wrap">
                                <TTSPlayButton text={msg.content} language={msg.language} />
                                <span className="text-[11px] px-2 py-1 rounded-lg"
                                  style={{ background: 'rgba(239,68,68,.12)', color: '#f87171' }}>
                                  🔄 Correction envoyée
                                </span>
                              </div>
                            )
                            // Approuvé
                            if (r.status === 'approved') return (
                              <div className="mt-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <TTSPlayButton text={msg.content} language={msg.language} />
                                  <span className="text-[11px] px-2 py-1 rounded-lg"
                                    style={{ background: 'rgba(0,198,167,.12)', color: '#00c6a7' }}>
                                    ✅ Correction validée ({r.confidence}%) — l'IA va s'améliorer !
                                  </span>
                                </div>
                                {r.reason && (
                                  <p className="text-[10px] mt-1 ml-1" style={{ color: '#484f58' }}>
                                    🔍 {r.reason}
                                    {r.sources?.length > 0 && ` · Sources : ${r.sources.slice(0,2).join(', ')}`}
                                  </p>
                                )}
                              </div>
                            )
                            // Rejeté
                            if (r.status === 'rejected') return (
                              <div className="mt-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <TTSPlayButton text={msg.content} language={msg.language} />
                                  <span className="text-[11px] px-2 py-1 rounded-lg"
                                    style={{ background: 'rgba(239,68,68,.12)', color: '#f87171' }}>
                                    ❌ Correction rejetée par l'IA
                                  </span>
                                </div>
                                {r.reason && (
                                  <p className="text-[10px] mt-1 ml-1" style={{ color: '#f87171', opacity: 0.7 }}>
                                    Raison : {r.reason}
                                  </p>
                                )}
                              </div>
                            )
                            // Incertain
                            return (
                              <div className="flex items-center gap-2 flex-wrap">
                                <TTSPlayButton text={msg.content} language={msg.language} />
                                <span className="text-[11px] px-2 py-1 rounded-lg"
                                  style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b' }}>
                                  ⚠️ Correction incertaine — non utilisée ({r.confidence}%)
                                </span>
                              </div>
                            )
                          })()}

                          {/* Zone de correction */}
                          {correcting === msg.id && (
                            <div className="mt-2 rounded-xl p-3"
                              style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)' }}>
                              <p className="text-[11px] mb-1" style={{ color: '#f87171' }}>
                                ✏️ Quelle aurait été la bonne réponse ?
                              </p>
                              <p className="text-[10px] mb-2" style={{ color: '#484f58' }}>
                                🔍 L'IA vérifiera automatiquement ta correction sur internet avant de l'utiliser.
                              </p>
                              <textarea
                                value={correctionText}
                                onChange={e => setCorrectionText(e.target.value)}
                                placeholder="Écris la réponse correcte ici..."
                                rows={3}
                                disabled={correctionValidating}
                                className="w-full text-[12px] px-3 py-2 rounded-lg resize-none outline-none disabled:opacity-50"
                                style={{
                                  background: 'rgba(255,255,255,.05)',
                                  color: '#e6edf3',
                                  border: '1px solid rgba(255,255,255,.08)',
                                }}
                              />
                              {correctionValidating && (
                                <div className="flex items-center gap-2 mt-2 text-[11px]"
                                  style={{ color: '#f59e0b' }}>
                                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                  🔍 L'IA vérifie ta correction sur internet…
                                </div>
                              )}
                              {!correctionValidating && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleSubmitCorrection(msg)}
                                    disabled={!correctionText.trim()}
                                    className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40"
                                    style={{ background: '#00c6a7', color: '#fff' }}>
                                    Envoyer la correction
                                  </button>
                                  <button
                                    onClick={() => { setCorrecting(null); setCorrectionText('') }}
                                    className="text-[11px] px-3 py-1.5 rounded-lg transition-all"
                                    style={{ background: 'rgba(255,255,255,.06)', color: '#8b949e' }}>
                                    Annuler
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Server metadata badge — montre les infos brutes du serveur */}
                      {msg.role === 'assistant' && msg.serverMeta && (
                        <div className="flex items-center gap-2 mt-1.5 px-2 py-1 rounded-lg text-[10px]"
                          style={{ background: 'rgba(0,198,167,.06)', color: '#484f58' }}>
                          <span>{msg.serverMeta.source === 'openrouter' ? '⚡' : msg.serverMeta.source === 'gemini' ? '🔮' : msg.serverMeta.source === 'cache' ? '💾' : msg.serverMeta.source === 'offline' ? '📦' : '💬'}</span>
                          <span>{msg.serverMeta.model}</span>
                          <span>{msg.serverMeta.duration}ms</span>
                          {msg.serverMeta.cached && <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,198,167,.12)', color: '#00c6a7' }}>cache</span>}
                          {msg.serverMeta.errors.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,.12)', color: '#f87171' }}>
                              {msg.serverMeta.errors.length} err.
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: '#8b949e' }}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {/* Language badge */}
                        <span className="text-[9px] px-1 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,.06)', color: '#484f58' }}>
                          {LANGUAGE_LABELS[msg.language] || 'FR'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {/* Typing / Transcribing indicator */}
            {isSendingMessage && (
              <div className="flex gap-2.5 items-end">
                <img src="/logo.jpeg" alt="Sanovia" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
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

          {/* Transcription error */}
          {transcriptionError && (
            <div className="px-4 pb-1">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#fca5a5' }}>
                <span>{transcriptionError}</span>
                <button onClick={() => setTranscriptionError('')} className="cursor-pointer ml-2 opacity-60 hover:opacity-100">✕</button>
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          <div className="p-2.5 md:p-3.5" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
            {/* Recording overlay */}
            {isRecording && (
              <div className="mb-2.5 mx-1 p-3 rounded-xl flex flex-col gap-2.5"
                style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)' }}>
                {/* Top row: indicator + timer */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="recording-pulse-wrapper">
                      <div className="w-3 h-3 rounded-full bg-[#ef4444] recording-pulse" />
                    </div>
                    <span className="text-xs font-semibold text-[#fca5a5]">{t('voice.recording', currentLang)}</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-lg font-mono font-bold tracking-wider" style={{ color: '#fca5a5' }}>
                      {formatDuration(recordingTime)}
                    </span>
                  </div>

                  {/* Waveform (hidden on very small screens) */}
                  <div className="hidden sm:flex items-center gap-[3px] h-6 flex-shrink-0">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[3px] rounded-full recording-bar"
                        style={{
                          animationDelay: `${i * 0.08}s`,
                          background: '#ef4444'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom row: buttons — always visible on mobile */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={cancelRecording}
                    className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', color: '#8b949e' }}
                    title={t('voice.cancelTooltip', currentLang)}>
                    {t('voice.cancel', currentLang)}
                  </button>
                  <button
                    onClick={handleVoiceRecorded}
                    disabled={recordingTime < 1}
                    className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all disabled:opacity-30 hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', color: '#fff' }}
                    title={t('voice.sendTooltip', currentLang)}>
                    {t('voice.send', currentLang)}
                  </button>
                </div>
              </div>
            )}

            {/* Transcribing indicator */}
            {isTranscribing && (
              <div className="mb-2.5 mx-1 p-3 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(0,198,167,.08)', border: '1px solid rgba(0,198,167,.25)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,198,167,.3)', borderTopColor: '#00c6a7' }} />
                  <span className="text-xs font-medium" style={{ color: '#00c6a7' }}>
                    {t('voice.transcribing', currentLang, { lang: getLanguageInfo(currentLang).label })}
                  </span>
                </div>
                <div className="flex-1" />
                <div className="flex gap-[2px] h-4 items-center">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-[2px] rounded-full animate-pulse"
                      style={{
                        height: `${8 + Math.sin(i * 1.2) * 6}px`,
                        background: '#00c6a7',
                        animationDelay: `${i * 0.15}s`
                      }} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2.5 px-3 py-2 rounded-xl transition-colors"
              style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
              onFocus={e => e.currentTarget.style.borderColor = '#00c6a7'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div ref={autocompleteRef} className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => { handleInputChange(e.target.value); autoResize(e.target) }}
                  onKeyDown={e => { handleSuggKeyDown(e); handleKeyDown(e) }}
                  placeholder={t('chat.placeholder', currentLang)}
                  rows={1}
                  className="w-full bg-transparent border-none outline-none resize-none max-h-[120px] leading-relaxed py-1 text-sm"
                  style={{ color: 'var(--foreground)' }}
                />
                {/* ── Dropdown autocomplétion ── */}
                {showSugg && suggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden z-50 shadow-xl"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    {loadingSugg && (
                      <div className="px-3 py-2 text-[11px] flex items-center gap-1.5" style={{ color: '#484f58' }}>
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Suggestions en cours…
                      </div>
                    )}
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onMouseDown={e => { e.preventDefault(); applySuggestion(s) }}
                        className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 transition-colors"
                        style={{
                          background:  i === suggIndex ? 'rgba(0,198,167,.12)' : 'transparent',
                          color:       i === suggIndex ? '#00c6a7' : 'var(--foreground)',
                          borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                        <span style={{ color: '#484f58', fontSize: 10 }}>🩺</span>
                        <span className="truncate">{s}</span>
                        {i === suggIndex && (
                          <span className="ml-auto text-[9px] px-1 py-0.5 rounded shrink-0"
                            style={{ background: 'rgba(0,198,167,.15)', color: '#00c6a7' }}>
                            ↵
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="px-3 py-1 text-[9px] flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border)', color: '#484f58' }}>
                      <span>↑↓ naviguer · Tab accepter · Esc fermer</span>
                      <button onMouseDown={() => setShowSugg(false)} className="hover:text-white transition-colors">✕</button>
                    </div>
                  </div>
                )}
              </div>
              </div>
              <div className="flex gap-1.5 items-center flex-shrink-0">
                {/* Microphone button */}
                {!isRecording && !isTranscribing && (
                  <button
                    onClick={startRecording}
                    disabled={isSendingMessage}
                    className="w-9 h-9 rounded-full bg-transparent cursor-pointer transition-all hover:bg-[rgba(0,198,167,.1)] disabled:opacity-35 disabled:cursor-not-allowed group relative"
                    style={{ color: isSendingMessage ? '#484f58' : '#00c6a7' }}
                    title={t('voice.micTooltip', currentLang)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="group-hover:scale-110 transition-transform">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                    {/* Language hint tooltip */}
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#8b949e' }}>
                      🎤 {getLanguageInfo(currentLang).label}
                    </span>
                  </button>
                )}
                <button onClick={handleSend} disabled={isSendingMessage || !inputValue.trim() || isRecording || isTranscribing}
                  className="w-9 h-9 rounded-full cursor-pointer flex items-center justify-center text-base transition-all disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #00c6a7, #00a8e8)', color: '#fff' }}>
                  ➤
                </button>
              </div>
            </div>

            {/* Voice hint bar */}
            <div className="hidden md:flex items-center justify-center gap-1.5 mt-2 text-[10px]" style={{ color: '#484f58' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
              <span>{t('voice.languageHint', currentLang, { lang: getLanguageInfo(currentLang).label })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}