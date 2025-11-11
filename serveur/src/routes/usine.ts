import { Router, Request, Response } from 'express';
import { getAllUsines, getAllUsineTypes, upsertUsine, getUsineById, countUsines, getAllUsineKeywords } from '../store/mongo-repo';
import { UsineSchema } from '../types';

const router = Router();

/**
 * GET /api/usine
 * Récupère toutes les usines
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Pagination par défaut : 20 items par page
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const city = req.query.city ? (req.query.city as string) : undefined;
    const q = req.query.q ? (req.query.q as string) : undefined;
    const keyword = req.query.keyword ? (req.query.keyword as string) : undefined;
    
    const result = await getAllUsines(limit, offset, city, q, keyword);
    
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
    console.error('Erreur dans /api/usine:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des usines',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/usine/categories
 * Récupère toutes les catégories d'usines uniques
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getAllUsineTypes();
    
    res.json({
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Erreur dans /api/usine/categories:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des catégories d\'usines',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/usine/keywords
 * Récupère tous les mots-clés (searchKeyword) uniques
 */
router.get('/keywords', async (req: Request, res: Response) => {
  try {
    const keywords = await getAllUsineKeywords();
    res.json({
      keywords,
      count: keywords.length,
    });
  } catch (error) {
    console.error('Erreur dans /api/usine/keywords:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des mots-clés',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/usine/count
 * Récupère le nombre total d'usines
 */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const count = await countUsines();
    
    res.json({
      count,
    });
  } catch (error) {
    console.error('Erreur dans /api/usine/count:', error);
    res.status(500).json({
      error: 'Erreur lors du comptage des usines',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/usine/:id
 * Récupère une usine par son ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const usine = await getUsineById(id);
    
    if (!usine) {
      return res.status(404).json({
        error: 'Usine non trouvée',
      });
    }
    
    res.json(usine);
  } catch (error) {
    console.error('Erreur dans /api/usine/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'usine',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/usine
 * Crée ou met à jour une usine
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Valider les données avec Zod
    const validationResult = UsineSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: validationResult.error.errors,
      });
    }
    
    const usine = validationResult.data;
    const { id: _, ...usineData } = usine; // Exclure l'ID pour l'upsert
    
    const result = await upsertUsine(usineData);
    
    res.status(result.isNew ? 201 : 200).json({
      success: true,
      id: result.id,
      isNew: result.isNew,
      message: result.isNew ? 'Usine créée avec succès' : 'Usine mise à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur dans POST /api/usine:', error);
    res.status(500).json({
      error: 'Erreur lors de la création/mise à jour de l\'usine',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/usine/:id
 * Met à jour une usine existante
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // Vérifier si l'usine existe
    const existingUsine = await getUsineById(id);
    if (!existingUsine) {
      return res.status(404).json({
        error: 'Usine non trouvée',
      });
    }
    
    // Valider les données avec Zod
    const validationResult = UsineSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: validationResult.error.errors,
      });
    }
    
    const usine = validationResult.data;
    const { id: _, ...usineData } = usine; // Exclure l'ID pour l'upsert
    
    const result = await upsertUsine(usineData);
    
    res.json({
      success: true,
      id: result.id,
      message: 'Usine mise à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur dans PUT /api/usine/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'usine',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

