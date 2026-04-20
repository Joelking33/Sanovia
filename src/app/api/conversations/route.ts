import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, created, error, isValidCategory, isValidLanguage } from '@/lib/middleware'

/**
 * GET /api/conversations
 * Liste les conversations de l'utilisateur connecté
 *
 * Query params:
 * - page (number, optionnel, défaut: 1)
 * - limit (number, optionnel, défaut: 20)
 * - category (string, optionnel) — filtre par catégorie
 * - archived (boolean, optionnel) — inclure les archivées
 *
 * Headers: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const category = searchParams.get('category')
    const includeArchived = searchParams.get('archived') === 'true'
    const language = searchParams.get('language')

    // Construire les filtres
    const where: Record<string, any> = {
      userId: auth.userId,
      isArchived: includeArchived ? undefined : false
    }

    if (category && isValidCategory(category)) {
      where.category = category
    }

    if (language && isValidLanguage(language)) {
      where.language = language
    }

    // Compter le total
    const total = await db.conversation.count({ where })

    // Récupérer les conversations avec le dernier message
    const conversations = await db.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            role: true
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    })

    return success({
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        category: conv.category,
        language: conv.language,
        isArchived: conv.isArchived,
        messageCount: conv._count.messages,
        lastMessage: conv.messages[0] || null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (err: any) {
    console.error('[Conversations GET Error]', err)
    return error('Erreur lors de la récupération des conversations.')
  }
}

/**
 * POST /api/conversations
 * Créer une nouvelle conversation
 *
 * Body:
 * - title (string, optionnel, défaut: "Nouvelle conversation")
 * - category (string, optionnel, défaut: "general") — "general", "premiers_secours", "grossesse"
 * - language (string, optionnel, défaut: langue de l'utilisateur)
 *
 * Headers: Authorization: Bearer <token>
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { title, category, language } = body

    // Récupérer la langue de l'utilisateur par défaut
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { language: true }
    })

    const selectedCategory = category && isValidCategory(category) ? category : 'general'
    const selectedLanguage = language && isValidLanguage(language) ? language : (user?.language || 'fr')

    const conversation = await db.conversation.create({
      data: {
        userId: auth.userId,
        title: title || 'Nouvelle conversation',
        category: selectedCategory,
        language: selectedLanguage
      },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })

    return created({
      id: conversation.id,
      title: conversation.title,
      category: conversation.category,
      language: conversation.language,
      messageCount: 0,
      createdAt: conversation.createdAt
    })

  } catch (err: any) {
    console.error('[Conversations POST Error]', err)
    return error('Erreur lors de la création de la conversation.')
  }
}
