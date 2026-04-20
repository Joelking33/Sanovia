import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, created, badRequest, notFound, forbidden, error } from '@/lib/middleware'
import { chatWithAI } from '@/lib/ai'

/**
 * GET /api/conversations/[id]/messages
 * Récupérer l'historique des messages d'une conversation
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
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await db.conversation.findUnique({
      where: { id }
    })

    if (!conversation) return notFound('Conversation non trouvée.')
    if (conversation.userId !== auth.userId) return forbidden('Accès interdit.')

    const total = await db.message.count({
      where: { conversationId: id }
    })

    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    })

    return success({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (err: any) {
    console.error('[Messages GET Error]', err)
    return error('Erreur lors de la récupération des messages.')
  }
}

/**
 * POST /api/conversations/[id]/messages
 * Envoyer un message et obtenir une réponse de Sanoovia IA
 *
 * Headers: Authorization: Bearer <token>
 * Params: id — ID de la conversation
 * Body:
 * - content (string, requis) — Le message de l'utilisateur
 *
 * Retourne le message utilisateur sauvegardé + la réponse de l'IA
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return badRequest('Le contenu du message est requis.')
    }

    if (content.length > 5000) {
      return badRequest('Le message ne peut pas dépasser 5000 caractères.')
    }

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Récupérer les 10 derniers messages pour le contexte
          select: { role: true, content: true }
        }
      }
    })

    if (!conversation) return notFound('Conversation non trouvée.')
    if (conversation.userId !== auth.userId) return forbidden('Accès interdit.')

    // Sauvegarder le message de l'utilisateur
    const userMessage = await db.message.create({
      data: {
        conversationId: id,
        role: 'user',
        content: content.trim(),
        language: conversation.language
      }
    })

    // Générer la réponse de Sanoovia IA
    const aiResponse = await chatWithAI(
      content.trim(),
      conversation.language,
      conversation.category,
      conversation.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    )

    // Sauvegarder la réponse de l'IA
    const assistantMessage = await db.message.create({
      data: {
        conversationId: id,
        role: 'assistant',
        content: aiResponse,
        language: conversation.language
      }
    })

    // Mettre à jour le titre de la conversation si c'est le premier message
    if (conversation.messages.length === 0) {
      const title = content.trim().substring(0, 60) + (content.length > 60 ? '...' : '')
      await db.conversation.update({
        where: { id },
        data: { title }
      })
    }

    // Mettre à jour la date de modification
    await db.conversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    })

    return created({
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        language: userMessage.language,
        createdAt: userMessage.createdAt
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        language: assistantMessage.language,
        createdAt: assistantMessage.createdAt
      }
    })

  } catch (err: any) {
    console.error('[Messages POST Error]', err)
    return error('Erreur lors de l\'envoi du message.')
  }
}
