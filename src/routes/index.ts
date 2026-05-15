import { Router, Request, Response } from "express"
import { ApiResponse } from "@/util/api-response"
import authRoutes from "./auth"
import getRateLimiter from "@/middleware/rate-limiter"

const router = Router()

router.get("/", getRateLimiter('basic'), (req:Request, res:Response) => {
    ApiResponse.success(res, {
        version: "1.0.0",
        docs: "https://documenter.getpostman.com/view/40852797/2sBXqQHJno",
        timestamp: new Date().toISOString()
    })
}) 

router.use("/auth", authRoutes);

export default router