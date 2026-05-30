// ============================================================
// SANOVIA — Moteur IA v9.0 (stable)
// ─────────────────────────────────────────────────────────────
// Architecture :
//   0. GREETING / MERCI / IDENTITÉ — Réponses locales (instant)
//   1. CACHE LRU — 30 min, 200 entrées
//   2. OPENROUTER — Fournisseur principal (12 modèles gratuits)
//   3. GEMINI — Fallback Google (2 modèles)
//   4. HORS-LIGNE — Réponses pré-construites santé
//   5. FALLBACK GÉNÉRIQUE — Toujours une réponse, jamais de crash
// ============================================================

// ============================================================
// 1. CONFIGURATION
// ============================================================

const TIMEOUT_PER_REQUEST  = 25_000   // 25s par requête
const MAX_RETRIES          = 3
const RETRY_BASE_DELAY     = 1_000
const GLOBAL_TIMEOUT       = 90_000   // 90s total
const PARALLEL_BATCH_SIZE  = 2
const RESPONSE_MIN_LENGTH  = 8
const CACHE_TTL            = 30 * 60 * 1_000  // 30 min
const CACHE_MAX_SIZE       = 200
const CB_THRESHOLD         = 4        // circuit breaker : 4 échecs
const CB_COOLDOWN          = 90_000   // 90s de cooldown

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']

const OPENROUTER_MODELS = [
  'meta-llama/llama-4-scout:free',       // ✅ Fiable, rapide
  'meta-llama/llama-4-maverick:free',    // ✅ Très bon
  'qwen/qwen3-32b:free',                 // ✅ Excellent
  'mistralai/mistral-small-3.1-24b-instruct:free', // ✅ Stable
  'google/gemma-3-27b-it:free',          // ✅ Disponible
  'deepseek/deepseek-chat-v3-0324:free', // ✅ Bon
  'qwen/qwen-2.5-72b-instruct:free',     // ✅ Backup
  'cognitivecomputations/dolphin3.0-mistral-24b:free', // ✅ Backup
]

// ============================================================
// 2. TYPES
// ============================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ProviderResult {
  content:     string | null
  error:       string | null
  provider:    string
  model:       string
  duration:    number
  rawError?:   string
  modelErrors?: string[]
}

export interface AIMetadata {
  provider:      string
  model:         string
  duration:      number
  source:        'openrouter' | 'gemini' | 'cache' | 'greeting' | 'thankyou' | 'identity' | 'offline'
  cached:        boolean
  hasApiKey:     boolean   // openRouterKey || geminiKey
  openRouterKey: boolean
  geminiKey:     boolean
  errors:        string[]
  rawErrors:     string[]  // détails bruts des erreurs fournisseurs
  retries:       number
  timestamp:     string
}

export interface AIResponse {
  content:  string
  metadata: AIMetadata
}

export class AIError extends Error {
  code:          string
  provider:      string
  model:         string
  duration:      number
  hasApiKey:     boolean
  openRouterKey: boolean
  geminiKey:     boolean
  errors:        string[]
  rawErrors:     string[]
  timestamp:     string

  constructor(
    message: string,
    opts: {
      code?:          string
      provider?:      string
      model?:         string
      duration?:      number
      hasApiKey?:     boolean
      openRouterKey?: boolean
      geminiKey?:     boolean
      errors?:        string[]
      rawErrors?:     string[]
    } = {}
  ) {
    super(message)
    this.name          = 'AIError'
    this.code          = opts.code          ?? 'AI_ERROR'
    this.provider      = opts.provider      ?? 'unknown'
    this.model         = opts.model         ?? 'unknown'
    this.duration      = opts.duration      ?? 0
    this.openRouterKey = opts.openRouterKey ?? false
    this.geminiKey     = opts.geminiKey     ?? false
    this.hasApiKey     = opts.hasApiKey     ?? (this.openRouterKey || this.geminiKey)
    this.errors        = opts.errors        ?? []
    this.rawErrors     = opts.rawErrors     ?? []
    this.timestamp     = new Date().toISOString()
  }

  toJSON() {
    return {
      code:          this.code,
      provider:      this.provider,
      model:         this.model,
      duration:      this.duration,
      hasApiKey:     this.hasApiKey,
      openRouterKey: this.openRouterKey,
      geminiKey:     this.geminiKey,
      errors:        this.errors,
      rawErrors:     this.rawErrors,
      timestamp:     this.timestamp,
      message:       this.message,
    }
  }
}

// ============================================================
// 3. CACHE LRU
// ============================================================

class ResponseCache {
  private cache = new Map<string, { response: string; timestamp: number }>()

  private hashKey(message: string, language: string): string {
    const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ')
    return `${language}:${normalized.slice(0, 200)}`
  }

