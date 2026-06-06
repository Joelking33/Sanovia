// lib/feedback-validator.ts
// Validation automatique des corrections par l'IA avec recherche web
// L'IA cherche sur internet pour vérifier si la correction est médicalement correcte

export interface ValidationResult {
  valid:      boolean
  confidence: number        // 0-100
  reason:     string        // Explication de la décision
  sources:    string[]      // Sources trouvées sur internet
  status:     'approved' | 'rejected' | 'uncertain'
}

/**
 * Valide une correction médicale en utilisant l'IA + recherche web.
 * L'IA cherche des sources fiables pour vérifier l'information.
 */
export async function validateMedicalCorrection(
  question:         string,
  originalResponse: string,
  correction:       string,
  language:         string,
): Promise<ValidationResult> {

  const orKey = (process.env.OPENROUTER_API_KEY ?? '').trim()
  if (!orKey) {
    console.warn('[VALIDATOR] Pas de clé OpenRouter — validation ignorée')
    return {
      valid:      true,
      confidence: 50,
      reason:     'Validation ignorée (clé API manquante)',
      sources:    [],
      status:     'uncertain',
    }
  }

  const prompt = `Tu es un expert médical chargé de vérifier une correction proposée pour un assistant santé en Côte d'Ivoire.

QUESTION POSÉE :
"${question}"

RÉPONSE ORIGINALE DE L'IA :
"${originalResponse}"

CORRECTION PROPOSÉE PAR L'UTILISATEUR :
"${correction}"

Ta mission :
1. Fais une recherche web pour vérifier si la correction est médicalement correcte
2. Vérifie que la correction ne contient pas d'informations dangereuses ou fausses
3. Vérifie que le contenu est approprié pour un assistant santé

Critères de REJET automatique :
- Informations médicales dangereuses ou non-vérifiables
- Médicaments sans dosage validé
- Conseils qui remplacent un médecin pour des cas urgents
- Contenu hors sujet santé
- Contenu offensant ou trompeur

Réponds UNIQUEMENT avec ce JSON (sans texte avant ou après) :
{
  "valid": true ou false,
  "confidence": 0 à 100,
  "reason": "explication courte en français",
  "sources": ["url ou nom de source 1", "url ou nom de source 2"],
  "status": "approved" ou "rejected" ou "uncertain"
}`

  try {
    const controller = new AbortController()
    const timeout    = setTimeout(() => controller.abort(), 30000)

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${orKey}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  process.env.APP_URL ?? 'https://sanovia.vercel.app',
        'X-Title':       'Sanovia Feedback Validator',
      },
      body: JSON.stringify({
        model:       'openrouter/free',
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  600,
        temperature: 0,
        plugins: [{ id: 'web', max_results: 3 }],  // Recherche web OpenRouter
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('[VALIDATOR] OpenRouter error:', res.status)
      return defaultUncertain('Erreur lors de la validation — correction mise en attente')
    }

    const data    = await res.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    // Parser le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[VALIDATOR] Réponse non-JSON:', content.slice(0, 200))
      return defaultUncertain('Format de validation invalide')
    }

    const result = JSON.parse(jsonMatch[0]) as ValidationResult

    // Sécurité : si confidence < 60 → uncertain même si "valid: true"
    if (result.confidence < 60) {
      result.status = 'uncertain'
      result.valid  = false
      result.reason = `Confiance insuffisante (${result.confidence}%) : ${result.reason}`
    }

    console.log(`[VALIDATOR] ${result.status.toUpperCase()} (${result.confidence}%) — ${result.reason}`)
    return result

  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return defaultUncertain('Délai de validation dépassé')
    }
    console.error('[VALIDATOR] Erreur:', err)
    return defaultUncertain('Erreur inattendue lors de la validation')
  }
}

function defaultUncertain(reason: string): ValidationResult {
  return {
    valid:      false,
    confidence: 0,
    reason,
    sources:    [],
    status:     'uncertain',
  }
}