import express from 'express';
import { Boom } from '@hapi/boom';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/generate-id', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Phone number is required' });

  const { state, saveCreds } = await useMultiFileAuthState(`auth_${number}`);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  let latestPairCode = '';

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, pairingCode }) => {
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) console.log('Reconnecting...');
    }
    if (pairingCode) latestPairCode = pairingCode;
  });

  sock.ev.on('creds.update', saveCreds);

  setTimeout(() => {
    if (latestPairCode) {
      res.json({ code: latestPairCode });
    } else {
      res.status(500).json({ error: 'Failed to generate code' });
    }
  }, 5000);
});

app.get('/generate-qr', async (req, res) => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_qr');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  let currentQR = '';

  sock.ev.on('connection.update', async ({ qr }) => {
    if (qr) {
      currentQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    }
  });

  sock.ev.on('creds.update', saveCreds);

  setTimeout(() => {
    if (currentQR) {
      res.json({ qr: currentQR });
    } else {
      res.status(500).json({ error: 'QR not available' });
    }
  }, 5000);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