  get(message: string, language: string): string | null {
    const key   = this.hashKey(message, language)
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

// ============================================================
// 4. DÉTECTION GREETING / MERCI / IDENTITÉ
// ============================================================

function isGreeting(message: string): boolean {
  const msg = message.toLowerCase().trim().replace(/[!.,?;:]+$/, '').trim()
  if (msg.split(/\s+/).length > 6) return false
  const greetings = [
    'bonjour','salut','bonsoir','hey','coucou','salutations',
    'bon matin','bonne journée','bonne soiree','bonne soirée',
    'bon après-midi','comment allez vous','comment vas tu',
    'ça va','ca va','comment ça va','comment ca va',
    'tu vas bien','vous allez bien','bienvenue',
    'enchanté','enchantee','ravi de vous voir','hello',
    'hi','yo','wesh','salam','salam aleykoum','salam aleikum',
    'bonsoir sanovia','bonjour sanovia','salut sanovia',
    'ɔɛ','ɔe','awôrɔ','aworo','awɔrɔ','i kɛ',
    'i kɛnɛ','n baara',"n'baara",
    'e kɛ','e ke','akɛ',
    'bjr','slt','bsr',
  ]
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
    "Moh Ayi o, Gna Ayi o ! 😊 Je suis Sanovia, votre assistant santé. Comment puis-je vous aider ?",
    "Moh Ayi o, Gna Ayi o ! 👋 Je suis Sanovia. Posez-moi votre question santé, je suis là pour vous !",
    "Moh Ayi o, Gna Ayi o ! 😊 Sanovia à votre service ! Quelle est votre question de santé ?",
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
  const list = GREETING_RESPONSES[language] ?? GREETING_RESPONSES.fr
  return list[Math.floor(Math.random() * list.length)]
}

function isThankYou(message: string): boolean {
  const msg = message.toLowerCase().trim().replace(/[!.,?;:]+$/, '').trim()
  if (msg.split(/\s+/).length > 8) return false
  const thanks = [
    'merci','merci beaucoup','merci bien','je vous remercie',
    'thanks','thank you','thx','merci sanovia','merci sanoovia',
    'dankie','daby','a ye ko','a yɛ ko','n ye ko','i ye ko',
  ]
  return thanks.some(t => msg === t || msg.includes(t))
}

const THANK_YOU_RESPONSES: Record<string, string[]> = {
  fr: [
    "De rien ! 😊 N'hésitez pas si vous avez d'autres questions santé.",
    "Avec plaisir ! Je suis là pour ça. Prenez soin de vous ! 💚",
    "Pas de quoi ! Votre santé compte. Si vous avez besoin d'autre chose, je suis là. 👋",
  ],
  ba: [
    "Moh Kloua o, Gna Kloua o ! 😊 N'hésitez pas si vous avez d'autres questions santé.",
    "Moh Kloua o, Gna Kloua o ! 💚 Prenez soin de vous !",
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
  const list = THANK_YOU_RESPONSES[language] ?? THANK_YOU_RESPONSES.fr
  return list[Math.floor(Math.random() * list.length)]
}

function isIdentityQuestion(message: string): boolean {
  const msg = message.toLowerCase().trim()
  return [
    'qui es tu','qui es-tu','qui êtes vous','qui êtes-vous',
    'tu es qui','vous êtes qui',"c'est quoi sanovia","c'est quoi sanoovia",
    "sanovia c'est quoi","sanoovia c'est quoi",'tu es quoi',
    'comment tu t\'appelles','comment vous appelez',
    'tu fais quoi','tu peux faire quoi','que fais tu','que faites vous',
    'a i ye','a yɛ','i tɔɔrɔ',
  ].some(p => msg.includes(p))
}

const IDENTITY_RESPONSES: Record<string, string> = {
  fr: "Je suis Sanovia 🩺, votre assistant santé intelligent ! Je peux vous informer sur les maladies courantes en Côte d'Ivoire (paludisme, typhoïde, choléra...), la nutrition, la santé maternelle, les premiers secours et bien plus encore.\n\nAttention : je donne des informations générales, je ne remplace pas un vrai médecin. Pour toute urgence, appelez le SAMU au 185 ou les Pompiers au 180. 💚",
  ba: "Moh Ayi o, Gna Ayi o ! 🩺 Je suis Sanovia, votre assistant santé !\n\nJe peux vous informer sur les maladies (paludisme...), la grossesse, les premiers secours et bien plus.\n\nAttention : je ne remplace pas un médecin. Urgences : SAMU 185 | Pompiers 180. 💚",
  dy: "I tɔɔrɔ Sanoovia ye 🩺, i ka banjɛ ɛɛrɛ baara la tɔɔrɔ !\n\nI bɛ a fɔ : banjɛ banna (paludisme...), kɛnɛ, glɔ glɔbɛlɛ...\n\nKunnafoni : a tɔɔrɔ tɛ kɛnɛ bɛɛ. SAMU 185, Pompiers 180. 💚",
  bq: "Sanoovia yɛ 🩺, i ka sran man baara tɔɔrɔ !\n\nI bɛ a fɔ : sran banna (paludisme...), kɛnɛ, glɔ glɔbɛlɛ...\n\nKunnafoni : a tɛ tɔɔrɔ kɛnɛ bɛɛ. SAMU 185, Pompiers 180. 💚",
}

// ============================================================
// 5. PROMPTS SYSTÈME
// ============================================================

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

const BASE_SYSTEM_PROMPT_BA = `Tu es Sanovia, assistant santé pour la Côte d'Ivoire.

Quand tu réponds en Baoulé, utilise la transcription phonétique populaire (comme on écrit sur WhatsApp), PAS l'alphabet officiel avec ses caractères spéciaux.
Exemples de phonétique Baoulé :
- Bonjour Madame = "Moh Ayi o"
- Bonjour Monsieur = "Gna Ayi o"  
- Merci Madame = "Moh Kloua o"
- Merci Monsieur = "Gna Kloua o"
Utilise le français pour les termes médicaux si nécessaire.

RÈGLES :
- Tu n'es pas médecin, tu ne poses pas de diagnostic, tu ne prescris pas.
- Informations santé uniquement : maladies, prévention, grossesse, premiers secours.
- Questions hors santé : refuser poliment.
- Urgences : SAMU 185, Pompiers 180.`

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

function getCategoryExtension(language: string, category: string): string {
  const extensions: Record<string, Record<string, string>> = {
    fr: {
      premiers_secours: "\n\nSPÉCIALITÉ PREMIERS SECOURS :\n- Instructions claires pour gestes de premiers secours\n- Brûlures, coupures, saignements, étouffement, fractures, allergies\n- Toujours rappeler : SAMU 185, Pompiers 180",
      grossesse: "\n\nSPÉCIALITÉ GROSSESSE :\n- Suivi par trimestre, alimentation, hygiène, signes d'alerte\n- Orientation vers structures maternelles CI (CHU, cliniques)",
    },
    ba: {
      premiers_secours: "\n\nKƆLƆLƆNW : klɔsɛn, fɛn banna, sɔrɔn. SAMU 185.",
      grossesse:        "\n\nGLƆ GLƆBƐLƐ : ɛlɛmɔn, kɛnɛ. CHU, klinikiw.",
    },
    dy: {
      premiers_secours: "\n\nKƆLƆLƆNW : klɔsɛn, fɛn banna, sɔrɔn. SAMU 185.",
      grossesse:        "\n\nGLƆ GLƆBƐLƐ : ɛlɛmɔn, kɛnɛ. CHU, klinikiw.",
    },
    bq: {
      premiers_secours: "\n\nKƆLƆLƆNW : klɔsɛn, fɛn banna, sɔrɔn. SAMU 185.",
      grossesse:        "\n\nGLƆ GLƆBƐLƐ : ɛlɛmɔn, kɛnɛ. CHU, klinikiw.",
    },
  }
  return extensions[language]?.[category] ?? extensions.fr[category] ?? ''
}

const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  fr: {
    general:         BASE_SYSTEM_PROMPT_FR,
    premiers_secours: BASE_SYSTEM_PROMPT_FR + getCategoryExtension('fr', 'premiers_secours'),
    grossesse:        BASE_SYSTEM_PROMPT_FR + getCategoryExtension('fr', 'grossesse'),
  },
  ba: {
    general:         BASE_SYSTEM_PROMPT_BA,
    premiers_secours: BASE_SYSTEM_PROMPT_BA + getCategoryExtension('ba', 'premiers_secours'),
    grossesse:        BASE_SYSTEM_PROMPT_BA + getCategoryExtension('ba', 'grossesse'),
  },
  dy: {
    general:         BASE_SYSTEM_PROMPT_DY,
    premiers_secours: BASE_SYSTEM_PROMPT_DY + getCategoryExtension('dy', 'premiers_secours'),
    grossesse:        BASE_SYSTEM_PROMPT_DY + getCategoryExtension('dy', 'grossesse'),
  },
  bq: {
    general:         BASE_SYSTEM_PROMPT_BQ,
    premiers_secours: BASE_SYSTEM_PROMPT_BQ + getCategoryExtension('bq', 'premiers_secours'),
    grossesse:        BASE_SYSTEM_PROMPT_BQ + getCategoryExtension('bq', 'grossesse'),
  },
}

function getSystemPrompt(language: string, category: string): string {
  const lang = SYSTEM_PROMPTS[language] ?? SYSTEM_PROMPTS.fr
  return lang[category] ?? lang.general
}

// ============================================================
// 6. UTILITAIRES
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number): boolean {
  return [429, 500, 502, 503, 504, 520, 521, 522, 523, 524].includes(status)
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
  return !errorPatterns.some(p => p.test(trimmed))
}

// ============================================================
// 7. CIRCUIT BREAKER OPENROUTER
// ============================================================

const recentFailures = new Map<string, { count: number; lastFail: number }>()

function isCircuitBroken(model: string): boolean {
  const s = recentFailures.get(model)
  if (!s || s.count < CB_THRESHOLD) return false
  if (Date.now() - s.lastFail > CB_COOLDOWN) { recentFailures.delete(model); return false }
  return true
}

function recordFail(model: string): void {
  const s = recentFailures.get(model) ?? { count: 0, lastFail: 0 }
  s.count++
  s.lastFail = Date.now()
  recentFailures.set(model, s)
}

function recordOK(model: string): void {
  recentFailures.delete(model)
}

// ============================================================
// 8. FOURNISSEUR PRINCIPAL — OPENROUTER
// ============================================================

async function callORModel(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<ProviderResult> {
  const startTime = Date.now()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_PER_REQUEST)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL ?? 'https://sanovia.vercel.app',
          'X-Title': 'Sanovia Health AI',
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1200 }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const status = response.status
        let rawError = ''
        try {
          const errBody = await response.json()
          rawError = errBody.error?.message ?? errBody.error?.code ?? errBody.message ?? JSON.stringify(errBody).slice(0, 300)
        } catch { rawError = `HTTP ${status}` }

