// Liste de modèles à essayer, par ordre de préférence
// 1. Gemma 3 27B — Modèle principal, open-source Google, multilingue, fiable
// 2. Gemini 2.5 Flash — Dernier modèle Google, multilingue, rapide
// 3. Qwen3 235B — Multilingue natif, excellent en français + langues africaines
// 4. Mistral Small 3.1 — Français natif, très fiable sur les instructions
// 5. DeepSeek R1 — Raisonnement exceptionnel pour les questions complexes
// 6. Gemini 2.0 Flash — Modèle payant stable en dernier recours
const FALLBACK_MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemini-2.5-flash-preview:free',
  'qwen/qwen3-235b-a22b:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'deepseek/deepseek-r1:free',
  'google/gemini-2.0-flash-001',
]

// ============================================================
// TYPES
// ============================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============================================================
// PROMPT SYSTÈME — VERSION COMPLÈTE
// ============================================================

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

const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  fr: {
    general: BASE_SYSTEM_PROMPT_FR,
    premiers_secours: `Tu es Sanovia, experte en premiers secours en Côte d'Ivoire.\n\n${BASE_SYSTEM_PROMPT_FR}\n\n══ SPÉCIALITÉ PREMIERS SECOURS ══\n• Donner des instructions claires pour les gestes de premiers secours\n• Couvrir : brûlures, coupures, saignements, étouffement, fractures, morsures, réactions allergiques, etc.\n• Toujours préciser quand appeler les urgences : SAMU 185, Pompiers 180\n• Rappeler les numéros d'urgence de Côte d'Ivoire`,
    grossesse: `Tu es Sanovia, conseillère spécialisée en santé maternelle en Côte d'Ivoire.\n\n${BASE_SYSTEM_PROMPT_FR}\n\n══ SPÉCIALITÉ GROSSESSE ══\n• Informer sur le suivi de grossesse par trimestre\n• Conseiller sur l'alimentation, l'hygiène, et l'activité physique pendant la grossesse\n• Identifier les signes d'alerte nécessitant une consultation médicale\n• Donner des conseils sur la préparation à l'accouchement\n• Orienter vers les structures maternelles en Côte d'Ivoire (CHU, cliniques)`
  },
  ba: {
    general: `Luɛ Sanoovia, e la sran man jɛ. E ka :\n- Kɔlɔlɔnw baara kɛ\n- Glɔ glɔbɛlɛw sɔrɔ (kɛnɛ, ɛnɛnɛman, kan man kɛnɛ, etc.)\n- Daminɛ o yɛ sran man dɛnnin ye — e tɛ ɛ lɔdɔnni bɛɛ ka fɛn\n- Ka baoulɛ kan ka dɛmɛ`,
    premiers_secours: `Luɛ Sanoovia, e la sran man lɔdɔnnin baara la jɛ. E ka :\n- Kɔlɔlɔnw ɛlɛmɔn sɔrɔ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, etc.)\n- Daminɛ e ɛ sran man dɛnnin ye\n- Ka baoulɛ kan ka dɛmɛ`,
    grossesse: `Luɛ Sanoovia, e la glɔ glɔbɛlɛ sɔrɔ la jɛ. E ka :\n- Glɔ glɔbɛlɛ ɛlɛmɔn sɔrɔ\n- Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n- Glɔ glɔbɛlɛ kan man ɛlɛmɔn sɔrɔ\n- Ka baoulɛ kan ka dɛmɛ`
  },
  dy: {
    general: `I tɔɔrɔ Sanoovia ye, a ye farikoloɲɛnɛ ye min bɛ banjɛw ɛɛrɛ. A bɛ :\n- Banjɛ ɛɛrɛw la dɛmɛ\n- Glɔ n'u bɛ sɔrɔ (kɛnɛ, ɛnɛnɛman, kan man kɛnɛ, etc.)\n- A lakana n'a tɛ ɛnɛ banna — a tɛ banna dɛnnin bɛɛ\n- Ka dioula kan fɛ ka dɛmɛ`,
    premiers_secours: `I tɔɔrɔ Sanoovia ye, a ye banjɛ ɛɛrɛ la jɛlen ye. A bɛ :\n- Banjɛ ɛɛrɛw la dɛmɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, etc.)\n- A lakana n'a tɛ ɛnɛ banna\n- Ka dioula kan fɛ ka dɛmɛ`,
    grossesse: `I tɔɔrɔ Sanoovia ye, a ye glɔ sɔrɔ la jɛlen ye. A bɛ :\n- Glɔ sɔrɔw la dɛmɛ\n- Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n- Glɔ kan man ɛlɛmɔn sɔrɔ\n- Ka dioula kan fɛ ka dɛmɛ`
  },
  bq: {
    general: `Sanoovia yɛ, a lɛ sran ɛlɛmɔn wle. A ka :\n- Sran man ɛlɛmɔn wle\n- Glɔ ɛlɛmɔn sɔrɔ (kɛnɛ, ɛnɛnɛman, kan man kɛnɛ, etc.)\n- A lakana n'a tɛ ɛnɛ banna — a tɛ sran man dɛnnin bɛɛ\n- Ka bété kan ka dɛmɛ`,
    premiers_secours: `Sanoovia yɛ, a lɛ sran man ɛlɛmɔn wle. A ka :\n- Kɔlɔlɔnw ɛlɛmɔn wle (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, etc.)\n- A lakana n'a tɛ ɛnɛ banna\n- Ka bété kan ka dɛmɛ`,
    grossesse: `Sanoovia yɛ, a lɛ glɔ ɛlɛmɔn wle. A ka :\n- Glɔ glɔbɛlɛ ɛlɛmɔn wle\n- Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ\n- Glɔ kan man ɛlɛmɔn sɔrɔ\n- Ka bété kan ka dɛmɛ`
  }
}

