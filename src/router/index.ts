import { Router, Request, Response } from "express"
import { ApiResponse } from "@/util/api-response"

const router = Router()

router.get("/", (req:Request, res:Response) => {
    ApiResponse.success(res, {
        version: "1.0.0",
        docs: "",
        timestamp: new Date().toISOString()
    })
}) 

export default router