        if (status === 401 || status === 403) {
          recordFail(model)
          return { content: null, error: 'OR_KEY_INVALID', rawError: `HTTP ${status} — ${rawError}`, provider: 'openrouter', model, duration: Date.now() - startTime }
        }
        if (isRetryableStatus(status) && attempt < MAX_RETRIES) {
          console.warn(`[OpenRouter] ${model}: HTTP ${status} — retry ${attempt}/${MAX_RETRIES}`)
          await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt - 1))
          continue
        }
        recordFail(model)
        return { content: null, error: `OR_HTTP_${status}`, rawError: `HTTP ${status} — ${rawError}`, provider: 'openrouter', model, duration: Date.now() - startTime }
      }

      const data    = await response.json()
      const content = data.choices?.[0]?.message?.content as string | undefined

      if (content && isValidResponse(content)) {
        recordOK(model)
        console.log(`[OpenRouter] ✅ ${model} — ${content.length} chars, ${Date.now() - startTime}ms`)
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
      const errMsg = err?.name === 'AbortError' ? 'Timeout 25s' : (err?.message ?? 'OR_NETWORK')
      if (attempt < MAX_RETRIES) {
        console.warn(`[OpenRouter] ${model}: ${errMsg} — retry ${attempt}/${MAX_RETRIES}`)
        await sleep(RETRY_BASE_DELAY * attempt)
        continue
      }
      recordFail(model)
      return { content: null, error: errMsg, rawError: errMsg, provider: 'openrouter', model, duration: Date.now() - startTime }
    }
  }

  recordFail(model)
  return { content: null, error: 'OR_MAX_RETRIES', rawError: '3 tentatives échouées', provider: 'openrouter', model, duration: Date.now() - startTime }
}

