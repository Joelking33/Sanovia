// ============================================================
// SANOvIA — Moteur IA v7.0
// ═══════════════════════════════════════════════════════════════
// Architecture :
//
//   0. DÉTECTION GREETING — Réponses humaines naturelles (instant)
//   1. FOURNISSEUR PRINCIPAL — OpenRouter (12 modèles gratuits)
//   2. FOURNISSEUR FALLBACK — Google Gemini (gratuit, direct)
//   3. DERNIER RECOURS — Réponses pré-construites hors-ligne
//
//   FEATURES :
//     → Comportement humain et chaleureux
//     → Salutations courtes et naturelles
//     → Cache LRU (30 min, 200 entrées max)
//     → Timeout 25s par requête, 90s global
//     → 3 retries avec backoff exponentiel
//     → Validation intelligente des réponses
//     → Circuit breaker OpenRouter
//     → Prompts 4 langues (fr/ba/dy/bq)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 1. CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_PER_REQUEST = 25_000
const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 1_000
const GLOBAL_TIMEOUT = 90_000
const PARALLEL_BATCH_SIZE = 2
const RESPONSE_MIN_LENGTH = 8
const CACHE_TTL = 30 * 60 * 1000
const CACHE_MAX_SIZE = 200

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']

const OPENROUTER_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-4-scout:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'qwen/qwen3-32b:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-12b-it:free',
  'meta-llama/llama-4-maverick:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'microsoft/phi-4-reasoning-plus:free',
  'cognitivecomputations/dolphin3.0-mistral-24b:free',
]

// ═══════════════════════════════════════════════════════════════
// 2. TYPES
// ═══════════════════════════════════════════════════════════════

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ProviderResult {
  content: string | null
  error: string | null
  provider: string
  model: string
  duration: number
}

// ═══════════════════════════════════════════════════════════════
// 3. CACHE LRU
// ═══════════════════════════════════════════════════════════════

class ResponseCache {
  private cache = new Map<string, { response: string; timestamp: number }>()

  private hashKey(message: string, language: string): string {
    const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ')
    return `${language}:${normalized.slice(0, 200)}`
  }

  get(message: string, language: string): string | null {
    const key = this.hashKey(message, language)
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key)
      return null
    }
    console.log(`[Cache] HIT: "${message.slice(0, 40)}..."`)
    return entry.response
  }

  set(message: string, language: string, response: string): void {
    if (this.cache.size >= CACHE_MAX_SIZE) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
    const key = this.hashKey(message, language)
    this.cache.set(key, { response, timestamp: Date.now() })
  }

  clear(): void { this.cache.clear() }
  get size(): number { return this.cache.size }
}

const cache = new ResponseCache()

// ═══════════════════════════════════════════════════════════════
// 4. DÉTECTION GREETING — Réponses humaines et naturelles
// ═══════════════════════════════════════════════════════════════

function isGreeting(message: string): boolean {
  const msg = message.toLowerCase().trim().replace(/[!.,?;:]+$/, '').trim()
  const greetings = [
    // Français
    'bonjour', 'salut', 'bonsoir', 'hey', 'coucou', 'salutations',
    'bon matin', 'bonne journée', 'bonne soiree', 'bonne soirée',
    'bon après-midi', 'comment allez vous', 'comment vas tu',
    'ça va', 'ca va', 'comment ça va', 'comment ca va',
    'tu vas bien', 'vous allez bien', 'bienvenue',
    'enchanté', 'enchantee', 'ravi de vous voir', 'hello',
    'hi', 'yo', 'wesh', 'salam', 'salam aleykoum', 'salam aleikum',
    'bonsoir sanovia', 'bonjour sanovia', 'salut sanovia',
    // Baoulé
    'ɔɛ', 'ɔe', 'awôrɔ', 'aworo', 'awɔrɔ', 'i kɛ',
    // Dioula
    'i kɛnɛ', 'n baara', 'n\'baara',
    // Bété
    'e kɛ', 'e ke', 'akɛ',
    // Court
    'bjr', 'slt', 'bsr', 'yo',
  ]
  // Vérifier si le message ne contient QU'UNE salutation (pas de vraie question)
  if (msg.split(/\s+/).length > 6) return false
  return greetings.some(g => msg === g || msg.includes(g))
}

const GREETING_RESPONSES: Record<string, string[]> = {
  fr: [
    "Bonjour ! 😊 Je suis Sanovia, votre assistant santé. Comment puis-je vous aider aujourd'hui ?",
    "Salut ! 👋 Je suis là pour vous aider avec vos questions de santé. Qu'est-ce qui vous tracasse ?",
    "Bonjour ! Comment allez-vous ? Je suis Sanovia, posez-moi votre question santé, je suis là pour vous. 💚",
    "Hey ! 😃 Ravi de vous voir ! Je suis Sanovia, dites-moi comment je peux vous être utile.",
    "Coucou ! 👋 N'hésitez pas à me poser vos questions santé, je suis prêt à vous aider.",
  ],
  ba: [
    "Ɔɛ ! 😊 Luɛ Sanoovia, i ka sran man baara la tɔɔrɔ. I bɛ ka dɛmɛ ?",
    "Awôrɔ ! 👋 Luɛ Sanoovia. I ka sran man fɔn, a bɛ ka dɛmɛ !",
  ],
  dy: [
    "I kɛnɛ ! 😊 I tɔɔrɔ Sanoovia ye, i ka banjɛ ɛɛrɛ baara la tɔɔrɔ. I bɛ ka dɛmɛ ?",
    "N baara ! 👋 Sanoovia don. I ka banjɛ fɔn, a bɛ ka dɛmɛ !",
  ],
  bq: [
    "E kɛ ! 😊 Sanoovia yɛ, i ka sran man baara tɔɔrɔ. I bɛ ka dɛmɛ ?",
    "Akɛ ! 👋 Sanoovia don. I ka sran fɔn, a bɛ ka wle !",
  ],
}

