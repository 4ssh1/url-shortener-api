import dotenv from "dotenv"
dotenv.config()

const corsWhitelist = ["https://www.postman.com/personal-team-0069/workspace/url-shortener/collection/40852797-443a4e4b-e525-4bc9-9eba-01f64c03d475?action=share&creator=40852797"]

export const config = {
    port : process.env.PORT,
    nodeEnv : process.env.NODE_ENV,
    corsOrigin: corsWhitelist,
    logtailToken: process.env.LOGTAIL_TOKEN,
    logTailSourceToken: process.env.LOG_TAIL_SOURCE_TOKEN,
    logTailSourceId: process.env.LOG_TAIL_SOURCE_ID,
    logTailIngestingHost: process.env.LOG_TAIL_INVESTING_HOST,
    
}