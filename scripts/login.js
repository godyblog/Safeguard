// /scripts/login.js (module)
// Replaces earlier incomplete login.js. Keeps UI intact and only manipulates DOM minimally.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import {
  getAuth,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ------------------------
   Firebase config (yours)
   ------------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyB2IoBPgUnumshpcdg28AvbRMONdSYMEAU",
  authDomain: "safeguard-76e36.firebaseapp.com",
  projectId: "safeguard-76e36",
  storageBucket: "safeguard-76e36.firebasestorage.app",
  messagingSenderId: "639820898310",
  appId: "1:639820898310:web:58bddb80f77ee9c0b6a387",
  measurementId: "G-03Q9HBBQEF"
};

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { /* analytics may fail in some envs */ }

const auth = getAuth(app);
const db = getFirestore(app);

/* ------------------------
   DOM refs (from your HTML)
   ------------------------ */
const overlay = document.querySelector('.overlay');
const loginForm = document.getElementById('loginForm');
const resetSection = document.getElementById('resetSection');
const authSection = document.getElementById('authSection');
const forgotBtn = document.getElementById('forgotBtn');
const cancelBtn = document.getElementById('cancel');
const resetForm = document.getElementById('resetForm');
const authMessageDivId = 'authMessageDiv';
const resetMessageDivId = 'resetMessageDiv';

// login inputs
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');

// reset input (note: your HTML id is "rest-email")
const resetEmailInput = document.getElementById('rest-email');

// helper to find submit button in login form (your markup uses first button type=submit)
function getLoginSubmitButton() {
  return loginForm.querySelector('button[type=submit]');
}

/* ------------------------
   Small helpers
   ------------------------ */
function showOverlay(show = true) {
  if (!overlay) return;
  overlay.style.display = show ? 'flex' : 'none';
}

function showMessage(messageDivId, message, color = 'var(--accent)') {
  const el = document.getElementById(messageDivId);
  if (!el) return;
  el.textContent = message;
  el.style.borderLeftColor = color;
  el.style.color = color;
  el.style.display = 'block';
  el.style.opacity = '1';
}

function hideMessage(messageDivId) {
  const el = document.getElementById(messageDivId);
  if (!el) return;
  el.style.display = 'none';
  el.textContent = '';
}

function setButtonState(btn, disabled = false, text) {
  if (!btn) return;
  btn.disabled = disabled;
  if (text !== undefined) btn.textContent = text;
}

/* ------------------------
   Password visibility toggle (injected, non-destructive)
   - Adds a small toggle button next to password field but DOES NOT change classes.
   ------------------------ */
(function injectPasswordToggle() {
  try {
    const wrapper = loginPasswordInput && loginPasswordInput.parentElement;
    if (!wrapper) return;
    // create toggle button only once
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle password visibility');
    toggle.className = 'js-password-toggle';
    toggle.style.position = 'absolute';
    toggle.style.right = '1rem';
    toggle.style.top = '50%';
    toggle.style.transform = 'translateY(-50%)';
    toggle.style.background = 'transparent';
    toggle.style.border = 'none';
    toggle.style.color = 'var(--muted)';
    toggle.style.cursor = 'pointer';
    toggle.innerHTML = '<i class="fa-solid fa-eye"></i>';
    // ensure parent wrapper is positioned
    const parent = loginPasswordInput.closest('.input-icon-wrapper');
    if (parent) parent.style.position = parent.style.position || 'relative';
    parent.appendChild(toggle);
    toggle.addEventListener('click', () => {
      const isPwd = loginPasswordInput.type === 'password';
      loginPasswordInput.type = isPwd ? 'text' : 'password';
      toggle.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  } catch (e) {
    // do nothing — keep UI intact
    console.warn('Password toggle inject failed', e);
  }
})();

/* ------------------------
   Inline Phase-2 form injector
   - Creates and appends a small form under authSection.wrap area
   - Only shows when needed
   ------------------------ */
let phase2Container = null;
function createPhase2Form() {
  if (phase2Container) return phase2Container;

  const wrap = authSection.querySelector('.wrap');
  if (!wrap) return null;

  const container = document.createElement('div');
  container.className = 'phase2-wrap';
  container.style.marginTop = '1.25rem';
  container.style.padding = '1rem';
  container.style.borderRadius = '10px';
  container.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00))';
  container.style.border = '1px solid rgba(255,255,255,0.02)';

  container.innerHTML = `
    <h3 style="margin:0 0 .5rem 0;color:var(--accent)">Complete your profile</h3>
    <p style="margin:0 0 .75rem 0;color:var(--muted);font-size:.95rem">We need a few details to finish setting up your account.</p>
    <form id="phase2Form">
      <div class="group">
        <input id="phase2_fullName" type="text" placeholder=" " required />
        <label for="phase2_fullName" style="position:relative;top:-1.5rem;left:.5rem;color:var(--muted)">Full name</label>
      </div>
      <div class="group">
        <input id="phase2_phone" type="tel" placeholder=" " required />
        <label for="phase2_phone" style="position:relative;top:-1.5rem;left:.5rem;color:var(--muted)">Phone</label>
      </div>
      <div style="display:flex;gap:.5rem;flex-direction:column;margin-top:.75rem">
        <button id="phase2Save" type="submit" class="btn" style="background:var(--accent);color:#000;padding:.6rem;border-radius:10px">Save & Continue</button>
        <button id="phase2Skip" type="button" class="btn" style="background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--muted);padding:.6rem;border-radius:10px">Skip for now</button>
      </div>
      <div id="phase2Msg" style="margin-top:.6rem;display:none"></div>
    </form>
  `;
  wrap.appendChild(container);
  phase2Container = container;
  return container;
}

