// index.js (Backend Server) import express from 'express'; import cors from 'cors'; import { Boom } from '@hapi/boom'; import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, makeInMemoryStore } from '@whiskeysockets/baileys'; import P from 'pino'; import qrcode from 'qrcode'; import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); const app = express(); const port = process.env.PORT || 3000;

app.use(cors()); app.use(express.json()); app.use(express.static('public'));

let qrData = null;

const startSocket = async () => { const { state, saveCreds } = await useMultiFileAuthState('auth'); const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({ version, logger: P({ level: 'silent' }), printQRInTerminal: true, auth: state, browser: ['PEACE MD', 'Chrome', '1.0'] });

sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => { if (qr) { qrData = await qrcode.toDataURL(qr); }

if (connection === 'close') {
  const reason = new Boom(lastDisconnect?.error).output.statusCode;
  if (reason === DisconnectReason.loggedOut) {
    console.log('Logged out. Restarting...');
    startSocket();
  }
} else if (connection === 'open') {
  console.log('Connected');
}

});

sock.ev.on('creds.update', saveCreds); };

startSocket();

// Routes app.get('/api/qr', (req, res) => { res.json({ qr: qrData }); });

app.post('/api/gen-id', (req, res) => { const { number } = req.body; if (!number) return res.status(400).json({ error: 'Number is required' });

const code = Math.floor(100000 + Math.random() * 900000).toString(); res.json({ code }); });

app.listen(port, () => { console.log(Server running on http://localhost:${port}); });

