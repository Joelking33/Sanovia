import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, notFound, error, forbidden, badRequest } from '@/lib/middleware'

/**
 * GET /api/conversations/[id]
 * Récupérer les détails d'une conversation avec ses messages
 *
 * Headers: Authorization: Bearer <token>
 * Params: id — ID de la conversation
 *
 * Query params:
 * - page (number, optionnel, défaut: 1)
 * - limit (number, optionnel, défaut: 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const { id } = await params

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            language: true,
            createdAt: true
          }
        }
      }
    })

    if (!conversation) {
      return notFound('Conversation non trouvée.')
    }

    if (conversation.userId !== auth.userId) {
      return forbidden('Vous n\'avez pas accès à cette conversation.')
    }

    return success({
      id: conversation.id,
      title: conversation.title,
      category: conversation.category,
      language: conversation.language,
      isArchived: conversation.isArchived,
      messages: conversation.messages,
      messageCount: conversation.messages.length,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    })

  } catch (err: any) {
    console.error('[Conversation GET Error]', err)
    return error('Erreur lors de la récupération de la conversation.')
  }
}

/**
 * PATCH /api/conversations/[id]
 * Mettre à jour une conversation (titre, archivage)
 *
 * Headers: Authorization: Bearer <token>
 * Params: id — ID de la conversation
 * Body:
 * - title (string, optionnel)
 * - isArchived (boolean, optionnel)
 * - category (string, optionnel)
 * - language (string, optionnel)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { title, isArchived, category, language } = body

    // Vérifier l'appartenance
    const existingConversation = await db.conversation.findUnique({
      where: { id }
    })

    if (!existingConversation) return notFound('Conversation non trouvée.')
    if (existingConversation.userId !== auth.userId) return forbidden('Accès interdit.')

    // Construire les données de mise à jour
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (isArchived !== undefined) updateData.isArchived = isArchived
    if (category !== undefined) updateData.category = category
    if (language !== undefined) updateData.language = language

    if (Object.keys(updateData).length === 0) {
      return badRequest('Aucune donnée à mettre à jour.')
    }

    const conversation = await db.conversation.update({
      where: { id },
      data: updateData
    })

    return success(conversation)
  } catch (err: any) {
    console.error('[Conversation PATCH Error]', err)
    return error('Erreur lors de la mise à jour de la conversation.')
  }
}

/**
 * DELETE /api/conversations/[id]
 * Supprimer une conversation et tous ses messages
 *
 * Headers: Authorization: Bearer <token>
 * Params: id — ID de la conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const { id } = await params

    // Vérifier l'appartenance
    const conversation = await db.conversation.findUnique({
      where: { id }
    })

    if (!conversation) return notFound('Conversation non trouvée.')
    if (conversation.userId !== auth.userId) return forbidden('Accès interdit.')

    // Supprimer la conversation (cascade supprimera les messages)
    await db.conversation.delete({ where: { id } })

    return success({ message: 'Conversation supprimée avec succès.' })
  } catch (err: any) {
    console.error('[Conversation DELETE Error]', err)
    return error('Erreur lors de la suppression de la conversation.')
  }
}
