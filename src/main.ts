import express, { Response, Request } from "express"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import router from "./router"

import { config } from "@/config"

const app = express()

app.use(helmet())
app.use(cookieParser())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({extended : true}))



app.listen(config.port,()=> {
    console.log(`server is listening at http://localhost:${config.port}`)
})