/* ------------------------
   Verify UI (in-page prompt)
   - Minimal unobtrusive UI appended below login form
   ------------------------ */
let verifyBox = null;
function createVerifyBox() {
  if (verifyBox) return verifyBox;
  const wrap = authSection.querySelector('.wrap');
  if (!wrap) return null;
  const box = document.createElement('div');
  box.className = 'verify-box';
  box.style.marginTop = '1rem';
  box.style.padding = '1rem';
  box.style.borderRadius = '10px';
  box.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00))';
  box.style.border = '1px solid rgba(255,255,255,0.02)';
  box.style.display = 'none';
  box.innerHTML = `
    <p style="margin:0 0 .5rem 0;color:var(--muted)">Your email is not verified.</p>
    <div style="display:flex;gap:.5rem">
      <button id="resendVerificationBtn" class="btn" style="background:var(--accent);color:#000;padding:.55rem;border-radius:10px">Resend verification email</button>
      <button id="checkVerifiedBtn" class="btn" style="background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--muted);padding:.55rem;border-radius:10px">I verified — check now</button>
    </div>
    <p id="verifyStatus" style="margin-top:.6rem;display:none"></p>
  `;
  wrap.appendChild(box);
  verifyBox = box;
  return box;
}

/* ------------------------
   ActionCodeSettings for verification link
   - Sends user to /email-verified.html on click (you must implement that page)
   - handleCodeInApp true recommended for mobile flows
   ------------------------ */
const actionCodeSettings = {
  url: `${location.origin}/email-verified.html`,
  handleCodeInApp: true
};

/* ------------------------
   Check Firestore user document exists
   ------------------------ */
async function userProfileExists(uid) {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (err) {
    console.error('userProfileExists error', err);
    return false;
  }
}

/* ------------------------
   Save profile to Firestore
   ------------------------ */
async function saveUserProfile(uid, { fullName, phone }) {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      fullName: fullName || '',
      phone: phone || '',
      email: auth.currentUser?.email || '',
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('saveUserProfile error', err);
    return false;
  }
}

/* ------------------------
   onAuthStateChanged: keep behavior friendly but do not redirect automatically
   - If user is already logged in, redirect to dashboard (your original behavior).
   - Otherwise do nothing.
   ------------------------ */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // If already logged-in and email verified, keep redirect as original behavior
    if (user.emailVerified) {
      sessionStorage.setItem('safeguard_user', JSON.stringify({ uid: user.uid, email: user.email }));
      // NOTE: you earlier used /user/dashboard.html; preserve that behavior
      window.location.href = '/user/dashboard.html';
    } else {
      // show verify box to let user resend / check verification
      const box = createVerifyBox();
      if (box) {
        box.style.display = 'block';
        const status = box.querySelector('#verifyStatus');
        status.style.display = 'none';
        const resendBtn = box.querySelector('#resendVerificationBtn');
        const checkBtn = box.querySelector('#checkVerifiedBtn');

        resendBtn.onclick = async () => {
          try {
            await sendEmailVerification(user, actionCodeSettings);
            status.style.display = 'block';
            status.style.color = 'var(--accent-2)';
            status.textContent = 'Verification sent — check your inbox.';
          } catch (err) {
            status.style.display = 'block';
            status.style.color = 'var(--danger)';
            status.textContent = (err && err.message) || 'Failed to send verification.';
            console.error(err);
          }
        };

        checkBtn.onclick = () => {
          // reload user to refresh emailVerified property
          user.reload().then(() => {
            if (user.emailVerified) {
              sessionStorage.setItem('safeguard_user', JSON.stringify({ uid: user.uid, email: user.email }));
              window.location.href = '/user/dashboard.html';
            } else {
              status.style.display = 'block';
              status.style.color = 'var(--danger)';
              status.textContent = 'Still not verified — please check your email.';
            }
          }).catch(err => {
            console.error(err);
            status.style.display = 'block';
            status.style.color = 'var(--danger)';
            status.textContent = 'Could not check verification. Try again.';
          });
        };
      }
    }
  }
});

