const logEl = document.getElementById("log");
const phoneEl = document.getElementById("phone");
const otpEl = document.getElementById("otp");
const claimTypeEl = document.getElementById("claim-type");

function log(...args){
  logEl.innerText = args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ");
}

async function postJson(path, body){
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

document.getElementById("btn-login").addEventListener("click", async () => {
  const num = phoneEl.value.trim();
  if(!num) return log("Enter phone");
  log("Requesting OTP for", num, "...");
  const r = await postJson("/api/login", { num });
  log(r);
});

document.getElementById("btn-verify").addEventListener("click", async () => {
  const num = phoneEl.value.trim();
  const otp = otpEl.value.trim();
  if(!num || !otp) return log("Enter number and otp");
  log("Verifying OTP...");
  const r = await postJson("/api/verify", { num, otp });
  log(r);
});

document.getElementById("btn-activate").addEventListener("click", async () => {
  const number = phoneEl.value.trim();
  const type = claimTypeEl.value;
  if(!number) return log("Enter number");
  log("Activating...", number, type);
  const r = await postJson("/api/activate", { number, type, repeats: 3 });
  log(r);
});
