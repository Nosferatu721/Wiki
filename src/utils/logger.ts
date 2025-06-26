import { createLogger, transports, format } from 'winston';
import path from 'path';

export const logger = createLogger({
  level: 'error',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: path.join(__dirname, '../../logs/error.log') })],
});

export const logError = (
  method: string,
  params: unknown,
  query: unknown,
  body: unknown,
  error: unknown
): void => {
  logger.error({
    method,
    params,
    body,
    query,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
}
