// index.js - Server backend for PEACE MD WhatsApp Session ID Generator import express from "express"; import { Boom } from "@hapi/boom"; import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, makeInMemoryStore, } from "@whiskeysockets/baileys"; import QRCode from "qrcode"; import cors from "cors"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename);

const app = express(); const PORT = process.env.PORT || 3000; app.use(cors()); app.use(express.json()); app.use(express.static("public"));

const sessions = {};

app.post("/generate", async (req, res) => { const { number } = req.body; if (!number) return res.status(400).json({ error: "Phone number required" });

const sessionId = session-${Date.now()}; const sessionPath = path.join(__dirname, auth/${sessionId});

const { state, saveCreds } = await useMultiFileAuthState(sessionPath); const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({ version, printQRInTerminal: false, auth: state, browser: ["PEACE MD", "Chrome", "1.0"], });

sock.ev.on("connection.update", async (update) => { const { connection, qr } = update; if (qr) { const qrImage = await QRCode.toDataURL(qr); sessions[sessionId] = { qrImage, sock, saveCreds }; } if (connection === "open") { await saveCreds(); } });

res.json({ sessionId }); });

app.get("/qr/:sessionId", (req, res) => { const { sessionId } = req.params; const session = sessions[sessionId]; if (!session || !session.qrImage) { return res.status(404).json({ error: "QR code not found" }); } res.json({ qr: session.qrImage }); });

app.listen(PORT, () => console.log(Server running on http://localhost:${PORT}));

