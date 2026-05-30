import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, created, badRequest, notFound, forbidden, error, safeJsonStringify } from '@/lib/middleware'
import { chatWithAI, AIError } from '@/lib/ai'

// ═══════════════════════════════════════════════════════════
// Utilitaire : conversion sécurisée Date → string ISO
// Prévient l'erreur "toISOString is not a function"
// ═══════════════════════════════════════════════════════════
function toISO(val: unknown): string {
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'string' && val.length > 0) return val
  return new Date().toISOString()
}

/**
 * GET /api/conversations/[id]/messages
 * Récupérer l'historique des messages d'une conversation
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

    const conversation = await db.conversation.findUnique({ where: { id } })
    if (!conversation) return notFound('Conversation non trouvée.')
    if (conversation.userId !== auth.userId) return forbidden('Accès interdit.')

    const total = await db.message.count({ where: { conversationId: id } })
    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    })

    return success({ messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err: any) {
    console.error('[Messages GET Error]', err)
    return error('Erreur lors de la récupération des messages.')
  }
}

/**
 * POST /api/conversations/[id]/messages
 * Envoyer un message et obtenir une réponse de Sanoovia IA
 *
 * En cas de succès : retourne { success: true, data: { userMessage, assistantMessage, serverMeta } }
 * En cas d'échec : retourne { success: false, error: "...", details: { code, errors, rawErrors, ... } }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  const routeStart = Date.now()

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

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 15,
          select: { role: true, content: true }
        }
      }
    })

    if (!conversation) return notFound('Conversation non trouvée.')
    if (conversation.userId !== auth.userId) return forbidden('Accès interdit.')

    // Sauvegarder le message utilisateur
    const userMessage = await db.message.create({
      data: {
        conversationId: id,
        role: 'user',
        content: content.trim(),
        language: conversation.language
      }
    })
    console.log(`[Route] Message utilisateur sauvegardé: id=${userMessage.id}, createdAt type=${typeof userMessage.createdAt}, isDate=${userMessage.createdAt instanceof Date}`)

    // Générer la réponse IA
    const aiResponse = await chatWithAI(
      content.trim(),
      conversation.language,
      conversation.category,
      conversation.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    )

    const meta = aiResponse.metadata
    console.log(`[Route] ✅ SUCCÈS — source: ${meta.source}, modèle: ${meta.model}, durée: ${meta.duration}ms`)

    // Sauvegarder la réponse IA
    const assistantMessage = await db.message.create({
      data: {
        conversationId: id,
        role: 'assistant',
        content: aiResponse.content,
        language: conversation.language
      }
    })
    console.log(`[Route] Message assistant sauvegardé: id=${assistantMessage.id}, createdAt type=${typeof assistantMessage.createdAt}, isDate=${assistantMessage.createdAt instanceof Date}`)

    // Mettre à jour le titre si premier message
    if (conversation.messages.length === 0) {
      const title = content.trim().substring(0, 60) + (content.length > 60 ? '...' : '')
      await db.conversation.update({ where: { id }, data: { title } })
    }

    // Ne PAS mettre à jour updatedAt manuellement — Prisma le fait via @updatedAt

    // Sérialisation défensive : convertir TOUS les Date en string ISO
    const responseData = {
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        language: userMessage.language,
        createdAt: toISO(userMessage.createdAt)
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        language: assistantMessage.language,
        createdAt: toISO(assistantMessage.createdAt)
      },
      serverMeta: {
        source: meta.source,
        provider: meta.provider,
        model: meta.model,
        duration: meta.duration,
        cached: meta.cached,
        hasApiKey: meta.hasApiKey,
        errors: meta.errors,
        rawErrors: meta.rawErrors,
        timestamp: meta.timestamp,
      }
    }

    return created(responseData)

  } catch (err: any) {
    const routeDuration = Date.now() - routeStart

    if (err instanceof AIError) {
      console.error(`[Route] ❌ AIError — code: ${err.code}, modèle: ${err.model}, durée: ${err.duration}ms`)
      console.error(`[Route]   Erreurs: ${err.errors.join(' | ')}`)

      // Sérialisation sécurisée pour éviter l'erreur .toISOString()
      const errorBody = safeJsonStringify({
        success: false,
        error: err.message,
        details: {
          code: err.code,
          provider: err.provider,
          model: err.model,
          duration: err.duration,
          routeDuration,
          hasApiKey: err.hasApiKey,
          errors: err.errors,
          rawErrors: err.rawErrors,
          timestamp: err.timestamp,
        }
      })
      return new NextResponse(errorBody, {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Erreur générique (timeout, réseau, DB, etc.)
    const msg = err?.message || 'Erreur inconnue'
    const stack = err?.stack || ''
    console.error(`[Route] ❌ Erreur générique: ${msg}`)
    console.error(`[Route]   Stack: ${stack.slice(0, 800)}`)
    console.error(`[Route]   Type d'erreur: ${err?.constructor?.name || 'unknown'}`)
    console.error(`[Route]   Err complet:`, JSON.stringify({ name: err?.name, message: err?.message, constructor: err?.constructor?.name }, null, 2))

    if (msg.includes('timeout') || msg.includes('Abort') || msg.includes('ETIMEDOUT')) {
      return error('Délai dépassé : la réponse a mis trop de temps. Réessayez.', 504)
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONNREFUSED')) {
      return error('Erreur réseau : impossible de joindre le service IA. Vérifiez votre connexion.', 503)
    }
    return error(`Erreur interne du serveur : ${msg}`)
  }
}
