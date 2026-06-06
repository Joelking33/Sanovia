// app/api/autocomplete/route.ts
// Autocomplétion intelligente : suggestions statiques + IA

import { NextRequest } from 'next/server'

// ─── Suggestions statiques par langue ────────────────────────────────────────
const STATIC_SUGGESTIONS: Record<string, string[]> = {
  fr: [
    'Quels sont les symptômes du paludisme ?',
    'Comment traiter la fièvre chez un enfant ?',
    'Quels sont les signes de la typhoïde ?',
    'Comment prévenir le paludisme ?',
    'J\'ai mal à la tête depuis 3 jours',
    'J\'ai de la fièvre et des frissons',
    'Comment savoir si je suis enceinte ?',
    'Quels aliments éviter pendant la grossesse ?',
    'Comment traiter la diarrhée ?',
    'J\'ai mal au ventre depuis ce matin',
    'Quels sont les symptômes de la méningite ?',
    'Comment faire baisser la tension artérielle ?',
    'Que faire en cas de brûlure ?',
    'Quels sont les signes d\'un AVC ?',
    'J\'ai une douleur dans la poitrine',
    'Comment traiter une plaie ?',
    'Quels vaccins sont obligatoires en Côte d\'Ivoire ?',
    'Comment prévenir le choléra ?',
    'J\'ai des vomissements depuis hier',
    'Comment reconnaître une déshydratation ?',
    'Quand faut-il consulter un médecin d\'urgence ?',
    'J\'ai une toux persistante',
    'Comment traiter le diabète ?',
    'Quels sont les symptômes de l\'hypertension ?',
    'Comment allaiter correctement mon bébé ?',
  ],
  ba: [
    'Ô wounin do — comment traiter ?',
    'A lê djaikouhadjo — que faire ?',
    'A ti yo ô ya depuis hier',
    'Ô kloun yo ô ya — que faire ?',
    'A bo tangô — comment soulager ?',
    'A ti kouè fouè — conseils grossesse',
    'A lê djaikouhadjo kéklé — typhoïde',
    'A fi depuis ce matin — vomissements',
    'Non ô aré — quel médicament ?',
    'Kô nian dôhôtrô sran — quand y aller ?',
  ],
  dy: [
    'I fari gbanna — comment traiter ?',
    'Soumaya bi là — que faire ?',
    'I coukolo bi diminan — mal de tête',
    'I konnon bi diminan — mal au ventre',
    'Sorgorsorgor bi là — toux persistante',
    'I kônonman lé — conseils grossesse',
    'I menkainai — quels signes ?',
    'I sèguaila — fatigue intense',
    'I ya fla ta — quel médicament ?',
    'Ta dortoror tchai fai — quand consulter ?',
  ],
  bq: [
    'J\'ai de la fièvre en Bété — que faire ?',
    'Symptômes paludisme Bété',
    'Mal au ventre — conseils',
    'Grossesse — quoi faire ?',
    'Médicament fièvre enfant',
  ],
}

/**
 * Filtre les suggestions statiques selon l'input
 */
function filterStatic(input: string, language: string): string[] {
  const q    = input.toLowerCase().trim()
  const list = STATIC_SUGGESTIONS[language] ?? STATIC_SUGGESTIONS.fr
  return list
    .filter(s => s.toLowerCase().includes(q))
    .slice(0, 5)
}

/**
 * Génère des complétions IA pour les inputs plus longs
 */
async function getAICompletions(
  input:    string,
  language: string,
): Promise<string[]> {
  const orKey = (process.env.OPENROUTER_API_KEY ?? '').trim()
  if (!orKey || input.length < 8) return []

  const langLabel: Record<string, string> = {
    fr: 'français',
    ba: 'baoulé phonétique',
    dy: 'dioula phonétique',
    bq: 'bété',
  }

  const prompt = `Tu es un assistant santé pour la Côte d'Ivoire.
L'utilisateur commence à taper cette question en ${langLabel[language] ?? 'français'} :
"${input}"

Complète cette phrase en 5 questions différentes et naturelles sur la santé.
Retourne UNIQUEMENT un tableau JSON de 5 strings, sans texte avant ou après.
Exemple : ["question 1", "question 2", "question 3", "question 4", "question 5"]`

  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${orKey}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  process.env.APP_URL ?? 'https://sanovia.vercel.app',
      },
      body: JSON.stringify({
        model:       'openrouter/free',
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  200,
        temperature: 0.4,
      }),
      signal: controller.signal,
    })

    if (!res.ok) return []

    const data    = await res.json()
    const content = (data.choices?.[0]?.message?.content ?? '').trim()
    const match   = content.match(/\[[\s\S]*?\]/)
    if (!match) return []

    const suggestions = JSON.parse(match[0]) as string[]
    return Array.isArray(suggestions)
      ? suggestions.filter(s => typeof s === 'string').slice(0, 5)
      : []

  } catch {
    return []
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { input = '', language = 'fr' } = await request.json()

    const q = input.trim()
    if (!q || q.length < 2) {
      return Response.json({ suggestions: [] })
    }

    // Suggestions statiques (instantanées)
    const staticMatches = filterStatic(q, language)

    // Si on a déjà 5 statiques → pas besoin d'appeler l'IA
    if (staticMatches.length >= 5) {
      return Response.json({ suggestions: staticMatches, source: 'static' })
    }

    // Compléments IA pour les requêtes plus longues (≥ 8 chars)
    let aiSuggestions: string[] = []
    if (q.length >= 8) {
      aiSuggestions = await getAICompletions(q, language)
    }

    // Fusionner : statiques d'abord, IA ensuite, sans doublons
    const merged = [
      ...staticMatches,
      ...aiSuggestions.filter(
        ai => !staticMatches.some(
          st => st.toLowerCase() === ai.toLowerCase()
        )
      ),
    ].slice(0, 6)

    return Response.json({
      suggestions: merged,
      source: merged.length > staticMatches.length ? 'hybrid' : 'static',
    })

  } catch (err) {
    console.error('[Autocomplete]', err)
    return Response.json({ suggestions: [] })
  }
}