import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, unauthorized, notFound } from '@/lib/middleware'

/**
 * GET /api/auth/me
 * Récupérer les informations de l'utilisateur connecté
 *
 * Headers:
 * - Authorization: Bearer <token>
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { conversations: true }
        }
      }
    })

    if (!user) {
      return notFound('Utilisateur non trouvé.')
    }

    return success({
      ...user,
      conversationCount: user._count.conversations
    })

  } catch (err: any) {
    console.error('[Get Me Error]', err)
    return unauthorized('Impossible de récupérer vos informations.')
  }
}
