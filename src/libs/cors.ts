import { config } from "@/config";
import cors, { CorsOptions } from "cors";

const corsOptions: CorsOptions = {
    origin(origin, callback) {
        if (origin && config.corsOrigin.includes(origin)) {
            callback(null, true);
        } else {
            callback(
                config.nodeEnv === 'production'
                    ? new Error('Not allowed by CORS')
                    : null, 
                false
            );
        }
    },
    credentials: true,
};

export default cors(corsOptions);