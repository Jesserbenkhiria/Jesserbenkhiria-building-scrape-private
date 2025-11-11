import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
      };
    }
  }
}

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT dans les headers
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Récupérer le token depuis le header Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    res.status(401).json({
      error: 'Token d\'authentification manquant',
      message: 'Veuillez vous connecter pour accéder à cette ressource',
    });
    return;
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, env.JWT_SECRET) as { username: string };
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        error: 'Token invalide',
        message: 'Le token d\'authentification est invalide',
      });
      return;
    }

    res.status(500).json({
      error: 'Erreur lors de la vérification du token',
      message: 'Une erreur est survenue lors de l\'authentification',
    });
  }
};

