import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { cardsGenerateRoute } from './cards/generate.js';
import { cardsSaveRoute } from './cards/save.js';
import { credentialsRoutes } from './credentials.js';
import { settingsRoutes } from './settings.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(cardsGenerateRoute);
  await app.register(cardsSaveRoute);
  await app.register(credentialsRoutes);
  await app.register(settingsRoutes);
}