async function tryOpenRouter(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[],
  deadline: number
): Promise<ProviderResult & { modelErrors?: string[] }> {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? '').trim()
  if (apiKey.length < 10) {
    console.log('[OpenRouter] ⏭️ Clé non configurée')
    return { content: null, error: 'OR_NO_KEY', provider: 'openrouter', model: 'none', duration: 0 }
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-20).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const customModel   = (process.env.OPENROUTER_MODEL ?? '').trim()
  const allModels     = [...(customModel ? [customModel] : []), ...OPENROUTER_MODELS]
  const uniqueModels  = [...new Set(allModels)]
  let   availableModels = uniqueModels.filter(m => !isCircuitBroken(m))

  // Si le circuit breaker a tout bloqué, on reset et on réessaie avec les premiers modèles
  if (availableModels.length === 0) {
    console.warn('[OpenRouter] ⚠️ Circuit breaker total — reset partiel')
    recentFailures.clear()
    availableModels = uniqueModels.slice(0, 4)
  }

  console.log(`[OpenRouter] 🚀 ${availableModels.length} modèle(s) disponible(s)`)

  const modelErrors: string[] = []

  for (let i = 0; i < availableModels.length; i += PARALLEL_BATCH_SIZE) {
    if (Date.now() >= deadline) break

    const batch   = availableModels.slice(i, i + PARALLEL_BATCH_SIZE)
    const results = await Promise.all(batch.map(model => callORModel(apiKey, model, messages)))

    for (const r of results) {
      if (r.content) return { ...r, modelErrors }

      const detail = r.rawError ? `${r.error} (${r.rawError})` : (r.error ?? 'unknown')
      modelErrors.push(`${r.model}: ${detail}`)

      if (r.error === 'OR_KEY_INVALID') {
        console.error('[OpenRouter] ❌ Clé API invalide')
        return { content: null, error: 'OR_KEY_INVALID', rawError: r.rawError, provider: 'openrouter', model: 'all', duration: 0, modelErrors }
      }
    }
  }

  console.warn(`[OpenRouter] ❌ Tous les modèles ont échoué`)
  return { content: null, error: 'OR_ALL_FAILED', provider: 'openrouter', model: 'all', duration: 0, modelErrors }
}

