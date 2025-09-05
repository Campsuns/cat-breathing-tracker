// js/api.js
const API_URL = "https://script.google.com/macros/s/AKfycbxH8wNUrHeWeq7jBrpVzB1tS3ksaTxRIPhj1jVjjBQP35OHJzydasb990IHeQECT/exec";

async function apiGetLatest(limit = 30) {
  const url = `${API_URL}?action=latest&limit=${limit}&t=${Date.now()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch latest");
  return res.json();
}

async function apiPostSample(payload) {
  // Use text/plain to avoid CORS preflight
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

function fmtMMDDYY(d) {
  const dt = new Date(d);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yy = String(dt.getFullYear()).slice(-2);
  return `${mm}-${dd}-${yy}`;
}
