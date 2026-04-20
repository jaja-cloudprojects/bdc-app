import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[error]', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      issues: err.errors,
    });
  }

  if (err?.code === 'P2002') {
    return res.status(409).json({ message: 'Unique constraint violation' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(env.isDev && err.stack ? { stack: err.stack } : {}),
  });
}
