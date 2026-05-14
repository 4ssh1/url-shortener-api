import express, { Response, Request } from "express"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import router from "./router"

import { config } from "@/config"

const app = express()

app.use(helmet());
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended : true}));


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


