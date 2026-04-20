import { NextRequest } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { badRequest, success, error } from '@/lib/middleware'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

/**
 * POST /api/auth/google
 * Authentification via Google OAuth
 *
 * Body:
 * - idToken (string, requis) — Google ID Token
 * - language (string, optionnel, défaut: "fr")
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken, language } = body

    if (!idToken) {
      return badRequest('Le token Google est requis.')
    }

    if (!GOOGLE_CLIENT_ID) {
      return error('L\'authentification Google n\'est pas configurée. Contactez l\'administrateur.', 503)
    }

    // Vérifier le token Google
    const client = new OAuth2Client(GOOGLE_CLIENT_ID)
    let ticket: any
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID
      })
    } catch {
      return badRequest('Token Google invalide ou expiré.')
    }

    const googlePayload = ticket.getPayload()
    if (!googlePayload) {
      return badRequest('Impossible de lire les informations Google.')
    }

    const { sub: googleId, email, name, picture } = googlePayload

    if (!email) {
      return badRequest('Impossible de récupérer l\'email depuis le compte Google.')
    }

    // Chercher un utilisateur existant avec cet email ou Google ID
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { googleId }
        ]
      }
    })

    let user

    if (existingUser) {
      // Mettre à jour l'utilisateur existant avec le Google ID si nécessaire
      user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: googleId || existingUser.googleId,
          avatarUrl: picture || existingUser.avatarUrl,
          authProvider: 'google',
          lastLoginAt: new Date()
        }
      })
    } else {
      // Créer un nouvel utilisateur
      user = await db.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || 'Utilisateur Google',
          avatarUrl: picture,
          googleId,
          authProvider: 'google',
          language: language || 'fr',
          lastLoginAt: new Date()
        }
      })
    }

    // Générer le token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    return success({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        language: user.language,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      },
      token
    })

  } catch (err: any) {
    console.error('[Google Auth Error]', err)
    return error('Erreur lors de l\'authentification Google. Veuillez réessayer.')
  }
}
