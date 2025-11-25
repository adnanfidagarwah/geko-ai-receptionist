
import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import apiRoutes from "./routes/api.js";
import retellRoutes from "./routes/retellRoutes.js";
import googleCalendarRoutes from "./routes/googleCalendar.js";


const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json({ type: ["application/json", "application/*+json", "text/plain"] }));
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => res.json({ ok: true }));
app.use("/api", apiRoutes);
app.use("/retell", retellRoutes);
app.use("/google", googleCalendarRoutes);


export default app;
