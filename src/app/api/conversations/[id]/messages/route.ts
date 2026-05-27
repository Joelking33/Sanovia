import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, success, created, badRequest, notFound, forbidden, error } from '@/lib/middleware'
import { chatWithAI, AIError } from '@/lib/ai'

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
 * Retourne le message utilisateur + la réponse IA + les métadonnées serveur brutes
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
          take: 10,
          select: { role: true, content: true }
        }
      }
    })

    if (!conversation) return notFound('Conversation non trouvée.')
    if (conversation.userId !== auth.userId) return forbidden('Accès interdit.')

    // ═══════════════════════════════════════════════════════════
    // LOG BRUT — Requête reçue
    // ═══════════════════════════════════════════════════════════
    console.log('\n' + '╔' + '═'.repeat(68) + '╗')
    console.log('║  [API ROUTE] POST /api/conversations/[id]/messages          ║')
    console.log('╠' + '═'.repeat(68) + '╣')
    console.log(`  📥 Message      : "${content.trim().slice(0, 80)}${content.length > 80 ? '...' : ''}"`)
    console.log(`  🆔 Conversation  : ${id}`)
    console.log(`  👤 Utilisateur   : ${auth.userId}`)
    console.log(`  🌐 Langue        : ${conversation.language}`)
    console.log(`  📂 Catégorie     : ${conversation.category}`)
    console.log(`  📜 Historique    : ${conversation.messages.length} message(s) de contexte`)

    // Sauvegarder le message de l'utilisateur
    const userMessage = await db.message.create({
      data: {
        conversationId: id,
        role: 'user',
        content: content.trim(),
        language: conversation.language
      }
    })
    console.log(`  💾 Message user  : sauvegardé (id: ${userMessage.id})`)

    // Générer la réponse de Sanoovia IA
    console.log('  🤖 Appel chatWithAI en cours...')
    const aiResponse = await chatWithAI(
      content.trim(),
      conversation.language,
      conversation.category,
      conversation.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    )

    // ═══════════════════════════════════════════════════════════
    // LOG BRUT — Réponse IA reçue avec succès
    // ═══════════════════════════════════════════════════════════
    const meta = aiResponse.metadata
    console.log('╠' + '═'.repeat(68) + '╣')
    console.log('║  [API ROUTE] RÉPONSE IA — SUCCÈS                             ║')
    console.log('╠' + '═'.repeat(68) + '╣')
    console.log(`  ✅ Statut        : SUCCÈS`)
    console.log(`  📤 Source        : ${meta.source}`)
    console.log(`  🤖 Fournisseur   : ${meta.provider}`)
    console.log(`  🧠 Modèle        : ${meta.model}`)
    console.log(`  ⏱️  Durée IA     : ${meta.duration}ms`)
    console.log(`  ⏱️  Durée route  : ${Date.now() - routeStart}ms`)
    console.log(`  📦 Taille réponse: ${aiResponse.content.length} caractères`)
    console.log(`  📄 Contenu (300 premiers chars) :`)
    console.log(`     "${aiResponse.content.slice(0, 300)}${aiResponse.content.length > 300 ? '...' : ''}"`)
    console.log(`  🔑 OR clé       : ${meta.openRouterKey ? '✅' : '❌'}`)
    console.log(`  🔑 Gemini clé    : ${meta.geminiKey ? '✅' : '❌'}`)
    if (meta.errors.length > 0) {
      console.log(`  ⚠️  Erreurs passées: [${meta.errors.join(', ')}]`)
    }
    console.log(`  🕐 Timestamp     : ${meta.timestamp}`)

    // Sauvegarder la réponse de l'IA
    const assistantMessage = await db.message.create({
      data: {
        conversationId: id,
        role: 'assistant',
        content: aiResponse.content,
        language: conversation.language
      }
    })
    console.log(`  💾 Message IA    : sauvegardé (id: ${assistantMessage.id})`)

    // Mettre à jour le titre si premier message
    if (conversation.messages.length === 0) {
      const title = content.trim().substring(0, 60) + (content.length > 60 ? '...' : '')
      await db.conversation.update({ where: { id }, data: { title } })
      console.log(`  📝 Titre mis à jour: "${title}"`)
    }

    await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } })

    console.log('╚' + '═'.repeat(68) + '╝\n')

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
      },
      // ─── Métadonnées brutes du serveur ───
      serverMeta: {
        source: meta.source,
        provider: meta.provider,
        model: meta.model,
        duration: meta.duration,
        cached: meta.cached,
        openRouterKey: meta.openRouterKey,
        geminiKey: meta.geminiKey,
        errors: meta.errors,
        timestamp: meta.timestamp,
      }
    })

  } catch (err: any) {
    // ═══════════════════════════════════════════════════════════
    // LOG BRUT — Erreur interceptée
    // ═══════════════════════════════════════════════════════════
    const routeDuration = Date.now() - routeStart

    console.log('╠' + '═'.repeat(68) + '╣')
    console.log('║  [API ROUTE] RÉPONSE IA — ÉCHEC                              ║')
    console.log('╠' + '═'.repeat(68) + '╣')
    console.log(`  ❌ Statut        : ÉCHEC`)
    console.log(`  ⏱️  Durée route  : ${routeDuration}ms`)
    console.log(`  🕐 Timestamp     : ${new Date().toISOString()}`)

    // Vérifier si c'est une AIError structurée
    if (err instanceof AIError) {
      console.log(`  💥 Type erreur    : AIError (structurée)`)
      console.log(`  🔑 Code          : ${err.code}`)
      console.log(`  🤖 Fournisseur   : ${err.provider}`)
      console.log(`  🧠 Modèle        : ${err.model}`)
      console.log(`  ⏱️  Durée IA     : ${err.duration}ms`)
      console.log(`  🔑 OR clé       : ${err.openRouterKey ? '✅' : '❌'}`)
      console.log(`  🔑 Gemini clé    : ${err.geminiKey ? '✅' : '❌'}`)
      console.log(`  📋 Erreurs       : [${err.errors.join(', ')}]`)
      console.log(`  📄 Message       : ${err.message}`)

      console.log('╚' + '═'.repeat(68) + '╝\n')

      return NextResponse.json({
        success: false,
        error: err.message,
        details: {
          code: err.code,
          provider: err.provider,
          model: err.model,
          duration: err.duration,
          openRouterKey: err.openRouterKey,
          geminiKey: err.geminiKey,
          errors: err.errors,
          timestamp: err.timestamp,
        }
      }, { status: 502 })
    }

    // Erreur générique (timeout, réseau, etc.)
    const msg = err?.message || 'Erreur inconnue'
    console.log(`  💥 Type erreur    : Error (générique)`)
    console.log(`  📄 Message brut   : ${msg}`)
    console.log(`  📄 Stack (500 chars): ${(err?.stack || '').slice(0, 500)}`)

    console.log('╚' + '═'.repeat(68) + '╝\n')

    if (msg.includes('timeout') || msg.includes('Abort') || msg.includes('ETIMEDOUT')) {
      return error('Délai dépassé : la réponse de Sanovia a mis trop de temps. Vérifiez votre connexion et réessayez.', 504)
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      return error('Erreur réseau : impossible de joindre le service IA. Vérifiez votre connexion internet et réessayez.', 503)
    }
    return error(`Erreur interne : ${msg}. Réessayez dans quelques instants.`)
  }
}