/* ------------------------
   LOGIN flow with fetchSignInMethodsForEmail pre-check
   ------------------------ */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage(authMessageDivId);
  showOverlay(true);
  setButtonState(getLoginSubmitButton(), true, 'Please wait...');

  const email = (loginEmailInput.value || '').trim().toLowerCase();
  const password = (loginPasswordInput.value || '') || '';

  if (!email || !password) {
    showOverlay(false);
    showMessage(authMessageDivId, 'Enter email and password.', 'var(--danger)');
    setButtonState(getLoginSubmitButton(), false, 'Continue');
    return;
  }

  try {
    // 1) check methods for email
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length !== 0) {
      showMessage(authMessageDivId, 'No account found for that email. Please sign up.', 'var(--danger)');
      setButtonState(getLoginSubmitButton(), false, 'Continue');
      showOverlay(false);
      return;
    }

    // 2) sign in
    showMessage(authMessageDivId, 'Signing in...', 'var(--accent)');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    if (!user) {
      showMessage(authMessageDivId, 'Sign-in failed. Try again.', 'var(--danger)');
      setButtonState(getLoginSubmitButton(), false, 'Continue');
      showOverlay(false);
      return;
    }

    // 3) check emailVerified — block login if not verified
    if (!user.emailVerified) {
      // show verify box and do not redirect
      const box = createVerifyBox();
      if (box) {
        box.style.display = 'block';
        const status = box.querySelector('#verifyStatus');
        status.style.display = 'none';
        const resendBtn = box.querySelector('#resendVerificationBtn');
        const checkBtn = box.querySelector('#checkVerifiedBtn');

        resendBtn.onclick = async () => {
          try {
            await sendEmailVerification(user, actionCodeSettings);
            status.style.display = 'block';
            status.style.color = 'var(--accent-2)';
            status.textContent = 'Verification email sent. Check your mailbox.';
          } catch (err) {
            console.error(err);
            status.style.display = 'block';
            status.style.color = 'var(--danger)';
            status.textContent = 'Could not send verification. Try later.';
          }
        };

        checkBtn.onclick = async () => {
          try {
            await user.reload();
            if (user.emailVerified) {
              // continue below to check profile
              proceedAfterLogin(user);
            } else {
              status.style.display = 'block';
              status.style.color = 'var(--danger)';
              status.textContent = 'Email still not verified. Please check your inbox.';
            }
          } catch (err) {
            console.error(err);
            status.style.display = 'block';
            status.style.color = 'var(--danger)';
            status.textContent = 'Unable to check verification now.';
          }
        };
      }
      setButtonState(getLoginSubmitButton(), false, 'Continue');
      showOverlay(false);
      return;
    }

    // 4) email verified -> proceed to Firestore profile check & redirect in helper
    await proceedAfterLogin(user);

  } catch (err) {
    console.error('login error', err);
    const msg = err && err.message ? err.message : 'Sign-in failed.';
    showMessage(authMessageDivId, msg, 'var(--danger)');
    setButtonState(getLoginSubmitButton(), false, 'Continue');
    showOverlay(false);
  }
});

/* ------------------------
   After login: check profile doc, handle Phase-2 inline if missing
   ------------------------ */