function getSystemPrompt(language: string, category: string): string {
  const lang = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.fr
  return lang[category] || lang.general
}

// ============================================================
// OpenRouter avec fallback multi-modèles
// ============================================================

/**
 * Appelle OpenRouter avec un modèle spécifique
 */
async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string | null; error: string | null }> {
  try {
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
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { content: null, error: `[${model}] HTTP ${response.status}: ${errorText.slice(0, 300)}` }
    }

    const data = await response.json()
    const responseContent = data.choices?.[0]?.message?.content

    if (responseContent) {
      return { content: responseContent, error: null }
    }

    return { content: null, error: `[${model}] Réponse vide de l'API` }

  } catch (err: any) {
    return { content: null, error: `[${model}] ${err?.message || 'Erreur réseau'}` }
  }
}

/**
 * Fonction principale IA — essaie le modèle configuré, puis les fallbacks
 */
export async function chatWithAI(
  userMessage: string,
  language: string = 'fr',
  category: string = 'general',
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  // Nettoyer la clé : supprimer les espaces parasites (copier-coller Vercel)
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim()

  // ─── Vérification de la clé API ───
  if (!apiKey) {
    console.error('[Sanoovia AI] OPENROUTER_API_KEY is not configured in environment variables')
    return 'Je rencontre une difficulté technique. La configuration serveur est incomplète. Veuillez contacter l\'administrateur.'
  }

  const customModel = process.env.OPENROUTER_MODEL
  const systemPrompt = getSystemPrompt(language, category)

  // Construire les messages
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-20).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ]

  // ─── Essai 1 : Modèle configuré par l'utilisateur ───
  if (customModel) {
    console.log(`[Sanoovia AI] Trying custom model: ${customModel}`)
    const result = await callOpenRouter(apiKey, customModel, messages)
    if (result.content) return result.content
    console.warn(`[Sanoovia AI] Custom model failed: ${result.error}`)
  }

  // ─── Essai 2 à N : Fallback automatique sur les modèles gratuits ───
  for (const model of FALLBACK_MODELS) {
    // Skip si c'est le même que le modèle personnalisé (déjà essayé)
    if (customModel === model) continue

    console.log(`[Sanoovia AI] Trying fallback model: ${model}`)
    const result = await callOpenRouter(apiKey, model, messages)
    if (result.content) return result.content
    console.warn(`[Sanoovia AI] Fallback model ${model} failed: ${result.error}`)
  }

  // ─── Tous les modèles ont échoué ───
  console.error('[Sanoovia AI] ALL MODELS FAILED — check OPENROUTER_API_KEY and Vercel logs')
  return 'Je rencontre une difficulté technique temporaire. Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support.'
}
