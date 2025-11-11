import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { env, validateApiKeys } from './config/env';
import { initDb, closeDb } from './store/db';
import { initMongo, closeMongo } from './store/mongo';
import searchRouter from './routes/search';
import runRouter from './routes/run';
import fullSearchRouter from './routes/full-search';
import cleanRouter from './routes/clean';
import searchFournisseursRouter from './routes/search-fournisseurs';
import searchUsinesRouter from './routes/search-usines';
import companiesRouter from './routes/companies';
import authRouter from './routes/auth';
import usineRouter from './routes/usine';
import { authenticateToken } from './middleware/auth';

// Logger
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// Créer l'application Express
const app = express();

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:5174', // Vite production server
      'http://localhost:3000', // React dev server (alternative)
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://51.68.172.145:5174', // Production server
    ];
    
    // In development, allow all localhost origins
    if (env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

// Middlewares globaux
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.RATE_LIMIT_PER_MINUTE,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Routes d'authentification
// /api/auth/login est publique
app.use('/api/auth', authRouter);

// /api/auth/verify nécessite une authentification (doit être après authRouter)
app.get('/api/auth/verify', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Token valide',
    user: req.user,
  });
});

// Routes API protégées (nécessitent une authentification)
app.use('/api', authenticateToken, searchRouter);
app.use('/api', authenticateToken, runRouter);
app.use('/api', authenticateToken, fullSearchRouter);
app.use('/api', authenticateToken, cleanRouter);
app.use('/api', authenticateToken, searchFournisseursRouter);
app.use('/api', authenticateToken, searchUsinesRouter);
app.use('/api', authenticateToken, companiesRouter);
app.use('/api/usine', authenticateToken, usineRouter);

// Route 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
  });
});

// Gestionnaire d'erreurs global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
  });

  res.status(500).json({
    error: 'Erreur interne du serveur',
    details: env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialisation
async function start() {
  try {
    // Vérifier les clés API
    const apiKeysStatus = validateApiKeys();

    if (apiKeysStatus.available.length === 0) {
      logger.error('❌ Aucune clé API configurée !');
      logger.error('   Configurez au moins une clé : GOOGLE_PLACES_KEY, BING_KEY ou SERPER_KEY');
      process.exit(1);
    }

    if (apiKeysStatus.missing.length > 0) {
      logger.warn(`⚠️  Clés API manquantes: ${apiKeysStatus.missing.join(', ')}`);
      logger.info(`✅ Clés API disponibles: ${apiKeysStatus.available.join(', ')}`);
    } else {
      logger.info('✅ Toutes les clés API sont configurées');
    }

    // Initialiser MongoDB
    if (env.MONGO_URI) {
      await initMongo();
      logger.info('✅ MongoDB connecté');
      
      // Initialiser la collection users
      try {
        const { initUsersCollection } = await import('./store/user-repo');
        await initUsersCollection();
        logger.info('✅ Collection users initialisée');
      } catch (error) {
        logger.warn('⚠️  Erreur lors de l\'initialisation de la collection users:', error);
      }
    } else {
      logger.warn('⚠️  MONGO_URI non configuré, MongoDB ne sera pas utilisé');
      logger.warn('⚠️  Les utilisateurs seront gérés via les variables d\'environnement uniquement');
    }

    // Démarrer le serveur
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Serveur démarré sur http://localhost:${env.PORT}`);
      logger.info(`   Environnement: ${env.NODE_ENV}`);
      logger.info(`   Rate limit: ${env.RATE_LIMIT_PER_MINUTE} req/min`);
      logger.info('');
      logger.info('📚 Routes disponibles:');
      logger.info(`   GET  http://localhost:${env.PORT}/health`);
      logger.info(`   GET  http://localhost:${env.PORT}/api/search`);
      logger.info(`   GET  http://localhost:${env.PORT}/api/companies`);
      logger.info(`   GET  http://localhost:${env.PORT}/api/construction`);
      logger.info(`   GET  http://localhost:${env.PORT}/api/fournisseur`);
      logger.info(`   GET  http://localhost:${env.PORT}/api/usine`);
      logger.info(`   POST http://localhost:${env.PORT}/api/run-seed`);
      logger.info(`   POST http://localhost:${env.PORT}/api/search-fournisseurs`);
      logger.info(`   POST http://localhost:${env.PORT}/api/search-usines`);
      logger.info(`   POST http://localhost:${env.PORT}/api/full-search`);
    });

    // Gestion de l'arrêt gracieux
    const shutdown = async () => {
      logger.info('🛑 Arrêt du serveur...');

      server.close(async () => {
        logger.info('✅ Serveur HTTP fermé');

        closeDb();
        await closeMongo();
        logger.info('✅ Connexions base de données fermées');

        process.exit(0);
      });

      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        logger.error('❌ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
}

// Démarrer l'application
start();

export default app;
