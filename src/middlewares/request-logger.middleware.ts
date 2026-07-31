import pkg from "pino-http";
const { default: pinoHttp } = pkg;

import { logger } from "../utils/logger.js";

export const requestLogger = pinoHttp({
  logger,
});
