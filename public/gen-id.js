document.getElementById('generateBtn').addEventListener('click', async () => {
  const number = document.getElementById('numberInput').value.trim();
  const codeDisplay = document.getElementById('codeDisplay');

  if (!number) {
    codeDisplay.innerText = 'Please enter your phone number.';
    return;
  }

  codeDisplay.innerText = 'Generating pair code...';

  try {
    const response = await fetch('/generate-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number }),
    });

    const data = await response.json();

    if (data.code) {
      codeDisplay.innerHTML = `<strong>Pair Code:</strong> ${data.code}`;
    } else if (data.error) {
      codeDisplay.innerText = `Error: ${data.error}`;
    } else {
      codeDisplay.innerText = 'Unexpected response from server.';
    }
  } catch (error) {
    console.error(error);
    codeDisplay.innerText = 'Failed to generate pair code.';
  }
});
