import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
    res.render("home", { 
        telegramLink: process.env.TELEGRAM_LINK,
        whatsappLink: process.env.WHATSAPP_LINK
    });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
