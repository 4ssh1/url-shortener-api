import { Router, Request, Response } from "express"
import { ApiResponse } from "@/util/api-response"
import getRateLimiter from "@/middleware/rate-limiter"
import authRoutes from "./auth"
import userRoutes from "./user"
import linkRoutes from "./link"
import { RedirectController } from "@/controllers/redirect"

const router = Router()

router.get("/", getRateLimiter('basic'), (req:Request, res:Response) => {
    ApiResponse.success(res, {
        version: "1.0.0",
        docs: "https://documenter.getpostman.com/view/40852797/2sBXqQHJno",
        timestamp: new Date().toISOString()
    })
}) 

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/links", linkRoutes)

router.get('/:backHalf', RedirectController.handleRedirect);

export default router