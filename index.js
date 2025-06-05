import express from 'express';
import { Boom } from '@hapi/boom';
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
global.crypto = crypto; // Required for Baileys crypto functions

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let currentQR = '';

// ======== Pair Code Generation ========
app.post('/generate-id', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required' });

    const authDir = `auth_${number}`;
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir); // Ensure folder exists

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    let responded = false;

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, pairingCode, pairCode } = update;

      console.log('🔄 Connection Update:', update);

      if ((pairingCode || pairCode) && !responded) {
        const code = pairingCode || pairCode;
        responded = true;
        console.log('✅ Pair Code Generated:', code);
        return res.json({ code });
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔌 Connection closed. Should reconnect:', shouldReconnect);
      }

      if (connection === 'open') {
        console.log('✅ Connection open');
      }
    });

    // Fallback timeout
    setTimeout(() => {
      if (!responded) {
        console.error('❌ Timed out waiting for pairing code');
        res.status(500).json({ error: 'Failed to generate pairing code in time' });
      }
    }, 20000);
  } catch (error) {
    console.error('❌ Error generating ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======== QR Code Generation ========
app.get('/generate-qr', async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_qr');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ qr }) => {
      if (qr) {
        currentQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
        console.log('QR Code Generated');
      }
    });

    setTimeout(() => {
      if (currentQR) {
        res.json({ qr: currentQR });
      } else {
        res.status(500).json({ error: 'QR not available' });
      }
    }, 5000);
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======== Serve index.html fallback ========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
