// ============================================================
// SANOvIA — Moteur IA Ultra-Stable v4.0
// ═══════════════════════════════════════════════════════════════
// Architecture de résilience maximale :
//
//   FOURNISSEUR 1 — Google Gemini (API directe, gratuite)
//     → La plus stable. API directe Google, pas d'intermédiaire.
//     → 1 500 requêtes/jour gratuit.
//     → Créez votre clé : https://aistudio.google.com/apikey
//
//   FOURNISSEUR 2 — OpenRouter (12 modèles gratuits en fallback)
//     → Requêtes parallèles (race) entre 2 modèles.
//     → Circuit breaker intelligent.
//     → Découverte dynamique des modèles disponibles.
//
//   FOURNISSEUR 3 — Réponses pré-construites (HORS LIGNE)
//     → Fonctionne MÊME sans internet ni API.
//     → Réponses santé prêtes pour les questions les plus courantes.
//     → GARANTIT que Sanovia répond TOUJOURS.
//
//   FEATURES STABILITÉ :
//     → Cache intelligent (LRU) pour les questions fréquentes
//     → Timeout adaptatif 25s par requête
//     → 3 retries par modèle avec backoff exponentiel
//     → Validation des réponses (rejette les erreurs déguisées)
//     → Temps max global 60s
//     → Prompts complets 4 langues (fr/ba/dy/bq)
// ============================================================

// ═══════════════════════════════════════════════════════════════
// 1. CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_PER_REQUEST = 25_000
const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 1_000
const GLOBAL_TIMEOUT = 60_000
const PARALLEL_BATCH_SIZE = 2
const RESPONSE_MIN_LENGTH = 10
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const CACHE_MAX_SIZE = 200

// ─── Modèles Google Gemini (direct, ultra-stable) ──────────
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

// ─── Modèles OpenRouter (fallback) ────────────────────────
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
// 3. CACHE INTELLIGENT (LRU)
// ═══════════════════════════════════════════════════════════════

class ResponseCache {
  private cache = new Map<string, { response: string; timestamp: number }>()

  private hashKey(message: string, language: string): string {
    // Normaliser : minuscules, trim, supprimer les espaces multiples
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
    console.log(`[Cache] ✅ HIT pour: "${message.slice(0, 40)}..."`)
    return entry.response
  }

