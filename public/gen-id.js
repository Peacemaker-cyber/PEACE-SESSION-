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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, pairingCode, pairCode } = update;

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('Reconnecting...');
      }
    }

    if (pairingCode || pairCode) {
      latestPairCode = pairingCode || pairCode;
      console.log('Generated Pair Code:', latestPairCode);
    }
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