// ============================================================
// 9. FOURNISSEUR FALLBACK — GOOGLE GEMINI
// ============================================================

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<ProviderResult> {
  const startTime = Date.now()

  const contents: any[] = []
  for (const msg of history.slice(-10)) {
    contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] })

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_NONE' },
    ],
  }

  if (model.includes('2.0') || model.includes('1.5')) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  } else {
    contents.unshift({ role: 'model', parts: [{ text: 'Bien compris, je suis Sanovia, assistant santé.' }] })
    contents.unshift({ role: 'user',  parts: [{ text: `Instructions système :\n${systemPrompt}\n\nRéponds maintenant à la question suivante.` }] })
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_PER_REQUEST)

    try {
      const url      = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const status = response.status
        let rawError = ''
        try {
          const errBody = await response.json()
          rawError = errBody.error?.message ?? errBody.message ?? JSON.stringify(errBody).slice(0, 300)
        } catch { rawError = `HTTP ${status}` }

        if ((status === 400 || status === 403) && attempt === 1) {
          return { content: null, error: `GEMINI_FATAL_${status}`, rawError: `HTTP ${status} — ${rawError}`, provider: 'gemini', model, duration: Date.now() - startTime }
        }
        if ((isRetryableStatus(status) || status === 429) && attempt < MAX_RETRIES) {
          console.warn(`[Gemini] ${model}: HTTP ${status} — retry ${attempt}/${MAX_RETRIES}`)
          await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt - 1))
          continue
        }
        return { content: null, error: `GEMINI_HTTP_${status}`, rawError: `HTTP ${status} — ${rawError}`, provider: 'gemini', model, duration: Date.now() - startTime }
      }

      const data    = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined

      if (content && isValidResponse(content)) {
        console.log(`[Gemini] ✅ ${model} — ${content.length} chars, ${Date.now() - startTime}ms`)
        return { content: content.trim(), error: null, provider: 'gemini', model, duration: Date.now() - startTime }
      }
      if (content && content.trim().length >= 5) {
        return { content: content.trim(), error: null, provider: 'gemini', model, duration: Date.now() - startTime }
      }
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        return { content: null, error: 'GEMINI_SAFETY', provider: 'gemini', model, duration: Date.now() - startTime }
      }

      if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * attempt); continue }
      return { content: null, error: 'GEMINI_VIDE', provider: 'gemini', model, duration: Date.now() - startTime }

    } catch (err: any) {
      clearTimeout(timeoutId)
      const errMsg = err?.name === 'AbortError' ? 'Timeout 25s' : (err?.message ?? 'GEMINI_NETWORK')
      if (attempt < MAX_RETRIES) { await sleep(RETRY_BASE_DELAY * attempt); continue }
      return { content: null, error: errMsg, rawError: errMsg, provider: 'gemini', model, duration: Date.now() - startTime }
    }
  }

  return { content: null, error: 'GEMINI_MAX_RETRIES', rawError: '3 tentatives échouées', provider: 'gemini', model, duration: Date.now() - startTime }
}

async function tryGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<ProviderResult & { modelErrors?: string[] }> {
  const apiKey = (process.env.GOOGLE_AI_API_KEY ?? '').trim()
  if (apiKey.length < 10) {
    console.log('[Gemini] ⏭️ Clé non configurée')
    return { content: null, error: 'GEMINI_NO_KEY', provider: 'gemini', model: 'none', duration: 0 }
  }

  console.log(`[Gemini] 🔄 Fallback — ${GEMINI_MODELS.length} modèle(s)`)
  const results     = await Promise.all(GEMINI_MODELS.map(model => callGemini(apiKey, model, systemPrompt, userMessage, history)))
  const modelErrors: string[] = []

  for (const r of results) {
    if (r.content) return { ...r, modelErrors }
    const detail = r.rawError ? `${r.error} (${r.rawError})` : (r.error ?? 'unknown')
    modelErrors.push(`${r.model}: ${detail}`)
  }

  console.warn('[Gemini] ❌ Tous les modèles ont échoué')
  return { content: null, error: 'GEMINI_ALL_FAILED', provider: 'gemini', model: 'all', duration: 0, modelErrors }
}

// ============================================================
// 10. RÉPONSES HORS-LIGNE (mots-clés santé)
// ============================================================