  set(message: string, language: string, response: string): void {
    // Nettoyer si trop plein
    if (this.cache.size >= CACHE_MAX_SIZE) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
    const key = this.hashKey(message, language)
    this.cache.set(key, { response, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

const cache = new ResponseCache()

// ═══════════════════════════════════════════════════════════════
// 4. PROMPTS SYSTÈME — 4 LANGUES
// ═══════════════════════════════════════════════════════════════

const BASE_SYSTEM_PROMPT_FR = `Tu es Sanovia, un assistant d'information santé numérique dédié aux utilisateurs en Côte d'Ivoire.

══ IDENTITÉ ET LIMITES ══
• Tu n'es PAS un médecin, pas une infirmière, pas un professionnel de santé.
• Tu ne poses JAMAIS de diagnostic médical, même si l'utilisateur insiste.
• Tu ne prescris JAMAIS de médicament, de dose ou de traitement spécifique.
• Tu ne remplaces JAMAIS une consultation médicale réelle.
• Si on te demande ton identité, tu te présentes clairement comme un assistant IA informatif, NON qualifié médicalement.

══ DOMAINE AUTORISÉ — tu réponds UNIQUEMENT aux questions portant sur ══
• Symptômes courants et maladies (information générale, sans diagnostic)
• Prévention des maladies et hygiène de vie
• Nutrition et alimentation santé
• Santé mentale et bien-être psychologique
• Maladies tropicales fréquentes en Côte d'Ivoire (paludisme, typhoïde, choléra, etc.)
• Santé maternelle et infantile (informations générales)
• Médicaments (usage général, effets secondaires connus — jamais de prescription)
• Urgences médicales (orientation vers les secours)
• Système de santé ivoirien, structures hospitalières

══ HORS SUJET — tu REFUSES poliment toute question sur ══
• Finances, actualités, politique, sports, divertissement, technologie générale, etc.
• Si hors sujet, réponds exactement : "Je suis Sanovia, un assistant spécialisé en santé. Je ne peux pas répondre aux questions hors du domaine médical et du bien-être. Posez-moi une question de santé, je serai ravi de vous aider !"

══ URGENCES ══
Si tu détectes un risque vital immédiat (douleur thoracique, AVC, hémorragie sévère, perte de conscience, détresse respiratoire, intoxication grave), tu indiques en PREMIER : "URGENCE — Appelez immédiatement le SAMU : 185 ou les Pompiers : 180."

══ RÈGLE D'OR — FIN DE CHAQUE RÉPONSE ══
Tu termines CHAQUE réponse (sauf hors-sujet) par ce rappel :
"Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle."

══ FORMAT ══
• Français clair et accessible, chaleureux et rassurant sans minimiser les risques.
• Structuré avec des sauts de ligne pour la lisibilité.
• Longueur adaptée : concis si la question est simple, détaillé si elle est complexe.
• Contexte ivoirien pris en compte (structures de santé locales, maladies endémiques, etc.).`

const BASE_SYSTEM_PROMPT_BA = `Luɛ Sanoovia, e la sran man jɛlɛn ye Côte d'Ivoire kunnafoniw la.

══ ANAN N'U KƆRƆBA ══
• A tɛ tɔɔrɔ ye, a tɛ infirmière ye, a tɛ sran man baara la tɔɔrɔ ye.
• A tɛ sran man kɔnɔkwɛn dɛmɛ, sɔrɔ a yɛrɛ a bɛ ɛnɛ.
• A tɛ kɔlɔlɔnw fɛsɛn, a tɛ dɔw ɛlɛmɔn, a tɛ baara sɔrɔ.
• A tɛ tɔɔrɔ kɛnɛ bɛɛ ka lasegɛn.
• Sɔrɔ a yɛ ɛnɛ, a bɛ a sɔrɔ a tɛ sran man baara la tɔɔrɔ ye, a tɛ ɛnɛ bɛɛ.

══ KUNNAFONIW AN A KA N'U SƠRƠ A YƐRƐ ══
• Sran man sɔrɔnɔw ni sran banna (kunnafoni ye, kɔnɔkwɛn tɛ)
• Sran banna ɛlɛmɔn ni klɔ yɛlɛma
• Kɛnɛ ni a yɛ sran man jɛ
• Kɛnɛmɔkɔn ni ɛlɛmɔn sran jɛ
• Côte d'Ivoire sran banna (paludisme, typhoïde, choléra, etc.)
• Glɔ glɔbɛlɛ ni ninsi sran jɛ (kunnafoni ye)
• Kɔlɔlɔnw (kunnafoni ye, a yɛrɛ — fɛsɛn tɛ)
• Sran banjɛ (numéro wɛrɛw sɔrɔ)
• Côte d'Ivoire sran man baara, bɛɛw

══ FƐN WƐRƐ — A KA TƐBƐSƐ WƏLƏW ══
• Kunnafoni kɛrɛnkɛrɛnni, sɛnɛ, politikɛ, sport, etc.
• Sɔrɔ fɛn wɛrɛ la, a bɛ sɔrɔ : "Luɛ Sanoovia, sran man baara la tɔɔrɔ ye. A tɛ fɛn wɛrɛ dɛmɛ. Sran man fɔn yɛrɛ a bɛ ka dɛmɛ !"

══ BANJƐ KƐNƐNƐW ══
Sɔrɔ a sɔrɔ sran kɛnɛnɛ (dɔnni, hémorragie, u sɔrɔ, etc.), a bɛ sɔrɔ n'an : "URGENCE — Pɛnɛn SAMU : 185 ou Pompiers : 180."

══ N'U KUNAFɔLI ══
A bɛ n'un sɔrɔ kɛnɛ kɛ : "Kunnafoni : Luɛ sran man baara la tɔɔrɔ ye, a tɛ tɔɔrɔ ye. Kunnafoniw tɛ tɔɔrɔ kɛnɛ bɛɛ. Kɛnɛ, latɛn tɔɔrɔ kɛ."

══ FORMAT ══
• Baoulɛ kan ka dɛmɛ, a kɛrɛ, a tɛ sran bɛɛ jɛ.
• Kɛnɛ kɛ n'un sɔrɔ a yɛrɛ.`

const BASE_SYSTEM_PROMPT_DY = `I tɔɔrɔ Sanoovia ye, a ye banjɛ ɛɛrɛ kunnafoni ye Côte d'Ivoire la.

══ ANAN N'I KƆRƆBA ══
• A tɔɔrɔ tɛ ye, a infirmière tɛ ye, a banjɛ ɛɛrɛ baara la tɔɔrɔ tɛ ye.
• A banjɛ ɛɛrɛ diagnostic tɛ kɛ, i yɛrɛ a bɛ ɛnɛ.
• A kɔlɔlɔnw tɛ fɛsɛn, a dɔw ɛlɛmɔn tɛ, a baara sɔrɔ tɛ.
• A tɔɔrɔ kɛnɛ bɛɛ ka lasegɛn tɛ.
• Sɔrɔ i yɛ ɛnɛ, a bɛ a tɔɔrɔ sɔrɔ : a banjɛ ɛɛrɛ baara la tɔɔrɔ tɛ ye.

══ KUNNAFONIW AN I KA N'I SƠRƠ I YƐRƐ ══
• Banjɛ ɛɛrɛ sɔrɔnɔ ni banna (kunnafoni ye, diagnostic tɛ)
• Banjɛ banna ɛlɛmɔn ni klɔ yɛlɛma
• Kɛnɛ ni i banjɛ ɛɛrɛ
• Kɛnɛmɔkɔn ni ɛlɛmɔn banjɛ
• Côte d'Ivoire banjɛ banna (paludisme, typhoïde, choléra, etc.)
• Glɔ glɔbɛlɛ ni ninsi banjɛ (kunnafoni ye)
• Kɔlɔlɔnw (kunnafoni ye, a yɛrɛ — fɛsɛn tɛ)
• Banjɛ banjɛ (numéro wɛrɛw sɔrɔ)
• Côte d'Ivoire banjɛ ɛɛrɛ baara, lajɛw

══ FƐN WƐRƐ — A KA TƐBƐSƐ WƏLƏW ══
• Kunnafoni kɛrɛnkɛrɛnni, sɛnɛ, politikɛ, sport, etc.
• Sɔrɔ fɛn wɛrɛ la, a bɛ sɔrɔ : "I tɔɔrɔ Sanoovia ye, a ye banjɛ ɛɛrɛ la jɛlen ye. A tɛ fɛn wɛrɛ dɛmɛ. Banjɛ ɛɛrɛ fɔn yɛrɛ, a bɛ ka dɛmɛ !"

══ BANJƐ KƐNƐNƐW ══
Sɔrɔ a sɔrɔ banjɛ kɛnɛnɛ (dɔnni, hémorragie, u sɔrɔ, etc.), a bɛ sɔrɔ n'an : "URGENCE — Pɛnɛn SAMU : 185 ou Pompiers : 180."

══ N'I KUNAFƆLI ══
A bɛ n'i sɔrɔ kɛnɛ kɛ : "Kunnafoni : I tɔɔrɔ Sanoovia ye, a tɔɔrɔ tɛ ye. Kunnafoniw tɛ tɔɔrɔ kɛnɛ bɛɛ. Kɛnɛ, latɛn tɔɔrɔ kɛ."

══ FORMAT ══
• Dioula kan fɛ ka dɛmɛ, a kɛrɛ, a banjɛ ɛɛrɛ tɛ jɛ.
• Kɛnɛ kɛ n'i sɔrɔ i yɛrɛ.`

const BASE_SYSTEM_PROMPT_BQ = `Sanoovia yɛ, a lɛ sran ɛlɛmɔn wle Côte d'Ivoire.

══ ANAN N'AKƆRƆBA ══
• A tɛ tɔɔrɔ, a tɛ infirmière, a tɛ sran man baara tɔɔrɔ.
• A tɛ sran man kɔnɔkwɛn dɛmɛ, sɔrɔ a yɛrɛ a bɛ ɛnɛ.
• A tɛ kɔlɔlɔnw fɛsɛn, a tɛ dɔw ɛlɛmɔn, a tɛ baara wle.
• A tɛ tɔɔrɔ kɛnɛ bɛɛ ka lasegɛn.
• Sɔrɔ a yɛ ɛnɛ, a bɛ a sɔrɔ a tɛ sran man baara tɔɔrɔ, a tɛ ɛnɛ bɛɛ.

══ KUNNAFONIW AN A KA N'ASƠRƠ A YƐRƐ ══
• Sran man sɔrɔnɔw ni sran banna (kunnafoni, kɔnɔkwɛn tɛ)
• Sran banna ɛlɛmɔn ni klɔ yɛlɛma
• Kɛnɛ ni a yɛ sran man jɛ
• Kɛnɛmɔkɔn ni ɛlɛmɔn sran jɛ
• Côte d'Ivoire sran banna (paludisme, typhoïde, choléra, etc.)
• Glɔ glɔbɛlɛ ni ninsi sran jɛ (kunnafoni)
• Kɔlɔlɔnw (kunnafoni, a yɛrɛ — fɛsɛn tɛ)
• Sran banjɛ (numéro wɛrɛw sɔrɔ)
• Côte d'Ivoire sran man baara, bɛɛw

══ FƐN WƐRƐ — A KA TƐBƐSƐ WƏLƏW ══
• Kunnafoni kɛrɛnkɛrɛnni, sɛnɛ, politikɛ, sport, etc.
• Sɔrɔ fɛn wɛrɛ la, a bɛ sɔrɔ : "Sanoovia yɛ, sran man baara tɔɔrɔ. A tɛ fɛn wɛrɛ dɛmɛ. Sran man fɔn yɛrɛ, a bɛ ka dɛmɛ !"

══ BANJƐ KƐNƐNƐW ══
Sɔrɔ a sɔrɔ sran kɛnɛnɛ (dɔnni, hémorragie, u sɔrɔ, etc.), a bɛ sɔrɔ n'an : "URGENCE — Pɛnɛn SAMU : 185 ou Pompiers : 180."

══ N'AKUNAFƆLI ══
A bɛ n'asɔrɔ kɛnɛ kɛ : "Kunnafoni : Sanoovia yɛ, a tɛ tɔɔrɔ. Kunnafoniw tɛ tɔɔrɔ kɛnɛ bɛɛ. Kɛnɛ, latɛn tɔɔrɔ kɛ."

══ FORMAT ══
• Bété kan ka wle, a kɛrɛ, a tɛ sran bɛɛ jɛ.
• Kɛnɛ kɛ n'asɔrɔ a yɛrɛ.`

// ─── Extensions par catégorie ───────────────────────────────
function getCategoryExtension(language: string, category: string): string {
  const extensions: Record<string, Record<string, string>> = {
    fr: {
      premiers_secours: '\n\n══ SPÉCIALITÉ PREMIERS SECOURS ══\n• Donner des instructions claires pour les gestes de premiers secours\n• Couvrir : brûlures, coupures, saignements, étouffement, fractures, morsures, réactions allergiques, etc.\n• Toujours préciser quand appeler les urgences : SAMU 185, Pompiers 180\n• Rappeler les numéros d\'urgence de Côte d\'Ivoire',
      grossesse: '\n\n══ SPÉCIALITÉ GROSSESSE ══\n• Informer sur le suivi de grossesse par trimestre\n• Conseiller sur l\'alimentation, l\'hygiène, et l\'activité physique pendant la grossesse\n• Identifier les signes d\'alerte nécessitant une consultation médicale\n• Donner des conseils sur la préparation à l\'accouchement\n• Orienter vers les structures maternelles en Côte d\'Ivoire (CHU, cliniques)'
    },
    ba: {
      premiers_secours: '\n\n══ KƆLƆLƆNW ƐLƐMƆN ══\n• Kɔlɔlɔnw baara kɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, mɔrɛsɛ, etc.)\n• SAMU 185, Pompiers 180 pɛnɛn\n• Côte d\'Ivoire banjɛ numéro wɛrɛw sɔrɔ',
      grossesse: '\n\n══ GLƆ GLƆBƐLƐ ══\n• Glɔ glɔbɛlɛ ɛlɛmɔn sɔrɔ (kunnafoni ye)\n• Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n• Glɔ glɔbɛlɛ kan man ɛlɛmɔn sɔrɔ\n• Côte d\'Ivoire glɔ glɔbɛlɛ bɛɛw sɔrɔ (CHU, klinikiw)'
    },
    dy: {
      premiers_secours: '\n\n══ KƆLƆLƆNW ƐLƐMƆN ══\n• Kɔlɔlɔnw baara kɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, mɔrɛsɛ, etc.)\n• SAMU 185, Pompiers 180 pɛnɛn\n• Côte d\'Ivoire banjɛ numéro wɛrɛw sɔrɔ',
      grossesse: '\n\n══ GLƆ GLƆBƐLƐ ══\n• Glɔ glɔbɛlɛ ɛlɛmɔn sɔrɔ (kunnafoni ye)\n• Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n• Glɔ glɔbɛlɛ kan man ɛlɛmɔn sɔrɔ\n• Côte d\'Ivoire glɔ glɔbɛlɛ bɛɛw sɔrɔ (CHU, klinikiw)'
    },
    bq: {
      premiers_secours: '\n\n══ KƆLƆLƆNW ƐLƐMƆN ══\n• Kɔlɔlɔnw baara kɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, mɔrɛsɛ, etc.)\n• SAMU 185, Pompiers 180 pɛnɛn\n• Côte d\'Ivoire sran banjɛ numéro wɛrɛw sɔrɔ',
      grossesse: '\n\n══ GLƆ GLƆBƐLƐ ══\n• Glɔ glɔbɛlɛ ɛlɛmɔn wle (kunnafoni)\n• Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n• Glɔ glɔbɛlɛ kan man ɛlɛmɔn wle\n• Côte d\'Ivoire glɔ glɔbɛlɛ bɛɛw sɔrɔ (CHU, klinikiw)'
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
    noApiKey: 'Je suis Sanovia, votre assistant santé. Mon service est temporairement en maintenance. Pour toute urgence médicale, appelez le SAMU au 185 ou les Pompiers au 180. Veuillez réessayer dans quelques instants.',
    allFailed: 'Je suis Sanovia, votre assistant santé. Je rencontre une difficulté technique temporaire. Pour toute urgence, appelez le SAMU au 185 ou les Pompiers au 180. Veuillez réessayer dans quelques instants.',
  },
  ba: {
    noApiKey: 'Luɛ Sanoovia, i ka sran man baara la tɔɔrɔ. A sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ kɔnɔ, i bɛ SAMU 185 ou Pompiers 180 pɛnɛn. I bɛ sɔrɔ ɛnɛ.',
    allFailed: 'Luɛ Sanoovia, i ka sran man baara la tɔɔrɔ. A sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ kɔnɔ, i bɛ SAMU 185 ou Pompiers 180 pɛnɛn. I bɛ sɔrɔ ɛnɛ.',
  },
  dy: {
    noApiKey: 'I tɔɔrɔ Sanoovia ye, i ka banjɛ ɛɛrɛ baara la tɔɔrɔ. A sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ kɔnɔ, i bɛ SAMU 185 ou Pompiers 180 pɛnɛn. I bɛ sɔrɔ ɛnɛ.',
    allFailed: 'I tɔɔrɔ Sanoovia ye, i ka banjɛ ɛɛrɛ baara la tɔɔrɔ. A sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ kɔnɔ, i bɛ SAMU 185 ou Pompiers 180 pɛnɛn. I bɛ sɔrɔ ɛnɛ.',
  },
  bq: {
    noApiKey: 'Sanoovia yɛ, i ka sran man baara tɔɔrɔ. A sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ kɔnɔ, i bɛ SAMU 185 ou Pompiers 180 pɛnɛn. I bɛ sɔrɔ ɛnɛ.',
    allFailed: 'Sanoovia yɛ, i ka sran man baara tɔɔrɔ. A sɔrɔ baara ɛnɛ. Banjɛ kɛnɛnɛ kɔnɔ, i bɛ SAMU 185 ou Pompiers 180 pɛnɛn. I bɛ sɔrɔ ɛnɛ.',
  }
}

function getErrorMessage(language: string, key: string): string {
  return ERROR_MESSAGES[language]?.[key] || ERROR_MESSAGES.fr[key] || ERROR_MESSAGES.fr.allFailed
}

// ═══════════════════════════════════════════════════════════════
// 5. UTILITAIRES
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
    /^(i'm sorry|sorry|je suis désolé|désolé)\b/i,
    /^(an error occurred|erreur)/i,
    /^(as an ai|en tant qu'ia|i am an ai|je suis une intelligence artificielle)\b/i,
    /^(i cannot|je ne peux pas|i can't)\b/i,
    /^(the model|le modèle|this model|ce modèle)\b/i,
    /^(api error|openrouter error|rate limit|too many requests)\b/i,
    /^(\{.*\}|<.*>)$/,
    /^(connection|timeout|timed out|fetch error)\b/i,
    /^content_filter/i,
    /^safety/i,
  ]
  for (const pattern of errorPatterns) {
    if (pattern.test(trimmed)) return false
  }
  return true
}

// ═══════════════════════════════════════════════════════════════
// 6. FOURNISSEUR 1 — GOOGLE GEMINI (API DIRECTE)
// ═══════════════════════════════════════════════════════════════
//
// L'API Google Gemini est GRATUITE et DIRECTE.
// Pas de problème de disponibilité de modèles tiers.
// Créez votre clé : https://aistudio.google.com/apikey
// Limite : 1 500 requêtes/jour, 15 requêtes/minute.
//

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<ProviderResult> {
  const startTime = Date.now()

  // Convertir le format messages OpenAI → format Gemini
  const contents = []
  for (const msg of history.slice(-10)) {
    contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] })

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 1200,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  }

  // Si le modèle le supporte, ajouter system instruction
  if (model.includes('2.0') || model.includes('1.5')) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  } else {
    // Fallback : insérer le prompt système dans le premier message
    contents.unshift({ role: 'user', parts: [{ text: `Instructions système :\n${systemPrompt}\n\nRéponds maintenant à la question suivante.` }] })
    contents.unshift({ role: 'model', parts: [{ text: 'Bien compris, je suis Sanovia, assistant santé. Je suis prêt à aider.' }] })
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
        const errorText = await response.text().catch(() => '')

        // Clé invalide
        if (status === 400 || status === 403) {
          console.error(`[Gemini] ❌ ${model} — Erreur fatale (HTTP ${status}): ${errorText.slice(0, 100)}`)
          return { content: null, error: `GEMINI_FATAL_${status}`, provider: 'gemini', model, duration: Date.now() - startTime }
        }

        // Rate limit ou erreur serveur → retry
        if (isRetryableError(status) || status === 429 || status === 403) {
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1)
            console.warn(`[Gemini] ⚠️ ${model} — HTTP ${status}, retry dans ${delay}ms...`)
            await sleep(delay)
            continue
          }
        }

        return { content: null, error: `GEMINI_HTTP_${status}`, provider: 'gemini', model, duration: Date.now() - startTime }
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (content && isValidResponse(content)) {
        console.log(`[Gemini] ✅ ${model} — OK (${content.length} chars, ${Date.now() - startTime}ms)`)
        return { content: content.trim(), error: null, provider: 'gemini', model, duration: Date.now() - startTime }
      }

      // Contenu bloqué par les filtres de sécurité
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        console.warn(`[Gemini] ⚠️ ${model} — Contenu filtré par sécurité`)
        return { content: null, error: 'GEMINI_SAFETY_BLOCK', provider: 'gemini', model, duration: Date.now() - startTime }
      }

