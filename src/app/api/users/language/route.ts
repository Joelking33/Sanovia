import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, badRequest, error, isValidLanguage, LANGUAGE_NAMES } from '@/lib/middleware'

/**
 * GET /api/users/language
 * Récupérer la langue préférée de l'utilisateur
 *
 * Headers: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { language: true }
    })

    if (!user) {
      return badRequest('Utilisateur non trouvé.')
    }

    return success({
      language: user.language,
      languageName: LANGUAGE_NAMES[user.language] || 'Français',
      availableLanguages: [
        { code: 'fr', name: 'Français' },
        { code: 'ba', name: 'Baoulé' },
        { code: 'dy', name: 'Dioula' },
        { code: 'bq', name: 'Bété' }
      ]
    })
  } catch (err: any) {
    console.error('[Language GET Error]', err)
    return error('Erreur lors de la récupération de la langue.')
  }
}

/**
 * PATCH /api/users/language
 * Modifier la langue préférée de l'utilisateur
 *
 * Headers: Authorization: Bearer <token>
 * Body:
 * - language (string, requis) — "fr", "ba", "dy", ou "bq"
 */
export async function PATCH(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { language } = body

    if (!language) {
      return badRequest('Le champ "language" est requis.')
    }

    if (!isValidLanguage(language)) {
      return badRequest('Langue non supportée. Langues disponibles : fr (Français), ba (Baoulé), dy (Dioula), bq (Bété).')
    }

    const user = await db.user.update({
      where: { id: auth.userId },
      data: { language },
      select: {
        id: true,
        name: true,
        language: true
      }
    })

    return success({
      ...user,
      languageName: LANGUAGE_NAMES[language] || 'Français'
    })
  } catch (err: any) {
    console.error('[Language PATCH Error]', err)
    return error('Erreur lors de la modification de la langue.')
  }
}