async function proceedAfterLogin(user) {
  try {
    showOverlay(true);
    showMessage(authMessageDivId, 'Checking profile...', 'var(--accent)');
    const uid = user.uid;

    // Save session minimal object
    sessionStorage.setItem('safeguard_user', JSON.stringify({ uid, email: user.email }));

    const exists = await userProfileExists(uid);
    if (exists) {
      // profile exists — go to dashboard
      showMessage(authMessageDivId, 'Welcome back — redirecting…', 'var(--accent-2)');
      setTimeout(() => {
        window.location.href = `/user/dashboard.html?uid=${uid}`;
      }, 700);
      return;
    }

    // Profile missing — show phase2 inline form
    const container = createPhase2Form();
    if (!container) {
      // if cannot inject, fallback to redirect to a profile completion page (not present)
      showMessage(authMessageDivId, 'Profile missing; redirecting to complete profile...', 'var(--accent-2)');
      setTimeout(() => {
        window.location.href = `/complete-profile.html?uid=${uid}`;
      }, 700);
      return;
    }

    container.style.display = 'block';
    const phase2Form = container.querySelector('#phase2Form');
    const saveBtn = container.querySelector('#phase2Save');
    const skipBtn = container.querySelector('#phase2Skip');
    const phase2Msg = container.querySelector('#phase2Msg');

    phase2Form.onsubmit = async (ev) => {
      ev.preventDefault();
      phase2Msg.style.display = 'none';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const fullName = (document.getElementById('phase2_fullName').value || '').trim();
      const phone = (document.getElementById('phase2_phone').value || '').trim();

      if (!fullName || !phone) {
        phase2Msg.style.display = 'block';
        phase2Msg.style.color = 'var(--danger)';
        phase2Msg.textContent = 'Please fill in all fields.';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Continue';
        return;
      }

      const ok = await saveUserProfile(uid, { fullName, phone });
      if (ok) {
        phase2Msg.style.display = 'block';
        phase2Msg.style.color = 'var(--accent-2)';
        phase2Msg.textContent = 'Profile saved. Redirecting…';
        setTimeout(() => {
          window.location.href = `/user/dashboard.html?uid=${uid}`;
        }, 700);
      } else {
        phase2Msg.style.display = 'block';
        phase2Msg.style.color = 'var(--danger)';
        phase2Msg.textContent = 'Failed to save profile. Try again.';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Continue';
      }
    };

    skipBtn.onclick = () => {
      // user wants to skip — still redirect to dashboard (profile can be completed later)
      window.location.href = `/user/dashboard.html?uid=${uid}`;
    };

    showOverlay(false);

  } catch (err) {
    console.error('proceedAfterLogin error', err);
    showMessage(authMessageDivId, 'Error checking profile. Try again.', 'var(--danger)');
    showOverlay(false);
  }
}

/* ------------------------
   Password reset flow
   - uses resetForm with input id rest-email
   ------------------------ */
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage(resetMessageDivId);
  const email = (resetEmailInput.value || '').trim().toLowerCase();
  if (!email) {
    showMessage(resetMessageDivId, 'Enter your email.', 'var(--danger)');
    return;
  }

  showOverlay(true);
  setButtonState(document.getElementById('resetBtn'), true, 'Please wait...');
  try {
    // ensure account exists
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (!methods || methods.length === 0) {
      showMessage(resetMessageDivId, 'No account found for that email.', 'var(--danger)');
      setButtonState(document.getElementById('resetBtn'), false, 'Send Reset Email');
      showOverlay(false);
      return;
    }
    await sendPasswordResetEmail(auth, email, { url: `${location.origin}/` });
    showMessage(resetMessageDivId, 'Password reset email sent. Check your inbox.', 'var(--accent-2)');
  } catch (err) {
    console.error('reset error', err);
    showMessage(resetMessageDivId, (err && err.message) || 'Failed to send reset email.', 'var(--danger)');
  } finally {
    setButtonState(document.getElementById('resetBtn'), false, 'Send Reset Email');
    showOverlay(false);
  }
});

/* ------------------------
   Navigation between sections (forgot / cancel)
   Keep your existing UI behavior
   ------------------------ */
forgotBtn.addEventListener('click', () => {
  hideMessage(authMessageDivId);
  // show reset section
  authSection.style.display = 'none';
  resetSection.hidden = false;
  resetSection.style.display = 'block';
});

cancelBtn.addEventListener('click', () => {
  // back to login
  resetSection.hidden = true;
  resetSection.style.display = 'none';
  authSection.style.display = 'block';
  hideMessage(resetMessageDivId);
  hideMessage(authMessageDivId);
});

/* ------------------------
   Defensive: ensure copyright year shown
   ------------------------ */
const yEl = document.getElementById('copyrightYear');
if (yEl) yEl.textContent = new Date().getFullYear();