// index.js

import express from 'express';
import { Boom } from '@hapi/boom';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ======== Pair Code Generation ========
app.post('/generate-id', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Phone number is required' });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${number}`);
    const { version } = await fetchLatestBaileysVersion();

    let pairCodeSent = false;

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, pairingCode, pairCode } = update;

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error instanceof Boom &&
            lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
        if (shouldReconnect) {
          console.log('Reconnecting...');
        }
      }

      if (!pairCodeSent && (pairingCode || pairCode)) {
        const code = pairingCode || pairCode;
        console.log('✅ Pair Code Generated:', code);
        pairCodeSent = true;
        res.json({ code });
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Fallback if no pair code is returned in time
    setTimeout(() => {
      if (!pairCodeSent) {
        res.status(500).json({ error: 'Failed to generate pair code in time.' });
      }
    }, 10000);
  } catch (err) {
    console.error('❌ Error during pair code generation:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ======== QR Code Generation ========
app.get('/generate-qr', async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_qr');
    const { version } = await fetchLatestBaileysVersion();

    let qrSent = false;

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on('connection.update', async ({ qr }) => {
      if (qr && !qrSent) {
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
        console.log('✅ QR Code Generated');
        qrSent = true;
        res.json({ qr: qrImageUrl });
      }
    });

    sock.ev.on('creds.update', saveCreds);

    setTimeout(() => {
      if (!qrSent) {
        res.status(500).json({ error: 'QR not available' });
      }
    }, 10000);
  } catch (err) {
    console.error('❌ Error generating QR code:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ======== Serve index.html fallback ========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