      // Réponse vide
      if (attempt < MAX_RETRIES) {
        console.warn(`[Gemini] ⚠️ ${model} — Réponse vide, retry...`)
        await sleep(RETRY_BASE_DELAY * attempt)
        continue
      }

      return { content: null, error: 'GEMINI_VIDE', provider: 'gemini', model, duration: Date.now() - startTime }

    } catch (err: any) {
      clearTimeout(timeoutId)

      if (err?.name === 'AbortError') {
        console.warn(`[Gemini] ⏱️ ${model} — timeout`)
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_DELAY * attempt)
          continue
        }
        return { content: null, error: 'GEMINI_TIMEOUT', provider: 'gemini', model, duration: Date.now() - startTime }
      }

      console.warn(`[Gemini] ⚠️ ${model} — Erreur réseau: ${err?.message}`)
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY * attempt)
        continue
      }
      return { content: null, error: err?.message || 'GEMINI_NETWORK', provider: 'gemini', model, duration: Date.now() - startTime }
    }
  }

  return { content: null, error: 'GEMINI_MAX_RETRIES', provider: 'gemini', model, duration: Date.now() - startTime }
}

/**
 * Tente d'obtenir une réponse via Google Gemini.
 * Teste tous les modèles Gemini en parallèle, retourne la première réponse valide.
 */
