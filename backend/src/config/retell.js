
import Retell from "retell-sdk";
import "dotenv/config";

export const retellClient = new Retell({ apiKey: process.env.RETELL_API_KEY || "unset" });
