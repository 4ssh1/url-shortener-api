import express, { Response, Request } from "express"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import router from "./router"

import { config } from "@/config"
import cors from "./libs/cors"

const app = express()

// secure headers
app.use(helmet());
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cors);


(async () => {
  try {
    // await db.connect();
    console.log('Database connected');
    app.use("/",router)
    
    app.listen(config.port, () => {
      console.log('Server is running');
    });
  } catch (error) {
    console.error('Failed to start server', error);
    if(config.nodeEnv === 'production') {
      process.exit(1); // Exit with failure code in production
    }
  }
})();

const serverTerm = async(signal: NodeJS.Signals): Promise<void> => {
    try {
        console.log(`Received signal: ${signal}`);
        process.exit(0);
    } catch (error) {
        console.error('Error occurred while shutting down:', error);
        process.exit(1);
    }
}

//listen for termination signals
process.on('SIGINT', () => serverTerm('SIGINT'));
process.on('SIGTERM', () => serverTerm('SIGTERM'));