function getGreetingResponse(language: string): string {
  const langResponses = GREETING_RESPONSES[language] || GREETING_RESPONSES.fr
  return langResponses[Math.floor(Math.random() * langResponses.length)]
}

// Détecter les remerciements
function isThankYou(message: string): boolean {
  const msg = message.toLowerCase().trim().replace(/[!.,?;:]+$/, '').trim()
  const thanks = [
    'merci', 'merci beaucoup', 'merci bien', 'je vous remercie',
    'thanks', 'thank you', 'thx', 'merci sanovia', 'merci sanoovia',
    'dankie', 'daby',
    'a ye ko', 'a yɛ ko', 'n ye ko', 'i ye ko',
  ]
  if (msg.split(/\s+/).length > 8) return false
  return thanks.some(t => msg === t || msg.includes(t))
}

const THANK_YOU_RESPONSES: Record<string, string[]> = {
  fr: [
    "De rien ! 😊 N'hésitez pas si vous avez d'autres questions santé.",
    "Avec plaisir ! Je suis là pour ça. Prenez soin de vous ! 💚",
    "Pas de quoi ! Votre santé compte. Si vous avez besoin d'autre chose, je suis là. 👋",
  ],
  ba: [
    "A tɛ ɛnɛ ! 😊 I bɛ sɔrɔ ɛnɛ, i ka sran man fɔn.",
    "A kɛrɛ ! 😊 I bɛ ka dɛmɛ, a tɛ ɛnɛ.",
  ],
  dy: [
    "A tɛ ɛnɛ ! 😊 I bɛ sɔrɔ ɛnɛ, i ka banjɛ fɔn.",
    "A kɛrɛ ! 😊 I bɛ ka dɛmɛ.",
  ],
  bq: [
    "A tɛ ɛnɛ ! 😊 I bɛ sɔrɔ ɛnɛ, i ka sran fɔn.",
    "A kɛrɛ ! 😊 I bɛ ka wle.",
  ],
}

function getThankYouResponse(language: string): string {
  const langResponses = THANK_YOU_RESPONSES[language] || THANK_YOU_RESPONSES.fr
  return langResponses[Math.floor(Math.random() * langResponses.length)]
}

// Détecter les demandes d'identité
function isIdentityQuestion(message: string): boolean {
  const msg = message.toLowerCase().trim()
  const identityPatterns = [
    'qui es tu', 'qui es-tu', 'qui êtes vous', 'qui êtes-vous',
    'tu es qui', 'vous êtes qui', 'c\'est quoi sanovia', 'c\'est quoi sanoovia',
    'sanovia c\'est quoi', 'sanoovia c\'est quoi', 'tu es quoi',
    'comment tu t\'appelles', 'comment vous appelez',
    'tu fais quoi', 'tu peux faire quoi', 'que fais tu', 'que faites vous',
    'a i ye', 'a yɛ', 'i tɔɔrɔ',
  ]
  return identityPatterns.some(p => msg.includes(p))
}

const IDENTITY_RESPONSES: Record<string, string> = {
  fr: "Je suis Sanovia 🩺, votre assistant santé intelligent ! Je peux vous informer sur les maladies courantes en Côte d'Ivoire (paludisme, typhoïde, choléra...), la nutrition, la santé maternelle, les premiers secours et bien plus encore.\n\nAttention : je donne des informations générales, je ne remplace pas un vrai médecin. Pour toute urgence, appelez le SAMU au 185 ou les Pompiers au 180. 💚",
  ba: "Luɛ Sanoovia 🩺, i ka sran man baara la tɔɔrɔ !\n\nI bɛ a fɔ : sran banna (paluditre...), kɛnɛ, glɔ glɔbɛlɛ...\n\nKunnafoni : a tɛ tɔɔrɔ kɛnɛ bɛɛ. SAMU 185, Pompiers 180. 💚",
  dy: "I tɔɔrɔ Sanoovia ye 🩺, i ka banjɛ ɛɛrɛ baara la tɔɔrɔ !\n\nI bɛ a fɔ : banjɛ banna (paludisme...), kɛnɛ, glɔ glɔbɛlɛ...\n\nKunnafoni : a tɔɔrɔ tɛ kɛnɛ bɛɛ. SAMU 185, Pompiers 180. 💚",
  bq: "Sanoovia yɛ 🩺, i ka sran man baara tɔɔrɔ !\n\nI bɛ a fɔ : sran banna (paludisme...), kɛnɛ, glɔ glɔbɛlɛ...\n\nKunnafoni : a tɛ tɔɔrɔ kɛnɛ bɛɛ. SAMU 185, Pompiers 180. 💚",
}

// ═══════════════════════════════════════════════════════════════
// 5. PROMPTS SYSTÈME — Plus humains et concis
// ═══════════════════════════════════════════════════════════════

