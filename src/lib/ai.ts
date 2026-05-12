// ============================================================
// SANOvIA - IA via OpenRouter (version stable + multilingue)
// - Timeout 15s + retry 2x par modèle
// - Prompts complets pour TOUTES les langues (sécurité incluse)
// - Erreurs traduites dans la langue de l'utilisateur
// - Modèles ultra-stables
// ============================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// ─── Configuration ───────────────────────────────────────────
const TIMEOUT_MS = 15000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// ─── Modèles par ordre de stabilité ──────────────────────────
const FALLBACK_MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-4-scout:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'qwen/qwen3-32b:free',
]

// ============================================================
// TYPES
// ============================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============================================================
// PROMPTS SYSTÈME — VERSION COMPLÈTE POUR TOUTES LES LANGUES
// ============================================================

// ─── FRANÇAIS ────────────────────────────────────────────────
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

// ─── BAOULÉ ─────────────────────────────────────────────────
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

// ─── DIOULA ─────────────────────────────────────────────────
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

// ─── BÉTÉ ───────────────────────────────────────────────────
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

// ─── EXTENSIONS PAR CATÉGORIE ───────────────────────────────
function getCategoryExtension(language: string, category: string): string {
  const extensions: Record<string, Record<string, string>> = {
    fr: {
      premiers_secours: `\n\n══ SPÉCIALITÉ PREMIERS SECOURS ══\n• Donner des instructions claires pour les gestes de premiers secours\n• Couvrir : brûlures, coupures, saignements, étouffement, fractures, morsures, réactions allergiques, etc.\n• Toujours préciser quand appeler les urgences : SAMU 185, Pompiers 180\n• Rappeler les numéros d'urgence de Côte d'Ivoire`,
      grossesse: `\n\n══ SPÉCIALITÉ GROSSESSE ══\n• Informer sur le suivi de grossesse par trimestre\n• Conseiller sur l'alimentation, l'hygiène, et l'activité physique pendant la grossesse\n• Identifier les signes d'alerte nécessitant une consultation médicale\n• Donner des conseils sur la préparation à l'accouchement\n• Orienter vers les structures maternelles en Côte d'Ivoire (CHU, cliniques)`
    },
    ba: {
      premiers_secours: `\n\n══ KƆLƆLƆNW ƐLƐMƆN ══\n• Kɔlɔlɔnw baara kɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, mɔrɛsɛ, etc.)\n• SAMU 185, Pompiers 180 pɛnɛn\n• Côte d'Ivoire banjɛ numéro wɛrɛw sɔrɔ`,
      grossesse: `\n\n══ GLƆ GLƆBƐLƐ ══\n• Glɔ glɔbɛlɛ ɛlɛmɔn sɔrɔ (kunnafoni ye)\n• Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n• Glɔ glɔbɛlɛ kan man ɛlɛmɔn sɔrɔ\n• Côte d'Ivoire glɔ glɔbɛlɛ bɛɛw sɔrɔ (CHU, klinikiw)`
    },
    dy: {
      premiers_secours: `\n\n══ KƆLƆLƆNW ƐLƐMƆN ══\n• Kɔlɔlɔnw baara kɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, mɔrɛsɛ, etc.)\n• SAMU 185, Pompiers 180 pɛnɛn\n• Côte d'Ivoire banjɛ numéro wɛrɛw sɔrɔ`,
      grossesse: `\n\n══ GLƆ GLƆBƐLƐ ══\n• Glɔ glɔbɛlɛ ɛlɛmɔn sɔrɔ (kunnafoni ye)\n• Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n• Glɔ glɔbɛlɛ kan man ɛlɛmɔn sɔrɔ\n• Côte d'Ivoire glɔ glɔbɛlɛ bɛɛw sɔrɔ (CHU, klinikiw)`
    },
    bq: {
      premiers_secours: `\n\n══ KƆLƆLƆNW ƐLƐMƆN ══\n• Kɔlɔlɔnw baara kɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, mɔrɛsɛ, etc.)\n• SAMU 185, Pompiers 180 pɛnɛn\n• Côte d'Ivoire sran banjɛ numéro wɛrɛw sɔrɔ`,
      grossesse: `\n\n══ GLƆ GLƆBƐLƐ ══\n• Glɔ glɔbɛlɛ ɛlɛmɔn wle (kunnafoni)\n• Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n• Glɔ glɔbɛlɛ kan man ɛlɛmɔn wle\n• Côte d'Ivoire glɔ glɔbɛlɛ bɛɛw sɔrɔ (CHU, klinikiw)`
    }
  }

  const langExtensions = extensions[language] || extensions.fr
  return langExtensions[category] || ''
}

// ─── PROMPTS ASSEMBLÉS ──────────────────────────────────────
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

