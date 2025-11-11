import { Router, Request, Response } from 'express';
import { getAllConstruction, getAllFournisseur, getStatistics, getAllKeywords, getCategoryStatistics } from '../store/mongo-repo';
import { env } from '../config/env';

const router = Router();

/**
 * GET /api/construction
 * Récupère toutes les entreprises de construction
 */
router.get('/construction', async (req: Request, res: Response) => {
  try {
    // Pagination par défaut : 20 items par page
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const city = req.query.city ? (req.query.city as string) : undefined;
    const q = req.query.q ? (req.query.q as string) : undefined;
    const keyword = req.query.keyword ? (req.query.keyword as string) : undefined;
    
    const result = await getAllConstruction(limit, offset, city, q, keyword);
    
    // Calculer les informations de pagination
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(result.total / limit);
    const hasNextPage = offset + limit < result.total;
    const hasPrevPage = offset > 0;
    
    res.json({
      count: result.items.length,
      total: result.total,
      items: result.items,
      pagination: {
        currentPage,
        totalPages,
        pageSize: limit,
        offset,
        hasNextPage,
        hasPrevPage,
        nextOffset: hasNextPage ? offset + limit : null,
        prevOffset: hasPrevPage ? Math.max(0, offset - limit) : null,
      },
      meta: {
        limit,
        offset,
        city,
        q,
        keyword,
      },
    });
  } catch (error) {
    console.error('Erreur dans /api/construction:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des entreprises de construction',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/fournisseur
 * Récupère toutes les entreprises fournisseur
 */
router.get('/fournisseur', async (req: Request, res: Response) => {
  try {
    // Pagination par défaut : 20 items par page
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const city = req.query.city ? (req.query.city as string) : undefined;
    const q = req.query.q ? (req.query.q as string) : undefined;
    const keyword = req.query.keyword ? (req.query.keyword as string) : undefined;
    
    const result = await getAllFournisseur(limit, offset, city, q, keyword);
    
    // Calculer les informations de pagination
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(result.total / limit);
    const hasNextPage = offset + limit < result.total;
    const hasPrevPage = offset > 0;
    
    res.json({
      count: result.items.length,
      total: result.total,
      items: result.items,
      pagination: {
        currentPage,
        totalPages,
        pageSize: limit,
        offset,
        hasNextPage,
        hasPrevPage,
        nextOffset: hasNextPage ? offset + limit : null,
        prevOffset: hasPrevPage ? Math.max(0, offset - limit) : null,
      },
      meta: {
        limit,
        offset,
        city,
        q,
        keyword,
      },
    });
  } catch (error) {
    console.error('Erreur dans /api/fournisseur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des entreprises fournisseur',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/google-maps-key
 * Récupère la clé Google Maps pour le frontend
 */
router.get('/google-maps-key', async (req: Request, res: Response) => {
  try {
    const apiKey = env.GOOGLE_PLACES_KEY || '';
    res.json({ apiKey });
  } catch (error) {
    console.error('Erreur dans /api/google-maps-key:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de la clé Google Maps',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/statistics
 * Récupère les statistiques pour le dashboard
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Erreur dans /api/statistics:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/keywords/:category
 * Récupère tous les keywords uniques pour une catégorie
 */
router.get('/keywords/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category as 'construction' | 'fournisseur';
    
    if (category !== 'construction' && category !== 'fournisseur') {
      return res.status(400).json({
        error: 'Catégorie invalide. Utilisez "construction" ou "fournisseur"',
      });
    }
    
    const keywords = await getAllKeywords(category);
    
    res.json({
      category,
      keywords,
      count: keywords.length,
    });
  } catch (error) {
    console.error('Erreur dans /api/keywords:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des keywords',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/statistics/:category
 * Récupère toutes les statistiques détaillées pour une catégorie
 */
router.get('/statistics/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category as 'construction' | 'fournisseur';
    
    if (category !== 'construction' && category !== 'fournisseur') {
      return res.status(400).json({
        error: 'Catégorie invalide. Utilisez "construction" ou "fournisseur"',
      });
    }
    
    const stats = await getCategoryStatistics(category);
    
    res.json({
      category,
      ...stats,
    });
  } catch (error) {
    console.error('Erreur dans /api/statistics/:category:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