const BASE_SYSTEM_PROMPT_FR = `Tu es Sanovia, un assistant santé intelligent et bienveillant pour les utilisateurs en Côte d'Ivoire. Tu es humain, chaleureux et naturel dans tes réponses — pas robotique.

RÈGLES FONDAMENTALES :
- Tu n'es PAS un médecin. Tu ne poses JAMAIS de diagnostic ni ne prescris de médicaments.
- Tu réponds aux questions de santé : maladies, prévention, nutrition, santé mentale, grossesse, premiers secours.
- Tu refuses poliment les questions hors sujet (politique, sport, finances...) en disant simplement que tu es spécialisé en santé.
- En cas d'urgence vitale, mentionne en premier : "URGENCE — Appelez le SAMU : 185 ou les Pompiers : 180."

STYLE DE RÉPONSE :
- Sois naturel, comme un ami qui s'y connaît en santé. Pas de langage clinique froid.
- Utilise des emojis occasionnellement (🩺, 💊, 💚, ⚠️) pour être plus humain.
- Adapte la longueur : court pour une question simple, détaillé pour une question complexe.
- Saute le disclaimer médical si la question est très simple ou générale.
- Pour les questions sérieuses ou spécifiques, termine par : "Ces informations ne remplacent pas un avis médical. Consultez un médecin si besoin."
- Contexte ivoirien : maladies locales, structures de santé, numéros d'urgence.
- Utilise des sauts de ligne pour la lisibilité.`

const BASE_SYSTEM_PROMPT_BA = `Luɛ Sanoovia, sran man baara la tɔɔrɔ Côte d'Ivoire kunnafoniw la. A kɛrɛ n'u sɔrɔ.

RÈGLES :
- A tɛ tɔɔrɔ, a tɛ sran man kɔnɔkwɛn dɛmɛ, a tɛ kɔlɔlɔnw fɛsɛn.
- Sran man kunnafoni : sran banna, kɛnɛ, glɔ glɔbɛlɛ, banjɛ...
- Fɛn wɛrɛ tɛ a dɛmɛ.
- Banjɛ kɛnɛnɛ : SAMU 185, Pompiers 180.`

const BASE_SYSTEM_PROMPT_DY = `I tɔɔrɔ Sanoovia ye, banjɛ ɛɛrɛ baara la tɔɔrɔ Côte d'Ivoire la. A kɛrɛ ka dɛmɛ.

RÈGLES :
- A tɔɔrɔ tɛ ye, a banjɛ ɛɛrɛ diagnostic tɛ kɛ, a kɔlɔlɔnw tɛ fɛsɛn.
- Banjɛ ɛɛrɛ kunnafoni : banjɛ banna, kɛnɛ, glɔ glɔbɛlɛ...
- Fɛn wɛrɛ tɛ a dɛmɛ.
- Banjɛ kɛnɛnɛ : SAMU 185, Pompiers 180.`

const BASE_SYSTEM_PROMPT_BQ = `Sanoovia yɛ, sran man baara tɔɔrɔ Côte d'Ivoire. A kɛrɛ ka wle.

RÈGLES :
- A tɛ tɔɔrɔ, a tɛ sran man kɔnɔkwɛn dɛmɛ, a tɛ kɔlɔlɔnw fɛsɛn.
- Sran man kunnafoni : sran banna, kɛnɛ, glɔ glɔbɛlɛ...
- Fɛn wɛrɛ tɛ a wle.
- Sran kɛnɛnɛ : SAMU 185, Pompiers 180.`

// ─── Extensions par catégorie ───────────────────────────────
function getCategoryExtension(language: string, category: string): string {
  const extensions: Record<string, Record<string, string>> = {
    fr: {
      premiers_secours: '\n\nSPÉCIALITÉ PREMIERS SECOURS :\n- Instructions claires pour gestes de premiers secours\n- Brûlures, coupures, saignements, étouffement, fractures, allergies\n- Toujours rappeler : SAMU 185, Pompiers 180',
      grossesse: '\n\nSPÉCIALITÉ GROSSESSE :\n- Suivi par trimestre, alimentation, hygiène, signes d\'alerte\n- Orientation vers structures maternelles CI (CHU, cliniques)'
    },
    ba: {
      premiers_secours: '\n\nKƆLƆLƆNW : klɔsɛn, fɛn banna, sɔrɔn. SAMU 185.',
      grossesse: '\n\nGLƆ GLƆBƐLƐ : ɛlɛmɔn, kɛnɛ. CHU, klinikiw.'
    },
    dy: {
      premiers_secours: '\n\nKƆLƆLƆNW : klɔsɛn, fɛn banna, sɔrɔn. SAMU 185.',
      grossesse: '\n\nGLƆ GLƆBƐLƐ : ɛlɛmɔn, kɛnɛ. CHU, klinikiw.'
    },
    bq: {
      premiers_secours: '\n\nKƆLƆLƆNW : klɔsɛn, fɛn banna, sɔrɔn. SAMU 185.',
      grossesse: '\n\nGLƆ GLƆBƐLƐ : ɛlɛmɔn, kɛnɛ. CHU, klinikiw.'
    }
  }
  const langExtensions = extensions[language] || extensions.fr
  return langExtensions[category] || ''
}

