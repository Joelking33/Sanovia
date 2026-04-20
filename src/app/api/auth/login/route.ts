import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { badRequest, success, error, unauthorized } from '@/lib/middleware'

/**
 * POST /api/auth/login
 * Connexion avec email et mot de passe
 *
 * Body:
 * - email (string, requis)
 * - password (string, requis)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation des champs requis
    if (!email || !password) {
      return badRequest('Email et mot de passe sont requis.')
    }

    // Chercher l'utilisateur
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user || !user.passwordHash) {
      return unauthorized('Email ou mot de passe incorrect.')
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return unauthorized('Votre compte a été désactivé. Contactez le support.')
    }

    // Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return unauthorized('Email ou mot de passe incorrect.')
    }

    // Mettre à jour la date de dernière connexion
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

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
    console.error('[Login Error]', err)
    return error('Erreur lors de la connexion. Veuillez réessayer.')
  }
}