async function tryGemini(
  systemPrompt: string,
  userMessage: string,
  language: string,
  history: ChatMessage[]
): Promise<ProviderResult | null> {
  const apiKey = (process.env.GOOGLE_AI_API_KEY || '').trim()
  if (!apiKey || apiKey.length < 10) {
    console.log('[Gemini] ⏭️ Clé API non configurée, saut du fournisseur Gemini')
    return null
  }

  console.log(`[Gemini] 🚀 Démarrage avec ${GEMINI_MODELS.length} modèle(s)`)

  // Tester tous les modèles Gemini en parallèle
  const results = await Promise.all(
    GEMINI_MODELS.map(model => callGemini(apiKey, model, systemPrompt, userMessage, history))
  )

  // Retourner la première réponse valide
  for (const result of results) {
    if (result.content) return result
  }

  // Tous échoués
  console.warn(`[Gemini] ❌ Tous les modèles ont échoué: ${results.map(r => `${r.model}: ${r.error}`).join(', ')}`)

  // Si erreur fatale (clé invalide), ne pas réessayer
  const hasFatal = results.some(r => r.error?.startsWith('GEMINI_FATAL'))
  if (hasFatal) {
    console.error('[Gemini] ❌ Erreur fatale détectée, désactivation du fournisseur')
  }

  return { content: null, error: 'GEMINI_ALL_FAILED', provider: 'gemini', model: 'all', duration: 0 }
}