const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  fr: {
    general: BASE_SYSTEM_PROMPT_FR,
    premiers_secours: BASE_SYSTEM_PROMPT_FR + getCategoryExtension('fr', 'premiers_secours'),
    grossesse: BASE_SYSTEM_PROMPT_FR + getCategoryExtension('fr', 'grossesse')
  },
  ba: {
    general: BASE_SYSTEM_PROMPT_BA,
    premiers_secours: BASE_SYSTEM_PROMPT_BA + getCategoryExtension('ba', 'premiers_secours'),
    grossesse: BASE_SYSTEM_PROMPT_BA + getCategoryExtension('ba', 'grossesse')
  },
  dy: {
    general: BASE_SYSTEM_PROMPT_DY,
    premiers_secours: BASE_SYSTEM_PROMPT_DY + getCategoryExtension('dy', 'premiers_secours'),
    grossesse: BASE_SYSTEM_PROMPT_DY + getCategoryExtension('dy', 'grossesse')
  },
  bq: {
    general: BASE_SYSTEM_PROMPT_BQ,
    premiers_secours: BASE_SYSTEM_PROMPT_BQ + getCategoryExtension('bq', 'premiers_secours'),
    grossesse: BASE_SYSTEM_PROMPT_BQ + getCategoryExtension('bq', 'grossesse')
  }
}

function getSystemPrompt(language: string, category: string): string {
  const lang = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.fr
  return lang[category] || lang.general
}

// ─── Messages d'erreur traduits ─────────────────────────────
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  fr: {
    noApiKey: "Oups 😅 Je suis Sanovia et j'ai un petit souci technique. Pour toute urgence, appelez le SAMU au 185. Réessayez dans un instant !",
    allFailed: "Désolé 😔 Je rencontre un problème technique temporaire. Pour toute urgence, appelez le SAMU au 185 ou les Pompiers au 180. Réessayez dans quelques instants.",
  },
  ba: {
    noApiKey: "Oups 😅 Luɛ Sanoovia, a sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ : SAMU 185.",
    allFailed: "Oups 😅 Sanoovia sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ : SAMU 185 ou Pompiers 180.",
  },
  dy: {
    noApiKey: "Oups 😅 I tɔɔrɔ Sanoovia ye, a sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ : SAMU 185.",
    allFailed: "Oups 😅 Sanoovia sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ : SAMU 185 ou Pompiers 180.",
  },
  bq: {
    noApiKey: "Oups 😅 Sanoovia yɛ, a sɔrɔ baara ɛnɛ. Sran kɛnɛnɛ : SAMU 185.",
    allFailed: "Oups 😅 Sanoovia sɔrɔ baara ɛnɛ. Sran kɛnɛnɛ : SAMU 185 ou Pompiers 180.",
  }
}

function getErrorMessage(language: string, key: string): string {
  return ERROR_MESSAGES[language]?.[key] || ERROR_MESSAGES.fr[key] || ERROR_MESSAGES.fr.allFailed
}

// ═══════════════════════════════════════════════════════════════
// 6. UTILITAIRES
// ═══════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 ||
         status === 504 || status === 520 || status === 521 || status === 522 ||
         status === 523 || status === 524
}

function isValidResponse(content: string): boolean {
  if (!content || content.trim().length < RESPONSE_MIN_LENGTH) return false
  const trimmed = content.trim()
  const errorPatterns = [
    /^(an error occurred|internal error|server error)/i,
    /^(api error|rate limit|too many requests)\b/i,
    /^(\{.*\}|<.*>)$/,
    /^(connection error|timeout error|fetch error)\b/i,
    /^content_filter/i,
  ]
  for (const pattern of errorPatterns) {
    if (pattern.test(trimmed)) return false
  }
  return true
}

// ═══════════════════════════════════════════════════════════════
// 7. FOURNISSEUR PRINCIPAL — OPENROUTER (12 modèles gratuits)
// ═══════════════════════════════════════════════════════════════

const recentFailures = new Map<string, { count: number; lastFail: number }>()
const CB_THRESHOLD = 3
const CB_COOLDOWN = 120_000

function isCircuitBroken(model: string): boolean {
  const s = recentFailures.get(model)
  if (!s || s.count < CB_THRESHOLD) return false
  if (Date.now() - s.lastFail > CB_COOLDOWN) { recentFailures.delete(model); return false }
  return true
}
function recordFail(model: string) { const s = recentFailures.get(model) || { count: 0, lastFail: 0 }; s.count++; s.lastFail = Date.now(); recentFailures.set(model, s) }
function recordOK(model: string) { recentFailures.delete(model) }

async function callORModel(apiKey: string, model: string, messages: Array<{ role: string; content: string }>): Promise<ProviderResult> {
  const startTime = Date.now()
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_REQUEST)
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://sanovia.vercel.app',
          'X-Title': 'Sanovia Health AI'
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1200 }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (!response.ok) {
        const status = response.status
        if (status === 401 || status === 403) return { content: null, error: 'OR_KEY_INVALID', provider: 'openrouter', model, duration: Date.now() - startTime }
        if (isRetryableError(status) && attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt - 1)); continue }
        recordFail(model)
        return { content: null, error: `OR_HTTP_${status}`, provider: 'openrouter', model, duration: Date.now() - startTime }
      }
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (content && isValidResponse(content)) {
        recordOK(model)
        console.log(`[OpenRouter] ✅ ${model} — OK (${content.length} chars, ${Date.now() - startTime}ms)`)
        return { content: content.trim(), error: null, provider: 'openrouter', model, duration: Date.now() - startTime }
      }
      if (content && content.trim().length >= 5) {
        recordOK(model)
        return { content: content.trim(), error: null, provider: 'openrouter', model, duration: Date.now() - startTime }
      }
      if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * attempt); continue }
      recordFail(model)
      return { content: null, error: 'OR_VIDE', provider: 'openrouter', model, duration: Date.now() - startTime }
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * attempt); continue }
      recordFail(model)
      return { content: null, error: err?.message || 'OR_NETWORK', provider: 'openrouter', model, duration: Date.now() - startTime }
    }
  }
  recordFail(model)
  return { content: null, error: 'OR_MAX_RETRIES', provider: 'openrouter', model, duration: Date.now() - startTime }
}

