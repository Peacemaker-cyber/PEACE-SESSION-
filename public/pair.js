document.getElementById('pairForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const number = document.getElementById('number').value;
  const response = await fetch('/generate-pair', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ number })
  });

  const data = await response.json();
  document.getElementById('codeResult').textContent = data.pairCode || 'Failed to generate';
});
