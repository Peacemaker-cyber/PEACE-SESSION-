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
import fs from 'fs-extra';
import crypto from 'crypto';
global.crypto = crypto; // Required by Baileys

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let latestPairCode = '';
let currentQR = '';

/**
 * ======== Pair Code Generation ========
 */
app.post('/generate-id', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required' });

    const authDir = `auth_${number}`;
    await fs.remove(authDir); // ✅ Clear old auth folder
    console.log(`[INFO] Cleared auth folder for ${number}`);

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    let gotCode = false;
    latestPairCode = '';

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '22.04'], // Good default
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, pairingCode, pairCode } = update;

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) console.log('[WARN] Reconnecting...');
      }

      if (pairingCode || pairCode) {
        latestPairCode = pairingCode || pairCode;
        gotCode = true;
        console.log(`[SUCCESS] Pair Code Generated: ${latestPairCode}`);
      }
    });

    // Set timeout (default 6 seconds)
    const timeoutMs = 6000;
    setTimeout(() => {
      if (gotCode && latestPairCode) {
        res.json({ code: latestPairCode });
      } else {
        console.log('[ERROR] Pair code generation timed out');
        res.status(500).json({ error: 'Failed to generate pairing code in time' });
      }
    }, timeoutMs);
  } catch (error) {
    console.error('Error generating ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ======== QR Code Generation ========
 */
app.get('/generate-qr', async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_qr');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ qr }) => {
      if (qr) {
        currentQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
        console.log('✅ QR Code Generated');
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

/**
 * ======== Serve index.html fallback ========
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
