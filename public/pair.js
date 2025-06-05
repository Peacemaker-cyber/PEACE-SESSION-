// public/pair.js
document.getElementById("submitBtn").onclick = async () => {
  const number = document.getElementById("numberInput").value;
  const result = document.getElementById("result");

  if (!number) {
    result.textContent = "Please enter a number.";
    return;
  }

  result.textContent = "Generating code...";
  try {
    const res = await fetch("/api/gen-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });
    const data = await res.json();
    result.textContent = `Pair Code: ${data.code}`;
  } catch (err) {
    result.textContent = "Error generating code.";
  }
};
