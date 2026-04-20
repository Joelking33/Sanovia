import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, notFound, error, badRequest } from '@/lib/middleware'

/**
 * GET /api/users/profile
 * Récupérer le profil de l'utilisateur connecté
 *
 * Headers: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        language: true,
        authProvider: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    })

    if (!user) return notFound('Utilisateur non trouvé.')

    return success(user)
  } catch (err: any) {
    console.error('[Profile GET Error]', err)
    return error('Erreur lors de la récupération du profil.')
  }
}

/**
 * PATCH /api/users/profile
 * Mettre à jour le profil de l'utilisateur connecté
 *
 * Headers: Authorization: Bearer <token>
 * Body:
 * - name (string, optionnel)
 * - phone (string, optionnel)
 * - avatarUrl (string, optionnel)
 */
export async function PATCH(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { name, phone, avatarUrl } = body

    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData: Record<string, any> = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return badRequest('Le nom doit contenir au moins 2 caractères.')
      }
      updateData.name = name.trim()
    }
    if (phone !== undefined) {
      updateData.phone = phone || null
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl || null
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest('Aucune donnée à mettre à jour.')
    }

    const user = await db.user.update({
      where: { id: auth.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        language: true,
        authProvider: true,
        role: true,
        updatedAt: true
      }
    })

    return success(user)
  } catch (err: any) {
    console.error('[Profile PATCH Error]', err)
    return error('Erreur lors de la mise à jour du profil.')
  }
}