async function tryOpenRouter(
  systemPrompt: string, userMessage: string, language: string, history: ChatMessage[], deadline: number
): Promise<ProviderResult | null> {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim()
  if (!apiKey || apiKey.length < 10) {
    console.log('[OpenRouter] ⏭️ Clé non configurée, passage au fallback')
    return null
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-20).map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content })),
    { role: 'user', content: userMessage }
  ]

  const customModel = process.env.OPENROUTER_MODEL?.trim()
  const allModels = [...(customModel ? [customModel] : []), ...OPENROUTER_MODELS]
  const uniqueModels = [...new Set(allModels)]
  let availableModels = uniqueModels.filter(m => !isCircuitBroken(m))
  if (availableModels.length === 0) { recentFailures.clear(); availableModels = uniqueModels.slice(0, 4) }

  console.log(`[OpenRouter] 🚀 Fournisseur PRINCIPAL — ${availableModels.length} modèle(s)`)

  for (let i = 0; i < availableModels.length; i += PARALLEL_BATCH_SIZE) {
    if (Date.now() >= deadline) break
    const batch = availableModels.slice(i, i + PARALLEL_BATCH_SIZE)
    const results = await Promise.all(batch.map(model => callORModel(apiKey, model, messages)))
    for (const r of results) {
      if (r.content) return r
      if (r.error === 'OR_KEY_INVALID') return { content: null, error: 'OR_KEY_INVALID', provider: 'openrouter', model: 'all', duration: 0 }
    }
  }

  console.warn('[OpenRouter] ❌ Tous les modèles ont échoué, passage au fallback Gemini')
  return { content: null, error: 'OR_ALL_FAILED', provider: 'openrouter', model: 'all', duration: 0 }
}

