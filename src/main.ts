import express from "express"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import router from "./routes"
import logger from "./libs/pino"
import { connectDB, disconnectDB } from "./libs/db"
import { globalErrorHandler } from "@/middleware/error-handler"

import { config } from "@/config"
import cors from "./libs/cors"

const app = express()

app.set('trust proxy', 1);

// secure headers
app.use(helmet());
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors);


(async () => {
  try {
    await connectDB();
    logger.info({ database: 'MongoDB' }, 'Database connected');

    app.use("/api/v1", router)

    app.use(globalErrorHandler)

    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'Server is running');
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to start server');

    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
})();

const serverTerm = async (signal: NodeJS.Signals): Promise<void> => {
  try {
    await disconnectDB();

    logger.warn({ signal }, 'Process termination signal received');

    // This ensures all buffered logs are written to the transport (Logtail)
    logger.flush();


    setTimeout(() => {
      process.exit(0);
    }, 500);
  } catch (error) {
    logger.error({ err: error }, 'Error occurred while shutting down');
    logger.flush();

    process.exit(1);
  }
}

// listen for termination signals
process.on('SIGINT', () => serverTerm('SIGINT'));
process.on('SIGTERM', () => serverTerm('SIGTERM'));