const OFFLINE_RESPONSES_FR: Record<string, string> = {
  paludisme: `🩺 **Paludisme (Malaria)**\n\nLe paludisme est une maladie grave causée par un parasite transmis par les moustiques. C'est l'une des maladies les plus courantes en Côte d'Ivoire.\n\n**Symptômes :** Fièvre élevée, frissons, maux de tête, fatigue, nausées, douleurs musculaires.\n\n**Prévention :**\n- Dormir sous une moustiquaire imprégnée\n- Utiliser des répulsifs anti-moustiques\n- Porter des vêtements longs le soir\n- Éliminer les eaux stagnantes autour de chez vous\n\n**Que faire :** Consultez rapidement un centre de santé. Le paludisme se traite avec des antipaludéens prescrits par un médecin.\n\n⚠️ URGENCE : convulsions, confusion, difficultés respiratoires → **SAMU 185** ou **Pompiers 180**.\n\n_Ces informations ne remplacent pas un avis médical._`,
  typhoide:  `🩺 **Fièvre Typhoïde**\n\nInfection bactérienne grave transmise par l'eau et les aliments contaminés.\n\n**Symptômes :** Fièvre progressive, maux de tête, fatigue, douleurs abdominales.\n\n**Prévention :** Lavez-vous les mains, buvez de l'eau traitée, mangez des aliments bien cuits.\n\nConsultez un centre de santé rapidement.\n\n⚠️ SAMU 185 — Pompiers 180.`,
  cholera:   `🩺 **Choléra**\n\nInfection diarrhéique aiguë potentiellement mortelle sans traitement rapide.\n\n**Symptômes :** Diarrhée liquide soudaine, vomissements, déshydratation rapide.\n\n**Prévention :** Eau potable uniquement, lavage des mains, hygiène alimentaire.\n\n⚠️ URGENCE — Rendez-vous immédiatement au centre de santé. **SAMU 185**.`,
  grossesse: `🩺 **Grossesse**\n\nLa grossesse nécessite un suivi médical régulier.\n\n**Suivi recommandé :**\n- CPN1 (1er trimestre) — Confirmation et premiers examens\n- CPN2 (2ème trimestre) — Échographie et suivi\n- CPN3-4 (3ème trimestre) — Préparation à l'accouchement\n\n**Signes d'alerte :** Saignements, douleurs intenses, maux de tête sévères, fièvre → consultez immédiatement.\n\nConsultez un centre de santé maternelle dès le début de grossesse. 💚`,
  diabete:   `🩺 **Diabète**\n\n**Symptômes :** Soif intense, urinations fréquentes, fatigue, vision floue.\n\n**Prévention :** Alimentation équilibrée, activité physique, limiter les sucres rapides.\n\nConsultez un médecin pour un diagnostic et un suivi régulier. 💚`,
  hypertension: `🩺 **Hypertension Artérielle**\n\nFacteur de risque majeur d'AVC et de crise cardiaque.\n\n**Prévention :** Réduisez le sel, mangez équilibré, faites de l'exercice, arrêtez le tabac.\n\nConsultez un médecin pour contrôler votre tension. 💚`,
  sante_mentale: `🩺 **Santé Mentale**\n\n**Signes à surveiller :** Tristesse persistante, troubles du sommeil, anxiété, isolement.\n\n**Conseils :** Parlez à vos proches, faites de l'activité physique, maintenez une routine de sommeil.\n\n**Aide :** CHU Cocody/Yopougon (service de psychiatrie).\n\nVous n'êtes pas seul(e). 💚`,
  nutrition:  `🩺 **Nutrition**\n\n**Principes :**\n- 5 portions de fruits et légumes par jour\n- Céréales complètes (riz, mil, maïs)\n- Protéines (poisson, viande, œufs, légumineuses)\n\n**Aliments locaux recommandés :** Igname, attiéké, poisson, plantain, mil.\n\nBuvez au moins 1,5L d'eau par jour. 💚`,
  urgence:    `🚨 **URGENCE MÉDICALE**\n\nAppelez immédiatement :\n- **SAMU : 185**\n- **Pompiers : 180**\n- **Police : 170**\n\n**En attendant les secours :** Restez calme, ne déplacez pas la victime, maintenez-la au chaud, surveillez sa respiration.`,
}

const OFFLINE_KEYWORDS: Record<string, string[]> = {
  paludisme:     ['palud', 'malaria', 'moustiqu', 'fièvre', 'fever'],
  typhoide:      ['typho'],
  cholera:       ['cholér', 'diarrh', 'déshydrat'],
  grossesse:     ['grosses', 'enceint', 'accouch', 'gestation', 'bébé', 'fœtus', 'foetus', 'maternel', 'trimestre'],
  diabete:       ['diabèt', 'sucre', 'glycémi', 'glucose', 'insuline'],
  hypertension:  ['hypertens', 'tension artér', 'pression artér'],
  sante_mentale: ['dépress', 'anxiét', 'stress', 'mental', 'psycho', 'triste', 'angoiss', 'suicide'],
  nutrition:     ['nutrition', 'aliment', 'manger', 'régime', 'vitamine', 'minceur'],
  urgence:       ['urgence', 'samu', 'pompiers', 'appel', 'secours', 'hémorrag', 'étouff', 'convulsion', 'poison', 'brûl'],
}

// Réponse générique pour les langues locales
const OFFLINE_GENERIC: Record<string, string> = {
  fr: "Je rencontre un problème technique temporaire. 😔\n\nPour toute urgence médicale, appelez immédiatement le **SAMU au 185** ou les **Pompiers au 180**.\n\nPour les consultations, rendez-vous dans le centre de santé le plus proche. Réessayez votre question dans quelques instants. 💚",
  ba: "A sɔrɔ baara ɛnɛ 😔\n\nBanjɛ kɛnɛnɛ : SAMU 185, Pompiers 180.\n\nI bɛ segin ɛnɛ. 💚",
  dy: "A sɔrɔ baara ɛnɛ 😔\n\nBanjɛ kɛnɛnɛ : SAMU 185, Pompiers 180.\n\nI bɛ segin ɛnɛ. 💚",
  bq: "A sɔrɔ baara ɛnɛ 😔\n\nSran kɛnɛnɛ : SAMU 185, Pompiers 180.\n\nI bɛ segin ɛnɛ. 💚",
}