// ═══════════════════════════════════════════════════════════════
// 8. FOURNISSEUR FALLBACK — GOOGLE GEMINI (API DIRECTE)
// ═══════════════════════════════════════════════════════════════

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<ProviderResult> {
  const startTime = Date.now()

  const contents = []
  for (const msg of history.slice(-10)) {
    contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] })

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  }

  if (model.includes('2.0') || model.includes('1.5')) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  } else {
    contents.unshift({ role: 'user', parts: [{ text: `Instructions système :\n${systemPrompt}\n\nRéponds maintenant à la question suivante.` }] })
    contents.unshift({ role: 'model', parts: [{ text: 'Bien compris, je suis Sanovia, assistant santé.' }] })
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_REQUEST)

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      console.log(`[Gemini] ${model} — tentative ${attempt}/${MAX_RETRIES}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const status = response.status
        if ((status === 400 || status === 403) && attempt === 1) {
          return { content: null, error: `GEMINI_FATAL_${status}`, provider: 'gemini', model, duration: Date.now() - startTime }
        }
        if (isRetryableError(status) || status === 429) {
          if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt - 1)); continue }
        }
        return { content: null, error: `GEMINI_HTTP_${status}`, provider: 'gemini', model, duration: Date.now() - startTime }
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (content && isValidResponse(content)) {
        console.log(`[Gemini] ✅ ${model} — OK (${content.length} chars, ${Date.now() - startTime}ms)`)
        return { content: content.trim(), error: null, provider: 'gemini', model, duration: Date.now() - startTime }
      }

      if (content && content.trim().length >= 5) {
        console.log(`[Gemini] ✅ ${model} — Réponse acceptée (len=${content.length}, ${Date.now() - startTime}ms)`)
        return { content: content.trim(), error: null, provider: 'gemini', model, duration: Date.now() - startTime }
      }

      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        return { content: null, error: 'GEMINI_SAFETY', provider: 'gemini', model, duration: Date.now() - startTime }
      }

      if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * attempt); continue }
      return { content: null, error: 'GEMINI_VIDE', provider: 'gemini', model, duration: Date.now() - startTime }

    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err?.name === 'AbortError') {
        if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * attempt); continue }
      }
      if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * attempt); continue }
      return { content: null, error: err?.message || 'GEMINI_NETWORK', provider: 'gemini', model, duration: Date.now() - startTime }
    }
  }

  return { content: null, error: 'GEMINI_MAX_RETRIES', provider: 'gemini', model, duration: Date.now() - startTime }
}

async function tryGemini(
  systemPrompt: string, userMessage: string, language: string, history: ChatMessage[]
): Promise<ProviderResult | null> {
  const apiKey = (process.env.GOOGLE_AI_API_KEY || '').trim()
  if (!apiKey || apiKey.length < 10) {
    console.log('[Gemini] ⏭️ Clé non configurée, passage au fallback hors-ligne')
    return null
  }

  console.log(`[Gemini] 🚀 FALLBACK — ${GEMINI_MODELS.length} modèle(s)`)
  const results = await Promise.all(GEMINI_MODELS.map(model => callGemini(apiKey, model, systemPrompt, userMessage, history)))
  for (const result of results) { if (result.content) return result }

  const hasFatal = results.some(r => r.error?.startsWith('GEMINI_FATAL'))
  console.warn(`[Gemini] ❌ Échoué (${hasFatal ? 'ERREUR FATALE' : 'timeout/serveur'})`)
  return { content: null, error: 'GEMINI_ALL_FAILED', provider: 'gemini', model: 'all', duration: 0 }
}

// ═══════════════════════════════════════════════════════════════
// 9. FOURNISSEUR HORS-LIGNE — Réponses pré-construites
// ═══════════════════════════════════════════════════════════════

function getOfflineResponse(userMessage: string, language: string): string {
  const msg = userMessage.toLowerCase().trim()

  const responses: Record<string, Record<string, string>> = {
    fr: {
      paludisme: `🩺 **Paludisme (Malaria)**\n\nLe paludisme est une maladie grave causée par un parasite transmis par les moustiques. C'est l'une des maladies les plus courantes en Côte d'Ivoire.\n\n**Symptômes :** Fièvre élevée, frissons, maux de tête, fatigue, nausées, douleurs musculaires.\n\n**Prévention :**\n- Dormir sous une moustiquaire imprégnée\n- Utiliser des répulsifs anti-moustiques\n- Portez des vêtements longs le soir\n- Éliminez les eaux stagnantes autour de chez vous\n\n**Que faire :** Consultez rapidement un centre de santé. Le paludisme se traite avec des antipaludéens prescrits par un médecin.\n\n⚠️ URGENCE : Si confusion, convulsions ou difficultés respiratoires → appelez le **SAMU 185** ou les **Pompiers 180**.\n\nCes informations ne remplacent pas un avis médical.`,
      typhoide: `🩺 **Fièvre Typhoïde**\n\nLa fièvre typhoïde est une infection bactérienne grave transmise par l'eau et les aliments contaminés.\n\n**Symptômes :** Fièvre progressive, maux de tête, fatigue, douleurs abdominales, éruption cutanée.\n\n**Prévention :**\n- Lavez-vous les mains régulièrement\n- Buvez de l'eau traitée ou embouteillée\n- Mangez des aliments bien cuits\n- Respectez l'hygiène alimentaire\n\nConsultez un centre de santé rapidement pour un traitement aux antibiotiques.\n\n⚠️ URGENCE : SAMU 185 — Pompiers 180.`,
      cholera: `🩺 **Choléra**\n\nLe choléra est une infection diarrhéique aiguë causée par l'eau ou les aliments contaminés. Il peut être mortel en quelques heures sans traitement.\n\n**Symptômes :** Diarrhée liquide soudaine, vomissements, déshydratation rapide, crampes.\n\n**Prévention :**\n- Eau potable uniquement\n- Lavage des mains régulier\n- Hygiène alimentaire stricte\n- Latrines propres\n\n⚠️ URGENCE : Rendez-vous immédiatement au centre de santé. **SAMU 185**.\n\nCes informations ne remplacent pas un avis médical.`,
      grossesse: `🩺 **Grossesse**\n\nLa grossesse nécessite un suivi médical régulier pour assurer la santé de la mère et du bébé.\n\n**Suivi recommandé :**\n- CPN1 (1er trimestre) — Confirmation et premiers examens\n- CPN2 (2ème trimestre) — Échographie et suivi\n- CPN3-4 (3ème trimestre) — Préparation à l'accouchement\n\n**Alimentation :** Fruits, légumes, protéines, céréales complètes, eau potable. Évitez l'alcool et le tabac.\n\n**Signes d'alerte :** Saignements, douleurs intenses, maux de tête sévères, perte de liquide, fièvre → consultez immédiatement.\n\nConsultez un centre de santé maternelle dès le début de grossesse. 💚`,
      diabete: `🩺 **Diabète**\n\nLe diabète est une maladie chronique caractérisée par un taux de sucre trop élevé dans le sang.\n\n**Symptômes :** Soif intense, urinations fréquentes, fatigue, vision floue, cicatrisation lente.\n\n**Prévention :**\n- Alimentation équilibrée\n- Activité physique régulière\n- Maintenir un poids santé\n- Limiter les sucres rapides\n\nConsultez un médecin pour un diagnostic et un suivi régulier. 💚`,
      hypertension: `🩺 **Hypertension Artérielle**\n\nL'hypertension est un facteur de risque majeur de maladies cardiovasculaires (AVC, crise cardiaque).\n\n**Facteurs de risque :** Alimentation salée, sédentarité, surpoids, alcool, tabac, stress.\n\n**Prévention :**\n- Réduisez le sel dans vos repas\n- Mangez équilibré (fruits, légumes)\n- Faites de l'exercice régulièrement\n- Perdez du poids si nécessaire\n- Arrêtez le tabac\n\nConsultez un médecin pour un contrôle de tension. Un traitement peut être nécessaire. 💚`,
      sante_mentale: `🩺 **Santé Mentale**\n\nLa santé mentale est aussi importante que la santé physique. N'hésitez pas à en parler.\n\n**Signes à surveiller :** Tristesse persistante, perte d'intérêt, troubles du sommeil, anxiété, isolement.\n\n**Conseils :**\n- Parlez à vos proches\n- Faites de l'activité physique\n- Maintenez une routine de sommeil\n- Essayez la méditation\n- Limitez l'alcool\n\n**Où trouver de l'aide :** CHU Cocody/Yopougon (service de psychiatrie), associations d'aide.\n\nVous n'êtes pas seul(e). 💚`,
      nutrition: `🩺 **Nutrition**\n\nUne bonne nutrition est la base d'une bonne santé.\n\n**Principes :**\n- 5 portions de fruits et légumes par jour\n- Céréales complètes (riz, mil, maïs)\n- Protéines (poisson, viande, œufs, légumineuses)\n- Limiter les graisses et sucres\n\n**Aliments locaux recommandés :** Igname, patate douce, manioc, banane plantain, poisson, riz, mil, attiéké.\n\nBuvez au moins 1,5L d'eau par jour. 💚`,
      urgence: `🚨 **URGENCE MÉDICALE**\n\nAppelez immédiatement :\n- **SAMU : 185**\n- **Pompiers : 180**\n- **Police : 170**\n\n**Signes d'urgence :**\n- Douleur thoracique\n- Difficultés respiratoires\n- Saignements abondants\n- Perte de conscience\n- Convulsions\n\n**En attendant les secours :**\n- Restez calme\n- Ne déplacez pas la victime\n- Maintenez-la au chaud\n- Surveillez sa respiration`,
      default: "Je suis Sanovia 🩺, votre assistant santé ! Posez-moi n'importe quelle question sur la santé et je ferai mon possible pour vous aider.\n\nPar exemple :\n- \"Qu'est-ce que le paludisme ?\"\n- \"Comment prévenir le choléra ?\"\n- \"Que manger pendant la grossesse ?\"\n- \"Comment gérer le stress ?\"\n\n⚠️ Pour toute urgence médicale, appelez le **SAMU 185** ou les **Pompiers 180**.",
    },
    ba: {
      paludisme: `🩺 **Paluditre (Malaria)**\n\nPaluditre ye sran banna ye mɔgɔw fɛ.\n\nSran banna : awo la, tɔɔ kɛnɛnɛ.\n\nA bɛ kɛ n'ɛ : klɔsɛn, jɛ a ɛnɛ.\n\n⚠️ SAMU 185, Pompiers 180.`,
      default: "Luɛ Sanoovia 🩺 ! I ka sran man fɔn, a bɛ ka dɛmɛ !\n\n⚠️ SAMU 185, Pompiers 180.",
    },
    dy: {
      paludisme: `🩺 **Paludisme**\n\nPaludisme ye banjɛ banna ye.\n\nBanjɛ kɛnɛnɛw : awo la, tɔɔ kɛnɛnɛ.\n\nA bɛ kɛ n'ɛ : klɔsɛn, jɛ i ɛnɛ.\n\n⚠️ SAMU 185, Pompiers 180.`,
      default: "I tɔɔrɔ Sanoovia ye 🩺 ! I ka banjɛ fɔn, a bɛ ka dɛmɛ !\n\n⚠️ SAMU 185, Pompiers 180.",
    },
    bq: {
      paludisme: `🩺 **Paludisme**\n\nPaludisme yɛ sran banna ye.\n\nSran banna kɛnɛnɛw : awo la, tɔɔ kɛnɛnɛ.\n\nA bɛ kɛ n'ɛ : klɔsɛn, jɛ a ɛnɛ.\n\n⚠️ SAMU 185, Pompiers 180.`,
      default: "Sanoovia yɛ 🩺 ! I ka sran fɔn, a bɛ ka wle !\n\n⚠️ SAMU 185, Pompiers 180.",
    }
  }

  const keywords: Record<string, string[]> = {
    paludisme: ['palud', 'malaria', 'moustiqu', 'fièvre'],
    typhoide: ['typho', 'fièvre typho'],
    cholera: ['cholér', 'diarrh', 'déshydrat'],
    grossesse: ['grosses', 'enceint', 'accouch', 'gestation', 'bébé', 'foetus', 'fœtus', 'maternel'],
    diabete: ['diabèt', 'sucre', 'glycémi', 'glucose', 'insuline'],
    hypertension: ['hypertens', 'tension', 'pression artér'],
    sante_mentale: ['dépress', 'anxiét', 'stress', 'mental', 'psycho', 'triste', 'angoiss'],
    nutrition: ['nutrition', 'aliment', 'manger', 'régime', 'vitamine'],
    urgence: ['urgence', 'samu', 'pompiers', 'appel', 'secours', 'hémorrag', 'étouff', 'convulsion', 'poison', 'brûl'],
  }

  const langResponses = responses[language] || responses.fr
  for (const [key, words] of Object.entries(keywords)) {
    if (words.some(w => msg.includes(w))) {
      const response = langResponses[key]
      if (response) return response
    }
  }
  return langResponses.default || responses.fr.default
}

