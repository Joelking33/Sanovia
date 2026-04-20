'use client'

import { useState, useSyncExternalStore } from 'react'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface Endpoint {
  method: Method
  path: string
  description: string
  auth: boolean
  body?: string
}

const endpoints: Endpoint[] = [
  // Auth
  { method: 'POST', path: '/api/auth/register', description: 'Inscription avec email et mot de passe', auth: false, body: '{ "email": "...", "password": "...", "name": "...", "language": "fr" }' },
  { method: 'POST', path: '/api/auth/login', description: 'Connexion avec email et mot de passe', auth: false, body: '{ "email": "...", "password": "..." }' },
  { method: 'POST', path: '/api/auth/google', description: 'Authentification via Google OAuth', auth: false, body: '{ "idToken": "google_id_token", "language": "fr" }' },
  { method: 'GET', path: '/api/auth/me', description: 'Profil de l\'utilisateur connecté', auth: true },
  // Users
  { method: 'GET', path: '/api/users/profile', description: 'Récupérer le profil', auth: true },
  { method: 'PATCH', path: '/api/users/profile', description: 'Mettre à jour le profil', auth: true, body: '{ "name": "...", "phone": "...", "avatarUrl": "..." }' },
  { method: 'GET', path: '/api/users/language', description: 'Langue préférée', auth: true },
  { method: 'PATCH', path: '/api/users/language', description: 'Modifier la langue', auth: true, body: '{ "language": "ba" }' },
  // Conversations
  { method: 'GET', path: '/api/conversations', description: 'Liste des conversations', auth: true },
  { method: 'POST', path: '/api/conversations', description: 'Nouvelle conversation', auth: true, body: '{ "title": "...", "category": "premiers_secours", "language": "fr" }' },
  { method: 'GET', path: '/api/conversations/[id]', description: 'Détails d\'une conversation', auth: true },
  { method: 'PATCH', path: '/api/conversations/[id]', description: 'Mettre à jour une conversation', auth: true, body: '{ "title": "...", "isArchived": false }' },
  { method: 'DELETE', path: '/api/conversations/[id]', description: 'Supprimer une conversation', auth: true },
  // Messages
  { method: 'GET', path: '/api/conversations/[id]/messages', description: 'Historique des messages', auth: true },
  { method: 'POST', path: '/api/conversations/[id]/messages', description: 'Envoyer un message + réponse IA', auth: true, body: '{ "content": "Comment traiter une brûlure ?" }' },
  // Santé
  { method: 'GET', path: '/api/health/categories', description: 'Catégories de santé', auth: false },
  { method: 'GET', path: '/api/health/tips', description: 'Conseils de santé', auth: false },
  { method: 'POST', path: '/api/health/tips', description: 'Question santé rapide (sans conversation)', auth: false, body: '{ "question": "...", "category": "premiers_secours", "language": "dy" }' },
]

const methodColors: Record<Method, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PATCH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const categories = [
  { name: 'Authentification', icon: '🔐', endpoints: endpoints.filter(e => e.path.startsWith('/api/auth')) },
  { name: 'Utilisateurs', icon: '👤', endpoints: endpoints.filter(e => e.path.startsWith('/api/users')) },
  { name: 'Conversations', icon: '💬', endpoints: endpoints.filter(e => e.path.startsWith('/api/conversations') && !e.path.includes('/messages')) },
  { name: 'Messages & IA', icon: '🤖', endpoints: endpoints.filter(e => e.path.includes('/messages')) },
  { name: 'Santé', icon: '🏥', endpoints: endpoints.filter(e => e.path.startsWith('/api/health')) },
]

export default function Home() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Authentification')
  const [copiedPath, setCopiedPath] = useState<string | null>(null)
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ''
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPath(text)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-emerald-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sanoovia API</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Backend API v1.0 — IA de santé multilingue</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
              🟢 En ligne
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-sm border border-emerald-100 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🩺</div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Bienvenue sur l&apos;API Sanoovia
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Sanoovia est une intelligence artificielle spécialisée dans les conseils de santé de premiers
                secours et de grossesse. Elle fonctionne en <strong>Français</strong>, <strong>Baoulé</strong>,
                <strong> Dioula</strong> et <strong>Bété</strong>.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">Langues: fr, ba, dy, bq</span>
                <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">Catégories: premiers_secours, grossesse</span>
                <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">Auth: JWT + OAuth Google</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categories.map(cat => (
          <div key={cat.name} className="mb-4">
            <button
              onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-emerald-100 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cat.endpoints.length} endpoints</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategory === cat.name ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedCategory === cat.name && (
              <div className="mt-2 space-y-2 pl-2">
                {cat.endpoints.map((ep, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800/80 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code
                        className="text-sm text-gray-800 dark:text-gray-200 font-mono flex-1 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => copyToClipboard(ep.path)}
                        title="Cliquer pour copier"
                      >
                        {ep.path}
                        {copiedPath === ep.path && (
                          <span className="ml-2 text-xs text-emerald-500">✓ Copié!</span>
                        )}
                      </code>
                      {ep.auth && (
                        <span className="px-2 py-0.5 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md font-medium">
                          🔑 Auth
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ep.description}</p>
                    {ep.body && (
                      <pre className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs text-gray-700 dark:text-gray-300 font-mono overflow-x-auto">
                        {ep.body}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Quick Test Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-emerald-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚡ Test rapide</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <QuickTest
              title="Inscription"
              curl={`curl -X POST ${origin}/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"Password123","name":"Test User"}'`}
            />
            <QuickTest
              title="Connexion"
              curl={`curl -X POST ${origin}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"Password123"}'`}
            />
            <QuickTest
              title="Question Santé"
              curl={`curl -X POST ${origin}/api/health/tips \\
  -H "Content-Type: application/json" \\
  -d '{"question":"Comment traiter une petite brûlure?","category":"premiers_secours","language":"fr"}'`}
            />
            <QuickTest
              title="Catégories Santé"
              curl={`curl ${origin}/api/health/categories?language=fr`}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-emerald-100 dark:border-gray-700">
        Sanoovia API v1.0 — IA de santé multilingue pour la Côte d&apos;Ivoire
      </footer>
    </div>
  )
}

function QuickTest({ title, curl }: { title: string; curl: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
      <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap break-all">{curl}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(curl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="mt-2 text-xs px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
      >
        {copied ? '✓ Copié!' : 'Copier la commande'}
      </button>
    </div>
  )
}
