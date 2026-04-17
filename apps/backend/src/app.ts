import Fastify from 'fastify';
import { env } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerHelmet } from './plugins/helmet.js';
import { registerJwt } from './plugins/jwt.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Plugins
  await registerCors(app);
  await registerHelmet(app);
  await registerJwt(app);
  registerErrorHandler(app);

  // Routes
  await registerRoutes(app);

  return app;
}