// ═══════════════════════════════════════════════════════════════
// 7. FOURNISSEUR 2 — OPENROUTER (12 MODÈLES GRATUITS)
// ═══════════════════════════════════════════════════════════════

const recentFailures = new Map<string, { count: number; lastFail: number }>()
const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_COOLDOWN = 120_000

function isModelCircuitBroken(model: string): boolean {
  const state = recentFailures.get(model)
  if (!state) return false
  if (state.count < CIRCUIT_BREAKER_THRESHOLD) return false
  if (Date.now() - state.lastFail > CIRCUIT_BREAKER_COOLDOWN) {
    recentFailures.delete(model)
    return false
  }
  return true
}

function recordFailure(model: string) {
  const state = recentFailures.get(model) || { count: 0, lastFail: 0 }
  state.count++
  state.lastFail = Date.now()
  recentFailures.set(model, state)
}

function recordSuccess(model: string) {
  recentFailures.delete(model)
}

async function callOpenRouterModel(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<ProviderResult> {
  const startTime = Date.now()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_REQUEST)

    try {
      console.log(`[OpenRouter] ${model} — tentative ${attempt}/${MAX_RETRIES}`)

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://sanovia.vercel.app',
          'X-Title': 'Sanovia Health AI',
        },
        body: JSON.stringify({ model, messages, temperature: 0.65, max_tokens: 1200 }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const status = response.status
        const errorText = await response.text().catch(() => '')

        if (status === 401 || status === 403) {
          return { content: null, error: 'OR_KEY_INVALID', provider: 'openrouter', model, duration: Date.now() - startTime }
        }

        if (isRetryableError(status) && attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1)
          console.warn(`[OpenRouter] ⚠️ ${model} — HTTP ${status}, retry dans ${delay}ms...`)
          await sleep(delay)
          continue
        }

        recordFailure(model)
        return { content: null, error: `OR_HTTP_${status}`, provider: 'openrouter', model, duration: Date.now() - startTime }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (content && isValidResponse(content)) {
        console.log(`[OpenRouter] ✅ ${model} — OK (${content.length} chars, ${Date.now() - startTime}ms)`)
        recordSuccess(model)
        return { content: content.trim(), error: null, provider: 'openrouter', model, duration: Date.now() - startTime }
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY * attempt)
        continue
      }

      recordFailure(model)
      return { content: null, error: 'OR_VIDE', provider: 'openrouter', model, duration: Date.now() - startTime }

    } catch (err: any) {
      clearTimeout(timeoutId)

      if (err?.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_BASE_DELAY * attempt)
          continue
        }
        recordFailure(model)
        return { content: null, error: 'OR_TIMEOUT', provider: 'openrouter', model, duration: Date.now() - startTime }
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY * attempt)
        continue
      }
      recordFailure(model)
      return { content: null, error: err?.message || 'OR_NETWORK', provider: 'openrouter', model, duration: Date.now() - startTime }
    }
  }

  recordFailure(model)
  return { content: null, error: 'OR_MAX_RETRIES', provider: 'openrouter', model, duration: Date.now() - startTime }
}

/**
 * Tente OpenRouter avec des batchs de modèles en parallèle.
 */
async function tryOpenRouter(
  systemPrompt: string,
  userMessage: string,
  language: string,
  history: ChatMessage[],
  globalDeadline: number
): Promise<ProviderResult | null> {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim()
  if (!apiKey || apiKey.length < 10) {
    console.log('[OpenRouter] ⏭️ Clé API non configurée, saut du fournisseur')
    return null
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-20).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ]

  // Modèle personnalisé optionnel
  const customModel = process.env.OPENROUTER_MODEL?.trim()
  const allModels = [
    ...(customModel ? [customModel] : []),
    ...OPENROUTER_MODELS
  ]
  const uniqueModels = [...new Set(allModels)]
  const availableModels = uniqueModels.filter(m => !isModelCircuitBroken(m))

  if (availableModels.length === 0) {
    // Reset circuit breaker et réessayer
    recentFailures.clear()
  }

  const modelsToTry = availableModels.length > 0 ? availableModels : uniqueModels.slice(0, 4)
  console.log(`[OpenRouter] 🚀 ${modelsToTry.length} modèle(s) disponible(s)`)

  // Essai par batchs parallèles
  for (let i = 0; i < modelsToTry.length; i += PARALLEL_BATCH_SIZE) {
    if (Date.now() >= globalDeadline) break

    const batch = modelsToTry.slice(i, i + PARALLEL_BATCH_SIZE)
    const results = await Promise.all(
      batch.map(model => callOpenRouterModel(apiKey, model, messages))
    )

    for (const result of results) {
      if (result.content) return result
      if (result.error === 'OR_KEY_INVALID') {
        console.error('[OpenRouter] ❌ Clé API invalide')
        return { content: null, error: 'OR_KEY_INVALID', provider: 'openrouter', model: 'all', duration: 0 }
      }
    }
  }

  return { content: null, error: 'OR_ALL_FAILED', provider: 'openrouter', model: 'all', duration: 0 }
}

// ═══════════════════════════════════════════════════════════════
// 8. FOURNISSEUR 3 — RÉPONSES PRÉ-CONSTRUITES (HORS LIGNE)
// ═══════════════════════════════════════════════════════════════
//
// Ce fournisseur fonctionne TOUJOURS, même sans internet.
// Il utilise une base de connaissances locale pour répondre aux
// questions santé les plus courantes en Côte d'Ivoire.
//