// ═══════════════════════════════════════════════════════════════
// 10. FONCTION PRINCIPALE — chatWithAI
// ═══════════════════════════════════════════════════════════════

export async function chatWithAI(
  userMessage: string,
  language: string = 'fr',
  category: string = 'general',
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const globalStart = Date.now()
  const globalDeadline = globalStart + GLOBAL_TIMEOUT

  // ─── 0. Cache ────────────────────────────────────────────
  const cached = cache.get(userMessage, language)
  if (cached) return cached

  // ─── 1. Greeting detection (réponse instantanée, humaine) ─
  if (isGreeting(userMessage)) {
    const greeting = getGreetingResponse(language)
    console.log(`[Sanovia v7] 💬 Greeting détecté — réponse instantanée (${Date.now() - globalStart}ms)`)
    return greeting
  }

  // ─── 2. Merci detection ─────────────────────────────────
  if (isThankYou(userMessage)) {
    const thanks = getThankYouResponse(language)
    console.log(`[Sanovia v7] 💬 Merci détecté — réponse instantanée (${Date.now() - globalStart}ms)`)
    return thanks
  }

  // ─── 3. Question identité ───────────────────────────────
  if (isIdentityQuestion(userMessage)) {
    const identity = IDENTITY_RESPONSES[language] || IDENTITY_RESPONSES.fr
    console.log(`[Sanovia v7] 💬 Question identité — réponse instantanée (${Date.now() - globalStart}ms)`)
    return identity
  }

  const systemPrompt = getSystemPrompt(language, category)

  const orKey = (process.env.OPENROUTER_API_KEY || '').trim()
  const geminiKey = (process.env.GOOGLE_AI_API_KEY || '').trim()

  console.log(`[Sanovia v7] langue: ${language}, catégorie: ${category}, OpenRouter: ${orKey ? '✅' : '❌'}, Gemini: ${geminiKey ? '✅' : '❌'}`)

  // ─── 4. OpenRouter (FOURNISSEUR PRINCIPAL) ──────────────
  if (orKey.length >= 10) {
    const orResult = await tryOpenRouter(systemPrompt, userMessage, language, conversationHistory, globalDeadline)
    if (orResult?.content) {
      console.log(`[Sanovia v7] ✅ Succès via OpenRouter en ${Date.now() - globalStart}ms`)
      cache.set(userMessage, language, orResult.content)
      return orResult.content
    }
    console.warn(`[Sanovia v7] ⚠️ OpenRouter échoué: ${orResult?.error}`)
  } else {
    console.log('[Sanovia v7] ⏭️ OpenRouter non configuré (pas de clé API)')
  }

  // ─── 5. Google Gemini (FALLBACK) ────────────────────────
  if (geminiKey.length >= 10 && Date.now() < globalDeadline) {
    const geminiResult = await tryGemini(systemPrompt, userMessage, language, conversationHistory)
    if (geminiResult?.content) {
      console.log(`[Sanovia v7] ✅ Succès via Gemini en ${Date.now() - globalStart}ms`)
      cache.set(userMessage, language, geminiResult.content)
      return geminiResult.content
    }
    console.warn(`[Sanovia v7] ⚠️ Gemini échoué: ${geminiResult?.error}`)
  } else if (geminiKey.length < 10) {
    console.log('[Sanovia v7] ⏭️ Gemini non configuré (pas de clé API)')
  }

  // ─── 6. Réponses pré-construites (dernier recours) ───────
  console.log('[Sanovia v7] 📦 Fallback hors-ligne...')
  const offline = getOfflineResponse(userMessage, language)
  if (offline) {
    console.log(`[Sanovia v7] ✅ Réponse hors-ligne en ${Date.now() - globalStart}ms`)
    cache.set(userMessage, language, offline)
    return offline
  }

  // ─── 7. Erreur ultime ────────────────────────────────────
  console.error(`[Sanovia v7] ❌ Aucune réponse disponible après ${Date.now() - globalStart}ms`)
  return getErrorMessage(language, 'allFailed')
}

