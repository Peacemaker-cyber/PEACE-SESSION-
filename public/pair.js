// pair.js

const form = document.getElementById('pairForm'); const phoneInput = document.getElementById('phone'); const result = document.getElementById('result');

form.addEventListener('submit', async (e) => { e.preventDefault(); const phoneNumber = phoneInput.value.trim();

if (!phoneNumber) { result.textContent = 'Please enter your WhatsApp number.'; return; }

result.textContent = 'Generating pair code...';

try { const response = await fetch('/api/gen-pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneNumber }) });

const data = await response.json();
if (data.pairCode) {
  result.textContent = `Pair code: ${data.pairCode}`;
} else {
  result.textContent = data.error || 'Failed to generate pair code.';
}

} catch (error) { console.error('Error:', error); result.textContent = 'An error occurred while generating pair code.'; } });