/**
 * Retourne toujours une réponse — soit par mot-clé, soit générique.
 * Ne retourne JAMAIS null pour éviter une AIError inutile.
 */
function getOfflineResponse(userMessage: string, language: string): string {
  const msg = userMessage.toLowerCase().trim()

  // Chercher un mot-clé connu (réponses FR disponibles pour toutes les langues)
  for (const [key, words] of Object.entries(OFFLINE_KEYWORDS)) {
    if (words.some(w => msg.includes(w))) {
      const response = OFFLINE_RESPONSES_FR[key]
      if (response) return response
    }
  }

  // Fallback générique (jamais de crash)
  return OFFLINE_GENERIC[language] ?? OFFLINE_GENERIC.fr
}

// ============================================================
// 11. FONCTION PRINCIPALE — chatWithAI
// ============================================================

export async function chatWithAI(
  userMessage:         string,
  language:            string        = 'fr',
  category:            string        = 'general',
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
  const globalStart    = Date.now()
  const globalDeadline = globalStart + GLOBAL_TIMEOUT

  const orKey    = (process.env.OPENROUTER_API_KEY ?? '').trim()
  const gemKey   = (process.env.GOOGLE_AI_API_KEY  ?? '').trim()
  const hasOrKey = orKey.length >= 10
  const hasGemKey = gemKey.length >= 10
  const hasApiKey = hasOrKey || hasGemKey

  /** Construit les métadonnées finales — appelé UNE FOIS, juste avant le return */
  const buildMeta = (overrides: Partial<AIMetadata> & { source: AIMetadata['source'] }): AIMetadata => ({
    provider:      'local',
    model:         'n/a',
    duration:      Date.now() - globalStart,
    cached:        false,
    hasApiKey,
    openRouterKey: hasOrKey,
    geminiKey:     hasGemKey,
    errors:        [],
    rawErrors:     [],
    retries:       0,
    timestamp:     new Date().toISOString(),   // ✅ FIX : était new Date.now().toISOString()
    ...overrides,
  })

  // Logs de démarrage
  console.log('\n' + '='.repeat(60))
  console.log('[SANOVIA v9.0] NOUVELLE REQUÊTE')
  console.log(`  Message   : "${userMessage.slice(0, 100)}"`)
  console.log(`  Langue    : ${language}  |  Catégorie : ${category}`)
  console.log(`  OpenRouter: ${hasOrKey ? '✅' : '❌'}  |  Gemini: ${hasGemKey ? '✅' : '❌'}`)
  console.log('='.repeat(60))

  // ─── 0. Cache ────────────────────────────────────────────
  const cached = cache.get(userMessage, language)
  if (cached) {
    console.log('[SANOVIA] ✅ CACHE HIT')
    return { content: cached, metadata: buildMeta({ source: 'cache', cached: true }) }
  }

  // ─── 1. Greeting ─────────────────────────────────────────
  if (isGreeting(userMessage)) {
    const content = getGreetingResponse(language)
    console.log('[SANOVIA] ✅ GREETING')
    return { content, metadata: buildMeta({ source: 'greeting' }) }
  }

  // ─── 2. Remerciement ─────────────────────────────────────
  if (isThankYou(userMessage)) {
    const content = getThankYouResponse(language)
    console.log('[SANOVIA] ✅ MERCI')
    return { content, metadata: buildMeta({ source: 'thankyou' }) }
  }

  // ─── 3. Question d'identité ──────────────────────────────
  if (isIdentityQuestion(userMessage)) {
    const content = IDENTITY_RESPONSES[language] ?? IDENTITY_RESPONSES.fr
    console.log('[SANOVIA] ✅ IDENTITÉ')
    return { content, metadata: buildMeta({ source: 'identity' }) }
  }

  const systemPrompt   = getSystemPrompt(language, category)
  const collectedErrors: string[]    = []
  const collectedRaw:    string[]    = []

  // ─── 4. OpenRouter (principal) ───────────────────────────
  if (hasOrKey) {
    console.log('[SANOVIA] 🔄 OpenRouter...')
    const orResult = await tryOpenRouter(systemPrompt, userMessage, conversationHistory, globalDeadline)

    if (orResult.content) {
      cache.set(userMessage, language, orResult.content)
      console.log(`[SANOVIA] ✅ OPENROUTER — ${orResult.model}`)
      return {
        content: orResult.content,
        metadata: buildMeta({
          source:    'openrouter',
          provider:  'openrouter',
          model:     orResult.model,
          duration:  Date.now() - globalStart,
          errors:    [],
          rawErrors: [],
        }),
      }
    }

    // Collecter les erreurs
    if (orResult.modelErrors?.length) {
      collectedErrors.push(...orResult.modelErrors.map(e => `OR: ${e}`))
    } else if (orResult.error) {
      collectedErrors.push(`OR: ${orResult.error}`)
      if (orResult.rawError) collectedRaw.push(orResult.rawError)
    }
    console.warn(`[SANOVIA] ❌ OpenRouter échoué — ${orResult.error}`)
  }

  // ─── 5. Gemini (fallback) ────────────────────────────────
  if (hasGemKey && Date.now() < globalDeadline) {
    console.log('[SANOVIA] 🔄 Gemini fallback...')
    const gemResult = await tryGemini(systemPrompt, userMessage, conversationHistory)

    if (gemResult.content) {
      cache.set(userMessage, language, gemResult.content)
      console.log(`[SANOVIA] ✅ GEMINI — ${gemResult.model}`)
      return {
        content: gemResult.content,
        metadata: buildMeta({
          source:    'gemini',
          provider:  'gemini',
          model:     gemResult.model,
          duration:  Date.now() - globalStart,
          errors:    collectedErrors,
          rawErrors: collectedRaw,
        }),
      }
    }

    if (gemResult.modelErrors?.length) {
      collectedErrors.push(...gemResult.modelErrors.map(e => `Gemini: ${e}`))
    } else if (gemResult.error) {
      collectedErrors.push(`Gemini: ${gemResult.error}`)
      if (gemResult.rawError) collectedRaw.push(gemResult.rawError)
    }
    console.warn(`[SANOVIA] ❌ Gemini échoué — ${gemResult.error}`)
  }

  // ─── 6. Réponse hors-ligne (toujours une réponse) ────────
  console.log('[SANOVIA] 🔄 Réponse hors-ligne...')
  const offline = getOfflineResponse(userMessage, language)

  cache.set(userMessage, language, offline)
  console.log('[SANOVIA] ✅ HORS-LIGNE')
  return {
    content: offline,
    metadata: buildMeta({
      source:    'offline',
      provider:  'offline',
      model:     'offline',
      duration:  Date.now() - globalStart,
      errors:    collectedErrors,
      rawErrors: collectedRaw,
    }),
  }
}