// ─── MESSAGES D'ERREUR TRADUITS ─────────────────────────────
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  fr: {
    noApiKey: 'Je rencontre une difficulté technique. La configuration serveur est incomplète. Veuillez contacter l\'administrateur.',
    invalidKey: 'Je rencontre une difficulté technique liée à l\'authentification. Veuillez contacter l\'administrateur.',
    allFailed: 'Je rencontre une difficulté technique temporaire. Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support.',
  },
  ba: {
    noApiKey: 'A sɔrɔ baara la. Bɛɛw tɛ sɔrɔ. I bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
    invalidKey: 'A sɔrɔ baara la. A kɛnɛnɛ. I bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
    allFailed: 'A sɔrɔ baara la. I bɛ sɔrɔ ɛnɛ. Sɔrɔ a sɔrɔ, i bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
  },
  dy: {
    noApiKey: 'A sɔrɔ baara la. Bɛɛw tɛ sɔrɔ. I bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
    invalidKey: 'A sɔrɔ baara la. A kɛnɛnɛ. I bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
    allFailed: 'A sɔrɔ baara la. I bɛ sɔrɔ ɛnɛ. Sɔrɔ a sɔrɔ, i bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
  },
  bq: {
    noApiKey: 'A sɔrɔ baara la. Bɛɛw tɛ sɔrɔ. I bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
    invalidKey: 'A sɔrɔ baara la. A kɛnɛnɛ. I bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
    allFailed: 'A sɔrɔ baara la. I bɛ sɔrɔ ɛnɛ. Sɔrɔ a sɔrɔ, i bɛ latɛn ɛnɛ mɔgɔw sɔrɔ.',
  }
}

function getErrorMessage(language: string, key: string): string {
  return ERROR_MESSAGES[language]?.[key] || ERROR_MESSAGES.fr[key] || ERROR_MESSAGES.fr.allFailed
}

// ============================================================
// UTILITAIRES
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

// ============================================================
// APPEL API AVEC TIMEOUT + RETRY
// ============================================================

async function callModel(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string | null; error: string | null }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      console.log(`[Sanoovia AI] ${model} — tentative ${attempt}/${MAX_RETRIES}`)

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://sanovia.vercel.app',
          'X-Title': 'Sanovia',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.65,
          max_tokens: 1200,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const status = response.status
        const errorText = await response.text().catch(() => 'Pas de réponse')

        if (status === 401 || status === 403) {
          console.error(`[Sanoovia AI] ${model} — Clé API invalide (HTTP ${status})`)
          return { content: null, error: 'CLÉ_API_INVALIDE' }
        }

        if (isRetryableError(status) && attempt < MAX_RETRIES) {
          console.warn(`[Sanoovia AI] ${model} — HTTP ${status}, retry dans ${RETRY_DELAY_MS}ms...`)
          await sleep(RETRY_DELAY_MS * attempt)
          continue
        }

        console.warn(`[Sanoovia AI] ${model} — HTTP ${status}: ${errorText.slice(0, 200)}`)
        return { content: null, error: `HTTP ${status}` }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (content && content.trim().length > 0) {
        console.log(`[Sanoovia AI] ✅ ${model} — réponse reçue (${content.length} chars)`)
        return { content: content.trim(), error: null }
      }

      if (attempt < MAX_RETRIES) {
        console.warn(`[Sanoovia AI] ${model} — réponse vide, retry...`)
        await sleep(RETRY_DELAY_MS)
        continue
      }

      return { content: null, error: 'Réponse vide' }

    } catch (err: any) {
      clearTimeout(timeoutId)

      if (err?.name === 'AbortError') {
        console.warn(`[Sanoovia AI] ${model} — timeout (${TIMEOUT_MS}ms)`)
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS)
          continue
        }
        return { content: null, error: 'Timeout' }
      }

      console.warn(`[Sanoovia AI] ${model} — erreur réseau: ${err?.message}`)
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS)
        continue
      }
      return { content: null, error: err?.message || 'Erreur réseau' }
    }
  }

  return { content: null, error: 'Max retries atteint' }
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

export async function chatWithAI(
  userMessage: string,
  language: string = 'fr',
  category: string = 'general',
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim()

  if (!apiKey || apiKey.length < 10) {
    console.error('[Sanoovia AI] ❌ OPENROUTER_API_KEY non configurée')
    return getErrorMessage(language, 'noApiKey')
  }

  const systemPrompt = getSystemPrompt(language, category)
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-20).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ]

  const customModel = process.env.OPENROUTER_MODEL?.trim()
  const modelsToTry = [
    ...(customModel && customModel.length > 0 ? [customModel] : []),
    ...FALLBACK_MODELS
  ]
  const uniqueModels = [...new Set(modelsToTry)]

  console.log(`[Sanoovia AI] 🚀 ${uniqueModels.length} modèle(s), langue: ${language}, catégorie: ${category}`)

  const errors: string[] = []

  for (const model of uniqueModels) {
    const result = await callModel(apiKey, model, messages)

    if (result.content) return result.content

    errors.push(`${model}: ${result.error}`)

    if (result.error === 'CLÉ_API_INVALIDE') {
      console.error('[Sanoovia AI] ❌ CLÉ API INVALIDE')
      return getErrorMessage(language, 'invalidKey')
    }
  }

  console.error(`[Sanoovia AI] ❌ TOUS ÉCHOUÉS:\n${errors.join('\n')}`)
  return getErrorMessage(language, 'allFailed')
}