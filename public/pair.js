// pair.js

const form = document.getElementById('pairForm'); const resultEl = document.getElementById('result');

form.addEventListener('submit', async (e) => { e.preventDefault(); const number = document.getElementById('whatsAppNumber').value; if (!number) return alert('Please enter a valid WhatsApp number');

resultEl.textContent = 'Generating code, please wait...';

try { const res = await fetch('/api/pair-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number }) }); const data = await res.json();

if (res.ok) {
  resultEl.innerHTML = `<strong>Pair Code:</strong> ${data.code}`;
} else {
  resultEl.textContent = data.error || 'Failed to generate pair code';
}

} catch (err) { resultEl.textContent = 'Error connecting to server'; } });