// ═══════════════════════════════════════════════════════════════
// 11. DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

export async function diagnoseAPI(): Promise<Record<string, unknown>> {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    version: '7.0',
    architecture: 'OpenRouter (principal) → Gemini (fallback) → Hors-ligne',
    providers: {}
  }

  // Test OpenRouter
  const orKey = (process.env.OPENROUTER_API_KEY || '').trim()
  if (orKey.length >= 10) {
    try {
      const start = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10_000)
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://sanovia.vercel.app',
          'X-Title': 'Sanovia Health AI'
        },
        body: JSON.stringify({
          model: 'google/gemma-3-12b-it:free',
          messages: [{ role: 'user', content: 'Dire bonjour en une phrase.' }],
          max_tokens: 30
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      diagnostics.providers.openrouter = {
        status: res.ok ? 'ok' : 'error',
        httpStatus: res.status,
        responseTime: `${Date.now() - start}ms`,
        content: data.choices?.[0]?.message?.content?.slice(0, 100) || null,
        error: data.error?.message || null
      }
    } catch (err: any) {
      diagnostics.providers.openrouter = { status: 'error', error: err?.message }
    }
  } else {
    diagnostics.providers.openrouter = { status: 'not_configured', message: 'OPENROUTER_API_KEY non définie' }
  }

  // Test Gemini
  const gemKey = (process.env.GOOGLE_AI_API_KEY || '').trim()
  if (gemKey.length >= 10) {
    try {
      const start = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10_000)
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Dire bonjour en une phrase.' }] }],
          generationConfig: { maxOutputTokens: 30 }
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      diagnostics.providers.gemini = {
        status: res.ok ? 'ok' : 'error',
        httpStatus: res.status,
        responseTime: `${Date.now() - start}ms`,
        content: data.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 100) || null,
        error: data.error?.message || null
      }
    } catch (err: any) {
      diagnostics.providers.gemini = { status: 'error', error: err?.message }
    }
  } else {
    diagnostics.providers.gemini = { status: 'not_configured', message: 'GOOGLE_AI_API_KEY non définie' }
  }

  diagnostics.cache = { size: cache.size, ttl: `${CACHE_TTL / 1000}s` }
  diagnostics.circuitBreaker = { brokenModels: Array.from(recentFailures.entries()).filter(([, s]) => s.count >= CB_THRESHOLD).map(([m]) => m) }

  return diagnostics
}
