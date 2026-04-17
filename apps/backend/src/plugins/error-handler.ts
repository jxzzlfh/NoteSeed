import type { FastifyInstance, FastifyError } from 'fastify';
import { ZodError } from 'zod';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | ZodError, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation Error',
        code: 400,
        issues: error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const statusCode = (error as FastifyError).statusCode ?? 500;
    const message = statusCode >= 500 ? 'Internal Server Error' : error.message;

    app.log.error(error);

    return reply.status(statusCode).send({
      error: message,
      code: statusCode,
    });
  });
}