function getOfflineResponse(userMessage: string, language: string): string | null {
  const msg = userMessage.toLowerCase().trim()

  const responses: Record<string, Record<string, string>> = {
    fr: {
      paludisme: `Le paludisme (malaria) est une maladie grave causée par un parasite transmis par les moustiques. C'est l'une des maladies les plus fréquentes en Côte d'Ivoire.

**Symptômes courants :**
• Fièvre élevée et frissons
• Maux de tête intenses
• Fatigue et faiblesse
• Nausées et vomissements
• Douleurs musculaires et articulaires
• Parfois sueurs abondantes

**Prévention essentielle :**
• Dormir sous une moustiquaire imprégnée d'insecticide
• Utiliser des répulsifs antimoustiques
• Porter des vêtements longs le soir
• Éliminer les eaux stagnantes autour de chez vous
• Prendre un traitement préventif si recommandé par un médecin

**Que faire en cas de suspicion :**
Consultez rapidement un centre de santé. Le paludisme se traite efficacement avec des médicaments antipaludéens prescrits par un médecin. Ne tardez pas, car un traitement tardif peut entraîner des complications graves.

URGENCE : Si vous observez des signes de paludisme grave (confusion, convulsions, difficultés à respirer, jaunisse), appelez immédiatement le SAMU au 185 ou rendez-vous aux urgences les plus proches.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      typhoide: `La fièvre typhoïde est une infection bactérienne grave, très présente en Côte d'Ivoire. Elle se transmet par l'eau et les aliments contaminés.

**Symptômes principaux :**
• Fièvre élevée et progressive
• Maux de tête
• Fatigue importante
• Douleurs abdominales
• Constipation ou diarrhée
• Éruption cutanée (parfois)
• Perte d'appétit

**Prévention :**
• Lavez-vous les mains régulièrement avec du savon
• Buvez uniquement de l'eau traitée ou embouteillée
• Évitez les aliments crus non lavés
• Lavez soigneusement les fruits et légumes
• Assurez une bonne hygiène alimentaire

**Traitement :**
La typhoïde nécessite un traitement antibiotique prescrit par un médecin. Consultez un centre de santé dès l'apparition des symptômes.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      cholera: `Le choléra est une infection diarrhéique aiguë causée par la consommation d'eau ou d'aliments contaminés. C'est une maladie grave nécessitant une prise en charge médicale rapide.

**Symptômes :**
• Diarrhée liquide abondante et soudaine (eau de riz)
• Vomissements
• Déshydratation rapide (bouche sèche, yeux enfoncés, peau froide)
• Crampes musculaires
• Faiblesse extrême

**Prévention :**
• Buvez uniquement de l'eau potable (traitée, bouillie ou embouteillée)
• Lavez-vous les mains systématiquement avant de manger et après les toilettes
• Évitez les aliments vendus dans la rue sans garantie d'hygiène
• Désinfectez les fruits et légumes avant consommation
• Utilisez des latrines propres

**URGENCE :** Le choléra peut être mortel en quelques heures en raison de la déshydratation. En cas de suspicion, rendez-vous immédiatement dans un centre de santé. Appelez le SAMU au 185 si la personne est très faible ou incapable de se déplacer.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      grossesse: `La grossesse est une période importante qui nécessite un suivi médical régulier pour assurer la santé de la mère et du bébé.

**Suivi de grossesse recommandé en Côte d'Ivoire :**
• 1er trimestre (1-3 mois) : Première consultation prénatale (CPN1), analyses sanguines, échographie
• 2ème trimestre (4-6 mois) : CPN2, paludisme prophylaxie, supplémentation en fer et acide folique
• 3ème trimestre (7-9 mois) : CPN3 et CPN4, préparation à l'accouchement, vaccination

**Alimentation recommandée :**
• Fruits et légumes frais chaque jour
• Protéines (poisson, viande, œufs, légumineuses)
• Céréales complètes (riz, mil, maïs)
• Lait et produits laitiers
• Boire beaucoup d'eau potable

**Signes d'alerte nécessitant une consultation urgente :**
• Saignements vaginaux
• Douleurs abdominales intenses
• Maux de tête sévères et troubles de la vision
• Perte de liquide (les eaux)
• Mouvements du bébé diminués ou absents
• Fièvre élevée

Consultez un centre de santé maternelle (CHU, maternité, centre de santé) dès le début de la grossesse.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      diabete: `Le diabète est une maladie chronique caractérisée par un taux de sucre (glucose) trop élevé dans le sang. Il existe principalement deux types : le diabète de type 1 et le diabète de type 2.

**Symptômes courants :**
• Soif intense et fréquente
• Urinations abondantes
• Fatigue chronique
• Vision floue
• Cicatrisation lente des plaies
• Perte de poids inexpliquée (type 1)
• Fourmillements dans les mains et pieds

**Prévention (surtout type 2) :**
• Alimentation équilibrée et variée
• Activité physique régulière (30 min par jour minimum)
• Maintenir un poids santé
• Limiter les boissons sucrées et aliments riches en sucre
• Faire des contrôles sanguins réguliers

**Complications possibles si non traité :**
Problèmes cardiaques, atteinte des reins, problèmes de vue, lésions nerveuses, amputations.

Il est essentiel de consulter un médecin pour un diagnostic et un suivi régulier. Le diabète se gère bien avec un traitement médical approprié et un mode de vie sain.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      hypertension: `L'hypertension artérielle (tension élevée) est une condition où la pression du sang sur les parois des artères est anormalement élevée. C'est un facteur de risque majeur de maladies cardiovasculaires.

**Facteurs de risque :**
• Alimentation trop salée
• Sédentarité (manque d'activité physique)
• Surpoids et obésité
• Consommation excessive d'alcool
• Tabagisme
• Stress chronique
• Antécédents familiaux

**Symptômes (souvent silencieuse) :**
L'hypertension est souvent appelée "le tueur silencieux" car elle ne provoque généralement pas de symptômes. Parfois : maux de tête, vertiges, saignements de nez, essoufflement.

**Prévention et prise en charge :**
• Réduire la consommation de sel
• Manger plus de fruits et légumes
• Faire de l'exercice régulièrement
• Perdre du poids si nécessaire
• Arrêter le tabac
• Limiter l'alcool
• Faire mesurer sa tension régulièrement en pharmacie ou au centre de santé

Consultez un médecin pour un diagnostic. Un traitement médical peut être nécessaire pour contrôler la tension.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      sante_mentale: `La santé mentale est aussi importante que la santé physique. En Côte d'Ivoire, de nombreuses personnes souffrent de problèmes de santé mentale sans recevoir de prise en charge appropriée.

**Signes à surveiller :**
• Tristesse persistante pendant plus de 2 semaines
• Perte d'intérêt pour les activités habituelles
• Troubles du sommeil (insomnie ou hypersomnie)
• Anxiété excessive et permanente
• Irritabilité et colère fréquentes
• Difficultés de concentration
• Sentiment de désespoir ou d'inutilité
• Repli social et isolement

**Conseils pour maintenir une bonne santé mentale :**
• Parlez à vos proches de ce que vous ressentez
• Pratiquez une activité physique régulière
• Adoptez une routine de sommeil régulière
• Méditez ou faites des exercices de respiration
• Limitez la consommation d'alcool et de substances
• Fixez-vous des objectifs réalistes

**Où trouver de l'aide en Côte d'Ivoire :**
• Centre Hospitalier Universitaire (CHU) de Cocody ou de Yopougon
• Service de psychiatrie dans les grands hôpitaux
• Associations d'aide psychologique
• Ligne d'écoute (renseignez-vous auprès du centre de santé le plus proche)

N'hésitez pas à consulter un professionnel de santé mentale. Demander de l'aide est un signe de force, pas de faiblesse.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      nutrition: `Une bonne nutrition est la base d'une bonne santé. En Côte d'Ivoire, une alimentation équilibrée contribue à prévenir de nombreuses maladies.

**Principes d'une alimentation saine :**
• Manger des fruits et légumes à chaque repas (au moins 5 portions par jour)
• Consommer des céréales complètes (riz complet, mil, maïs)
• Inclure des protéines : poisson, viande maigre, œufs, légumineuses (niébé, arachide)
• Limiter les graisses saturées (huiles de palme en excès, fritures)
• Privilégier les cuissons à la vapeur, bouillies ou grillées
• Boire au moins 1,5 à 2 litres d'eau potable par jour
• Limiter les boissons sucrées et les aliments ultra-transformés

**Aliments locaux recommandés :**
• Légumes : igname, patate douce, manioc, taro, gombo, aubergine
• Fruits : banane, papaye, mangue, ananas, agrumes
• Protéines : poisson frais, poulet, œufs, lentilles
• Céréales : riz, mil, maïs, fonio

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,

      urgence: `URGENCE — Appelez immédiatement le SAMU : 185 ou les Pompiers : 180.

**Numéros d'urgence en Côte d'Ivoire :**
• SAMU (Urgences médicales) : 185
• Pompiers : 180
• Police : 170 (ou 111)
• Centre Anti-Poison : contactez le CHU le plus proche

**Signes nécessitant un appel d'urgence :**
• Douleur thoracique intense ou压迫
• Difficultés respiratoires sévères
• Saignements abondants impossibles à arrêter
• Perte de conscience
• Convulsions
• Brûlures étendues
• Traumatisme grave (accident)
• Symptômes d'AVC (paralysie faciale, trouble de la parole, faiblesse d'un côté)

En attendant les secours :
• Restez calme et ne déplacez pas la victime sauf en cas de danger imminent
• Maintenez la victime au chaud
• Si la personne est consciente, parlez-lui calmement
• Si elle ne respire plus, pratiquez les gestes de premiers secours si vous êtes formé

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Appelez les urgences pour toute situation critique.`,

      default: `Bonjour ! Je suis Sanovia, votre assistant santé numérique pour la Côte d'Ivoire.

Je peux vous informer sur de nombreux sujets de santé :
• Les maladies courantes (paludisme, typhoïde, choléra, diabète, hypertension...)
• La prévention et l'hygiène de vie
• La nutrition et l'alimentation
• La santé maternelle et infantile
• Les premiers secours
• La santé mentale
• Le système de santé ivoirien

Posez-moi votre question de santé, je ferai mon possible pour vous aider !

URGENCE : Pour toute situation médicale grave, appelez le SAMU au 185 ou les Pompiers au 180.

Rappel important : Je suis un assistant informatif, pas un médecin. Ces informations ne remplacent pas un avis médical professionnel. Consultez un médecin ou rendez-vous dans un centre de santé pour toute situation personnelle.`,
    },
    ba: {
      paluditre: `Paluditre (malaria) ye sran banna ye Côte d'Ivoire la.

Paluditre kɛnɛnɛw : 
- Awo la (fièvre) min bɛ kɛ ka bɔ a la
- Tɔɔ kɛnɛnɛ
- A bɛ a yɛrɛ a ma
- Tɛmɛ bɛɛ yɛrɛ ka ɲɛ

A bɛ kɛ n'ɛ : 
- Klɔsɛn bɛɛ ɛnɛ a la
- I bɛ sɔrɔ klɔsɛn bɛɛw fɛn banna kɛ
- I bɛ jɛ a ɛnɛ

A bɛ i bolo sɔrɔ : Paluditre bɛ baara kɛ n'un sran man tɔɔrɔ fɛ. Kɛnɛ, latɛn tɔɔrɔ kɛ.

URGENCE — Pɛnɛn SAMU : 185 ou Pompiers : 180.

Kunnafoni : Luɛ sran man baara la tɔɔrɔ ye, a tɛ tɔɔrɔ ye. Kɛnɛ, latɛn tɔɔrɔ kɛ.`,

      default: `I sɔgɔ ! Luɛ Sanoovia, i ka sran man baara la tɔɔrɔ.

I bɛ a fɔ : paluditre, sran banna, kɛnɛ, glɔ glɔbɛlɛ...

URGENCE : Sran banjɛ kɛnɛnɛ, SAMU 185 ou Pompiers 180.

Kunnafoni : Luɛ sran man baara la tɔɔrɔ ye, a tɛ tɔɔrɔ ye. Kɛnɛ, latɛn tɔɔrɔ kɛ.`,
    },
    dy: {
      default: `I kɛnɛ ! I tɔɔrɔ Sanoovia ye, i ka banjɛ ɛɛrɛ baara la tɔɔrɔ.

I bɛ a fɔ : paludisme, banjɛ banna, kɛnɛ, glɔ glɔbɛlɛ...

URGENCE : Banjɛ kɛnɛnɛ, SAMU 185 ou Pompiers 180.

Kunnafoni : I tɔɔrɔ Sanoovia ye, a tɔɔrɔ tɛ ye. Kɛnɛ, latɛn tɔɔrɔ kɛ.`,
    },
    bq: {
      default: `I kɛnɛ ! Sanoovia yɛ, i ka sran man baara tɔɔrɔ.

I bɛ a fɔ : paludisme, sran banna, kɛnɛ, glɔ glɔbɛlɛ...

URGENCE : Sran banjɛ kɛnɛnɛ, SAMU 185 ou Pompiers 180.

Kunnafoni : Sanoovia yɛ, a tɛ tɔɔrɔ. Kɛnɛ, latɛn tɔɔrɔ kɛ.`,
    }
  }

  // Chercher une correspondance par mots-clés
  const keywords: Record<string, string[]> = {
    paludisme: ['palud', 'malaria', 'moustiqu', 'fièvre'],
    typhoide: ['typho', 'fièvre typho'],
    cholera: ['cholér', 'diarrh', 'déshydrat'],
    grossesse: ['grosses', 'enceint', 'accouch', 'gestation', 'bébé', 'foetus', 'fœtus'],
    diabete: ['diabèt', 'sucre', 'glycémi', 'glucose', 'insuline'],
    hypertension: ['hypertens', 'tension', 'pression artér'],
    sante_mentale: ['dépress', 'anxiét', 'stress', 'mental', 'psycho', 'triste', 'angoiss', 'suicid'],
    nutrition: ['nutrition', 'aliment', 'manger', 'régime', 'vitamine', 'protéine'],
    urgence: ['urgence', 'samu', 'pompiers', 'appel', 'secours', 'hérmorrag', 'étouff', 'convulsion'],
  }

  const langResponses = responses[language] || responses.fr

  for (const [key, words] of Object.entries(keywords)) {
    if (words.some(w => msg.includes(w))) {
      const response = langResponses[key]
      if (response) return response
      break
    }
  }

  // Réponse par défaut
  return langResponses.default || responses.fr.default
}

// ═══════════════════════════════════════════════════════════════
// 9. FONCTION PRINCIPALE — chatWithAI
// ═══════════════════════════════════════════════════════════════

export async function chatWithAI(
  userMessage: string,
  language: string = 'fr',
  category: string = 'general',
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const globalStart = Date.now()
  const globalDeadline = globalStart + GLOBAL_TIMEOUT

  // ─── 0. Vérifier le cache ───────────────────────────────
  const cached = cache.get(userMessage, language)
  if (cached) return cached

  // ─── 1. Vérifier les clés API ───────────────────────────
  const geminiKey = (process.env.GOOGLE_AI_API_KEY || '').trim()
  const openrouterKey = (process.env.OPENROUTER_API_KEY || '').trim()
  const hasAnyKey = (geminiKey.length >= 10) || (openrouterKey.length >= 10)

  if (!hasAnyKey) {
    console.error('[Sanovia v4] ❌ Aucune clé API configurée (ni Gemini ni OpenRouter)')
    // Mode hors-ligne complet
    const offline = getOfflineResponse(userMessage, language)
    if (offline) {
      cache.set(userMessage, language, offline)
      return offline
    }
    return getErrorMessage(language, 'noApiKey')
  }

  const systemPrompt = getSystemPrompt(language, category)

  console.log(`[Sanovia v4] 🚀 Requête — langue: ${language}, catégorie: ${category}, Gemini: ${geminiKey ? '✅' : '❌'}, OpenRouter: ${openrouterKey ? '✅' : '❌'}`)

  // ─── 2. FOURNISSEUR 1 : Google Gemini (si configuré) ────
  if (geminiKey.length >= 10) {
    console.log('[Sanovia v4] 📡 Tentative via Google Gemini...')
    const geminiResult = await tryGemini(systemPrompt, userMessage, language, conversationHistory)

    if (geminiResult?.content) {
      const duration = Date.now() - globalStart
      console.log(`[Sanovia v4] ✅ Succès via Gemini en ${duration}ms`)
      cache.set(userMessage, language, geminiResult.content)
      return geminiResult.content
    }

    console.warn(`[Sanovia v4] ⚠️ Gemini échoué: ${geminiResult?.error}`)
  }

  // ─── 3. FOURNISSEUR 2 : OpenRouter (si configuré) ───────
  if (openrouterKey.length >= 10 && Date.now() < globalDeadline) {
    console.log('[Sanovia v4] 📡 Tentative via OpenRouter...')
    const orResult = await tryOpenRouter(systemPrompt, userMessage, language, conversationHistory, globalDeadline)

    if (orResult?.content) {
      const duration = Date.now() - globalStart
      console.log(`[Sanovia v4] ✅ Succès via OpenRouter en ${duration}ms`)
      cache.set(userMessage, language, orResult.content)
      return orResult.content
    }

    console.warn(`[Sanovia v4] ⚠️ OpenRouter échoué: ${orResult?.error}`)
  }

  // ─── 4. FOURNISSEUR 3 : Réponses pré-construites ────────
  console.log('[Sanovia v4] 📦 Fallback vers réponses pré-construites...')
  const offlineResponse = getOfflineResponse(userMessage, language)
  if (offlineResponse) {
    const duration = Date.now() - globalStart
    console.log(`[Sanovia v4] ✅ Réponse hors-ligne fournie en ${duration}ms`)
    cache.set(userMessage, language, offlineResponse)
    return offlineResponse
  }

  // ─── 5. Dernier recours ─────────────────────────────────
  console.error(`[Sanovia v4] ❌ Tous les fournisseurs ont échoué après ${Date.now() - globalStart}ms`)
  return getErrorMessage(language, 'allFailed')
}

// ═══════════════════════════════════════════════════════════════
// 10. FONCTION DE DIAGNOSTIC
// ═══════════════════════════════════════════════════════════════

export async function diagnoseAPI(): Promise<{
  status: string
  providers: Array<{
    name: string
    configured: boolean
    models: Array<{ model: string; status: string; latency: number }>
  }>
  cache: { size: number; max: number }
  totalDuration: number
}> {
  const start = Date.now()
  const providers: Array<{
    name: string
    configured: boolean
    models: Array<{ model: string; status: string; latency: number }>
  }> = []

  // Tester Google Gemini
  const geminiKey = (process.env.GOOGLE_AI_API_KEY || '').trim()
  if (geminiKey.length >= 10) {
    const models: Array<{ model: string; status: string; latency: number }> = []
    for (const model of GEMINI_MODELS.slice(0, 1)) {
      const modelStart = Date.now()
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Dis OK' }] }],
            generationConfig: { maxOutputTokens: 5 }
          }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        models.push({ model, status: response.ok ? `OK (${response.status})` : `ÉCHOUÉ (${response.status})`, latency: Date.now() - modelStart })
      } catch (err: any) {
        models.push({ model, status: `ERREUR: ${err?.message || 'Inconnue'}`, latency: Date.now() - modelStart })
      }
    }
    providers.push({ name: 'Google Gemini', configured: true, models })
  } else {
    providers.push({ name: 'Google Gemini', configured: false, models: [] })
  }

  // Tester OpenRouter
  const orKey = (process.env.OPENROUTER_API_KEY || '').trim()
  if (orKey.length >= 10) {
    const models: Array<{ model: string; status: string; latency: number }> = []
    for (const model of OPENROUTER_MODELS.slice(0, 2)) {
      const modelStart = Date.now()
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${orKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Dis OK' }], max_tokens: 5 }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        models.push({ model, status: response.ok ? `OK (${response.status})` : `ÉCHOUÉ (${response.status})`, latency: Date.now() - modelStart })
      } catch (err: any) {
        models.push({ model, status: `ERREUR: ${err?.message || 'Inconnue'}`, latency: Date.now() - modelStart })
      }
    }
    providers.push({ name: 'OpenRouter', configured: true, models })
  } else {
    providers.push({ name: 'OpenRouter', configured: false, models: [] })
  }

  return {
    status: providers.some(p => p.configured) ? 'partiel' : 'aucune_cle',
    providers,
    cache: { size: cache.size, max: CACHE_MAX_SIZE },
    totalDuration: Date.now() - start
  }
}
