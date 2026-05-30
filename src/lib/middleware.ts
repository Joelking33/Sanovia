import { NextRequest, NextResponse } from 'next/server'
import { getToken, isValidLanguage, LANGUAGE_NAMES } from './auth'

// Ré-exporter les utilitaires d'auth pour simplifier les imports dans les routes
export { isValidLanguage, LANGUAGE_NAMES }

// ============================================================
// CONSTANTES
// ============================================================

const SUPPORTED_CATEGORIES = ['general', 'premiers_secours', 'grossesse'] as const

export function isValidCategory(category: string): boolean {
  return SUPPORTED_CATEGORIES.includes(category as any)
}

// ============================================================
// CONVERSION DATE → STRING ISO (BULLETPROOF)
// ============================================================
// Ce helper DOIT être utilisé pour TOUTE valeur Date venant de Prisma
// avant toute sérialisation JSON. Il empêche l'erreur
// "(intermediate value).toISOString is not a function" qui se
// produit quand JSON.stringify tente d'appeler toJSON()/toISOString()
// sur des objets Date non-standards (certains drivers Neon/pgBouncer).
// ============================================================

export function toISO(val: unknown): string {
  // Cas 1 : vrai objet Date JavaScript
  if (val instanceof Date) {
    try {
      return val.toISOString()
    } catch {
      // Fallback si toISOString est cassé
      return new Date(val.getTime()).toISOString()
    }
  }
  // Cas 2 : déjà une string ISO
  if (typeof val === 'string' && val.length > 0) {
    return val
  }
  // Cas 3 : objet date-like (non-standard, ex: Prisma proxy)
  if (val !== null && typeof val === 'object') {
    try {
      // Essayer getTime() (existe sur les vrais Dates et certains proxies)
      if (typeof (val as any).getTime === 'function') {
        const ts = (val as any).getTime()
        if (typeof ts === 'number' && isFinite(ts)) {
          return new Date(ts).toISOString()
        }
      }
      // Essayer toISOString() directement
      if (typeof (val as any).toISOString === 'function') {
        return (val as any).toISOString()
      }
    } catch {
      // Ignorer les erreurs, on passera au fallback
    }
  }
  // Cas 4 : number (timestamp)
  if (typeof val === 'number' && isFinite(val)) {
    return new Date(val).toISOString()
  }
  // Fallback ultime
  return new Date().toISOString()
}

// ============================================================
// SÉRIALISATION JSON SÉCURISÉE (BULLETPROOF)
// ============================================================
// Pré-traite TOUTE la structure de données pour convertir
// les Date/objets date-like en strings ISO AVANT JSON.stringify.
// Cela empêche toute erreur de sérialisation côté server.
// ============================================================

/**
 * Convertit récursivement toutes les valeurs Date/date-like en strings ISO.
 * Pré-traitement appliqué AVANT JSON.stringify pour éviter toute erreur
 * de sérialisation avec les objets Date non-standards.
 */
function preprocessDates(data: unknown, depth = 0): unknown {
  if (depth > 20) return data // Limiter la profondeur pour éviter stack overflow

  if (data instanceof Date) {
    return toISO(data)
  }

  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data
  }

  // Object date-like non-standard (ex: proxy Prisma)
  if (typeof data === 'object' && data !== null && 'getTime' in data) {
    try {
      if (typeof (data as any).getTime === 'function') {
        return toISO(data)
      }
    } catch {
      // Pas un date-like utilisable
    }
  }

  if (Array.isArray(data)) {
    return data.map(item => preprocessDates(item, depth + 1))
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(data)) {
      result[key] = preprocessDates((data as Record<string, unknown>)[key], depth + 1)
    }
    return result
  }

  return data
}

export function safeJsonStringify(data: unknown): string {
  try {
    // Pré-traiter les dates AVANT la sérialisation
    const preprocessed = preprocessDates(data)
    return JSON.stringify(preprocessed)
  } catch (err) {
    console.error('[safeJsonStringify] Erreur de sérialisation:', err)
    // Fallback ultime : convertir en string manuellement
    try {
      return JSON.stringify(String(data))
    } catch {
      return '{}'
    }
  }
}

// ============================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================================

/**
 * Middleware d'authentification pour les routes protégées
 * Vérifie le token JWT dans le header Authorization: Bearer <token>
 */
export async function authenticate(request: NextRequest) {
  try {
    const payload = await getToken(request)
    if (!payload) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Authentification requise. Veuillez fournir un token JWT valide.' },
          { status: 401 }
        )
      }
    }
    return { success: true, userId: payload.userId, email: payload.email }
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Token invalide ou expiré.' },
        { status: 401 }
      )
    }
  }
}

/**
 * Middleware optionnel d'authentification
 * Ne renvoie pas d'erreur si pas de token, mais attache userId si présent
 */
export async function optionalAuth(request: NextRequest) {
  try {
    const payload = await getToken(request)
    if (!payload) return { success: true, userId: null }
    return { success: true, userId: payload.userId }
  } catch {
    return { success: true, userId: null }
  }
}

// ============================================================
// HANDLERS DE RÉPONSES API STANDARDISÉS
// Utilisent safeJsonStringify pour éviter les erreurs Date
// ============================================================

export function success(data: unknown, status = 200) {
  const body = safeJsonStringify({ success: true, data })
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function created(data: unknown) {
  const body = safeJsonStringify({ success: true, data })
  return new NextResponse(body, {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function badRequest(message: string) {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function unauthorized(message = 'Authentification requise.') {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function forbidden(message = 'Accès interdit.') {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function notFound(message = 'Ressource non trouvée.') {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function error(message: string, status = 500) {
  console.error(`[API Error ${status}] ${message}`)
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