// ============================================================
// 12. DIAGNOSTICS
// ============================================================

export async function diagnoseAPI(): Promise<Record<string, unknown>> {
  const diagnostics: Record<string, unknown> = {
    timestamp:    new Date().toISOString(),
    version:      '9.0',
    architecture: 'OpenRouter → Gemini → Hors-ligne',
    providers:    {} as Record<string, unknown>,
  }

  const orKey  = (process.env.OPENROUTER_API_KEY ?? '').trim()
  const gemKey = (process.env.GOOGLE_AI_API_KEY  ?? '').trim()

  // Test OpenRouter
  if (orKey.length >= 10) {
    try {
      const start      = Date.now()
      const controller = new AbortController()
      const tid        = setTimeout(() => controller.abort(), 15_000)
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  process.env.APP_URL ?? 'https://sanovia.vercel.app',
          'X-Title':       'Sanovia Health AI',
        },
        body: JSON.stringify({
          model:    'google/gemma-3-12b-it:free',
          messages: [{ role: 'user', content: 'Dire bonjour en une phrase.' }],
          max_tokens: 30,
        }),
        signal: controller.signal,
      })
      clearTimeout(tid)
      const data = await res.json()
      ;(diagnostics.providers as any).openrouter = {
        status:       res.ok ? 'ok' : 'error',
        httpStatus:   res.status,
        responseTime: `${Date.now() - start}ms`,
        content:      data.choices?.[0]?.message?.content?.slice(0, 100) ?? null,
        error:        data.error?.message ?? null,
        rawResponse:  JSON.stringify(data).slice(0, 500),
      }
    } catch (err: any) {
      ;(diagnostics.providers as any).openrouter = { status: 'error', error: err?.message, errorType: err?.name }
    }
  } else {
    ;(diagnostics.providers as any).openrouter = { status: 'not_configured' }
  }

  // Test Gemini
  if (gemKey.length >= 10) {
    try {
      const start      = Date.now()
      const controller = new AbortController()
      const tid        = setTimeout(() => controller.abort(), 15_000)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents:        [{ role: 'user', parts: [{ text: 'Dire bonjour en une phrase.' }] }],
            generationConfig: { maxOutputTokens: 30 },
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(tid)
      const data = await res.json()
      ;(diagnostics.providers as any).gemini = {
        status:       res.ok ? 'ok' : 'error',
        httpStatus:   res.status,
        responseTime: `${Date.now() - start}ms`,
        content:      data.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 100) ?? null,
        error:        data.error?.message ?? null,
        rawResponse:  JSON.stringify(data).slice(0, 500),
      }
    } catch (err: any) {
      ;(diagnostics.providers as any).gemini = { status: 'error', error: err?.message, errorType: err?.name }
    }
  } else {
    ;(diagnostics.providers as any).gemini = { status: 'not_configured' }
  }

  ;(diagnostics as any).cache = { size: cache.size, ttl: `${CACHE_TTL / 1_000}s` }
  ;(diagnostics as any).circuitBreaker = {
    brokenModels: Array.from(recentFailures.entries())
      .filter(([, s]) => s.count >= CB_THRESHOLD)
      .map(([m]) => m),
  }

  return diagnostics
}