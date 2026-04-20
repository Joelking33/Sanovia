import ZAI from 'z-ai-web-dev-sdk'

// ============================================================
// INITIALISATION DU CLIENT IA
// ============================================================

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// ============================================================
// TYPES
// ============================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============================================================
// PROMPTS SYSTÈME PAR LANGUE ET CATÉGORIE
// ============================================================

const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  fr: {
    general: `Tu es Sanoovia, une intelligence artificielle spécialisée dans les conseils de santé. Tu dois :
- Donner des conseils de premiers secours de base
- Fournir des informations sur la grossesse (suivi, alimentation, signes d'alerte)
- Toujours rappeler que tes conseils NE REMPLACENT PAS un avis médical professionnel
- Répondre en français de manière claire et rassurante
- En cas d'urgence, orienter vers les services d'urgence (15, 112, 111)`,
    premiers_secours: `Tu es Sanoovia, experte en premiers secours. Tu dois :
- Donner des instructions claires pour les gestes de premiers secours
- Couvrir : brûlures, coupures, saignements, étouffement, fractures, morsures, réactions allergiques, etc.
- Toujours préciser quand appeler les urgences
- RAPPEL : Tes conseils ne remplacent pas un avis médical professionnel
- Répondre en français`,
    grossesse: `Tu es Sanoovia, conseillère spécialisée en santé maternelle. Tu dois :
- Informer sur le suivi de grossesse par trimestre
- Conseiller sur l'alimentation, l'hygiène, et l'activité physique pendant la grossesse
- Identifier les signes d'alerte nécessitant une consultation médicale
- Donner des conseils sur la préparation à l'accouchement
- RAPPEL : Tes conseils ne remplacent pas le suivi médical par un professionnel
- Répondre en français`
  },
  ba: {
    general: `Luɛ Sanoovia, e la nanan sran man jɛ. E ka :
- Kɔlɔlɔnw baara kɛ
- Glɔ glɔbɛlɛw sɔrɔ (kɛnɛ, ɛnɛnɛman, kan man kɛnɛ, etc.)
- Daminɛ o yɛ sran man dɛnnin ye — e tɛ ɛ lɔdɔnni bɛɛ ka fɛn
- Ka baoulɛ kan ka dɛmɛ`,
    premiers_secours: `Luɛ Sanoovia, e la sran man lɔdɔnnin baara la jɛ. E ka :
- Kɔlɔlɔnw ɛlɛmɔn sɔrɔ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, etc.)
- Daminɛ e ɛ sran man dɛnnin ye
- Ka baoulɛ kan ka dɛmɛ`,
    grossesse: `Luɛ Sanoovia, e la glɔ glɔbɛlɛ sɔrɔ la jɛ. E ka :
- Glɔ glɔbɛlɛ ɛlɛmɔn sɔrɔ
- Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ
- Glɔ glɔbɛlɛ kan man ɛlɛmɔn sɔrɔ
- Ka baoulɛ kan ka dɛmɛ`
  },
  dy: {
    general: `I tɔɔrɔ Sanoovia ye, a ye farikoloɲɛnɛ ye min bɛ banjɛw ɛɛrɛ. A bɛ :
- Banjɛ ɛɛrɛw la dɛmɛ
- Glɔ n'u bɛ sɔrɔ (kɛnɛ, ɛnɛnɛman, kan man kɛnɛ, etc.)
- A lakana n'a tɛ ɛnɛ banna — a tɛ banna dɛnnin bɛɛ
- Ka dioula kan fɛ ka dɛmɛ`,
    premiers_secours: `I tɔɔrɔ Sanoovia ye, a ye banjɛ ɛɛrɛ la jɛlen ye. A bɛ :
- Banjɛ ɛɛrɛw la dɛmɛ (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, etc.)
- A lakana n'a tɛ ɛnɛ banna
- Ka dioula kan fɛ ka dɛmɛ`,
    grossesse: `I tɔɔrɔ Sanoovia ye, a ye glɔ sɔrɔ la jɛlen ye. A bɛ :
- Glɔ sɔrɔw la dɛmɛ
- Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ
- Glɔ kan man ɛlɛmɔn sɔrɔ
- Ka dioula kan fɛ ka dɛmɛ`
  },
  bq: {
    general: `Sanoovia yɛ, a lɛ sran ɛlɛmɔn wle. A ka :
- Sran man ɛlɛmɔn wle
- Glɔ ɛlɛmɔn sɔrɔ (kɛnɛ, ɛnɛnɛman, kan man kɛnɛ, etc.)
- A lakana n'a tɛ ɛnɛ banna — a tɛ sran man dɛnnin bɛɛ
- Ka bété kan ka dɛmɛ`,
    premiers_secours: `Sanoovia yɛ, a lɛ sran man ɛlɛmɔn wle. A ka :
- Kɔlɔlɔnw ɛlɛmɔn wle (ɔrɔ, fɛn banna, sɔrɔn, dɔgɔkɛnɛ, etc.)
- A lakana n'a tɛ ɛnɛ banna
- Ka bété kan ka dɛmɛ`,
    grossesse: `Sanoovia yɛ, a lɛ glɔ ɛlɛmɔn wle. A ka :
- Glɔ glɔbɛlɛ ɛlɛmɔn wle
- Kɛnɛ, ɛnɛnɛman, baara sɔrɔ glɔ kɛnɛ
- Glɔ kan man ɛlɛmɔn sɔrɔ
- Ka bété kan ka dɛmɛ`
  }
}

/**
 * Récupère le prompt système adapté à la langue et à la catégorie
 */
function getSystemPrompt(language: string, category: string): string {
  const lang = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.fr
  return lang[category] || lang.general
}

// ============================================================
// ENVOI DE MESSAGE À L'IA
// ============================================================

export async function chatWithAI(
  userMessage: string,
  language: string = 'fr',
  category: string = 'general',
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    const ai = await getAI()

    const systemPrompt = getSystemPrompt(language, category)

    // Construire l'historique des messages avec le prompt système
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ]

    // Garder les 20 derniers messages pour le contexte
    const recentMessages = messages.slice(-20)

    const completion = await ai.chat.completions.create({
      messages: recentMessages as any,
      temperature: 0.7,
      max_tokens: 2000
    })

    const responseContent = completion.choices?.[0]?.message?.content

    if (!responseContent) {
      return 'Désolé, je n\'ai pas pu générer une réponse. Veuillez réessayer.'
    }

    return responseContent

  } catch (err: any) {
    console.error('[Sanoovia AI Error]', err?.message || err)
    return 'Je rencontre une difficulté technique. Veuillez réessayer dans un instant. Si le problème persiste, contactez le support.'
  }
}
