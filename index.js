import express from 'express';
import { Boom } from '@hapi/boom';
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import fs from 'fs-extra';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
global.crypto = crypto;

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ======== Pair Code Generation ========
app.post('/generate-id', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required' });

    const authDir = `auth_${number}`;
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    let timeout = setTimeout(() => {
      res.status(504).json({ error: 'Pair code timeout' });
      sock.end(new Boom('Timeout generating pair code', { statusCode: 504 }));
    }, 15000); // ⏱ Try for 15s max

    sock.ev.once('connection.update', async (update) => {
      const { pairingCode, pairCode, connection } = update;

      if (pairingCode || pairCode) {
        clearTimeout(timeout);
        const code = pairingCode || pairCode;
        console.log('✅ Pair code generated:', code);
        return res.json({ code });
      }

      if (connection === 'close') {
        clearTimeout(timeout);
        return res.status(500).json({ error: 'Connection closed before code generation' });
      }
    });
  } catch (error) {
    console.error('❌ Error generating pair code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======== Serve index.html fallback ========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
