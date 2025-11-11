import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createUser, verifyUser } from '../store/user-repo';

const router = Router();

/**
 * POST /api/auth/register
 * Crée un nouvel utilisateur
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Vérifier que les credentials sont fournis
    if (!username || !password) {
      return res.status(400).json({
        error: 'Identifiants manquants',
        message: 'Veuillez fournir un nom d\'utilisateur et un mot de passe',
      });
    }

    // Valider le format
    if (username.length < 3) {
      return res.status(400).json({
        error: 'Nom d\'utilisateur invalide',
        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Mot de passe invalide',
        message: 'Le mot de passe doit contenir au moins 6 caractères',
      });
    }

    // Créer l'utilisateur
    const user = await createUser(username, password);

    // Générer un token JWT
    const token = jwt.sign(
      { username: user.username, userId: user.id },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Erreur dans /api/auth/register:', error);
    
    if (error instanceof Error && error.message.includes('existe déjà')) {
      return res.status(409).json({
        error: 'Utilisateur déjà existant',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Erreur lors de la création de l\'utilisateur',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/auth/login
 * Authentifie un utilisateur et retourne un token JWT
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Vérifier que les credentials sont fournis
    if (!username || !password) {
      return res.status(400).json({
        error: 'Identifiants manquants',
        message: 'Veuillez fournir un nom d\'utilisateur et un mot de passe',
      });
    }

    // Vérifier les credentials dans la base de données
    const user = await verifyUser(username, password);

    if (!user) {
      // Fallback vers les credentials d'environnement si MongoDB n'est pas configuré
      const isValidUsername = username === env.ADMIN_USERNAME;
      const isValidPassword = password === env.ADMIN_PASSWORD;

      if (isValidUsername && isValidPassword) {
        const token = jwt.sign(
          { username: env.ADMIN_USERNAME },
          env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Connexion réussie',
          token,
          user: {
            username: env.ADMIN_USERNAME,
          },
        });
      }

      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Le nom d\'utilisateur ou le mot de passe est incorrect',
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { username: user.username, userId: user.id },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Erreur dans /api/auth/login:', error);
    res.status(500).json({
      error: 'Erreur lors de la connexion',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/auth/verify
 * Vérifie si le token est valide (route protégée)
 * Note: Cette route doit être protégée par le middleware authenticateToken
 */

export default router;

