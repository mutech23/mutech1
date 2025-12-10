// app.js — MUTECH demo logic
// Admin credentials (as requested)
const ADMIN_CREDENTIALS = { email: 'declantessa@gmail.com', password: 'BAMIDELE!1' };

// Storage keys & helpers
const KEYS = {
  USERS: 'mutech_users',
  ACTIVITY: 'mutech_activity',
  PENDING_DEPOSITS: 'mutech_pending_deposits',
  PENDING_WITHDRAWS: 'mutech_pending_withdrawals',
  LOGGED_IN: 'mutech_logged_in',
  IS_ADMIN: 'mutech_is_admin'
};
const safeParse = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const saveKey = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// Ensure defaults
if (!localStorage.getItem(KEYS.USERS)) saveKey(KEYS.USERS, {});
if (!localStorage.getItem(KEYS.ACTIVITY)) saveKey(KEYS.ACTIVITY, []);
if (!localStorage.getItem(KEYS.PENDING_DEPOSITS)) saveKey(KEYS.PENDING_DEPOSITS, []);
if (!localStorage.getItem(KEYS.PENDING_WITHDRAWS)) saveKey(KEYS.PENDING_WITHDRAWS, []);

// DOM helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const el = (t, props = {}) => Object.assign(document.createElement(t), props);

// Elements
const acctNumSpan = $('#acctNum');
const copyAcctBtn = $('#copyAcctBtn');
const copyMsg = $('#copyMsg');
const openDepositModalButtons = [$('#open-deposit-modal'), $('#deposit-btn')];

// Modals & forms
const loginModal = $('#login-modal'), registerModal = $('#register-modal'), depositModal = $('#deposit-modal');
const withdrawModal = $('#withdraw-modal'), investModal = $('#invest-modal'), collectModal = $('#collect-modal');
const referralModal = $('#referral-modal');

// Login/register forms
const loginForm = $('#login-form'), registerForm = $('#register-form');
const loginBtn = $('#login-btn'), registerBtn = $('#register-btn');
const closeLogin = $('#close-login'), closeRegister = $('#close-register');
const switchToRegister = $('#switch-to-register'), switchToLogin = $('#switch-to-login');

// Deposit form elements
const depositAmountInput = $('#deposit-amount'), depositProofInput = $('#deposit-proof'), depositPreview = $('#deposit-preview');
const confirmDepositBtn = $('#confirm-deposit'), cancelDepositBtn = $('#cancel-deposit');

// Withdraw form
const withdrawForm = $('#withdraw-form');

// Invest form
const investPlanSelect = $('#invest-plan-select'), investAmountInput = $('#invest-amount'), confirmInvestBtn = $('#confirm-invest');

// User UI pieces
const authButtons = $('#auth-buttons'), userMenu = $('#user-menu'), usernameDisplay = $('#username-display'), logoutBtn = $('#logout-btn');
const dashboard = $('#dashboard'), landing = $('#landing'), adminPanel = $('#admin-panel'), adminPanelBtn = $('#admin-panel-btn');
const walletBalance = $('#wallet-balance'), activeInvestments = $('#active-investments'), referralEarnings = $('#referral-earnings');
const investmentHistory = $('#investment-history');

// Admin areas
const adminTotalUsers = $('#admin-total-users'), adminTotalInvestments = $('#admin-total-investments');
const adminPendingDeposits = $('#admin-pending-deposits'), adminPendingWithdrawals = $('#admin-pending-withdrawals');
const adminActivityLog = $('#admin-activity-log'), adminPendingDepositsList = $('#admin-pending-deposits-list'), adminPendingWithdrawalsList = $('#admin-pending-withdrawals-list');

// Initial UI wiring
acctNumSpan.textContent = '2014613557';

// Copy account number
copyAcctBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(acctNumSpan.textContent);
    copyMsg.style.display = 'block';
    setTimeout(() => copyMsg.style.display = 'none', 1500);
  } catch (e) { alert('Copy failed'); }
});

// Open deposit modal (two buttons)
openDepositModalButtons.forEach(btn => { if (btn) btn.addEventListener('click', () => depositModal.classList.remove('hidden')); });

// Modal close handlers
closeLogin?.addEventListener('click', () => loginModal.classList.add('hidden'));
closeRegister?.addEventListener('click', () => registerModal.classList.add('hidden'));
$('#close-deposit')?.addEventListener('click', () => depositModal.classList.add('hidden'));
$('#close-withdraw')?.addEventListener('click', () => withdrawModal.classList.add('hidden'));
$('#close-invest')?.addEventListener('click', () => investModal.classList.add('hidden'));
$('#close-collect')?.addEventListener('click', () => collectModal.classList.add('hidden'));
$('#close-referral')?.addEventListener('click', () => referralModal.classList.add('hidden'));

// Switch login/register
switchToRegister?.addEventListener('click', e => { e.preventDefault(); loginModal.classList.add('hidden'); registerModal.classList.remove('hidden'); });
switchToLogin?.addEventListener('click', e => { e.preventDefault(); registerModal.classList.add('hidden'); loginModal.classList.remove('hidden'); });

// Auth open
loginBtn?.addEventListener('click', () => loginModal.classList.remove('hidden'));
registerBtn?.addEventListener('click', () => registerModal.classList.remove('hidden'));

// Register handler
registerForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = $('#register-username').value.trim().toLowerCase();
  const password = $('#register-password').value;
  const referralCode = $('#referral-code').value.trim();

  if (!username || !password) return alert('Complete form');
  const users = safeParse(KEYS.USERS, {});
  if (users[username]) return alert('User exists');

  const userReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  users[username] = { username, password, referralCode: userReferralCode, wallet: 1000, activeInvestments: [], referralEarnings: 0, referredBy: referralCode || null, deposited:false };
  // referral bonus
  if (referralCode) {
    const referrer = Object.values(users).find(u => u.referralCode === referralCode);
    if (referrer) { referrer.referralEarnings = (referrer.referralEarnings||0) + 200; users[referrer.username] = referrer; users[username].wallet += 200; }
  }
  saveKey(KEYS.USERS, users);
  localStorage.setItem(KEYS.LOGGED_IN, username);
  localStorage.setItem(KEYS.IS_ADMIN, 'false');
  logActivity(username, 'register', 0, 'completed');
  registerModal.classList.add('hidden'); registerForm.reset();
  loadDashboard();
  alert(`Welcome ${username}! ₦1,000 credited.`);
});

// Login handler
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = $('#login-username').value.trim().toLowerCase();
  const password = $('#login-password').value;

  // Admin check
  if (username === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem(KEYS.LOGGED_IN, username); localStorage.setItem(KEYS.IS_ADMIN, 'true');
    loginModal.classList.add('hidden'); loginForm.reset(); loadDashboard(); return;
  }

  const users = safeParse(KEYS.USERS, {});
  if (users[username] && users[username].password === password) {
    localStorage.setItem(KEYS.LOGGED_IN, username); localStorage.setItem(KEYS.IS_ADMIN, 'false');
    logActivity(username, 'login', 0, 'completed');
    loginModal.classList.add('hidden'); loginForm.reset(); loadDashboard();
  } else alert('Invalid credentials');
});

// Load dashboard / admin
function loadDashboard() {
  const loggedInUser = localStorage.getItem(KEYS.LOGGED_IN);
  const isAdmin = localStorage.getItem(KEYS.IS_ADMIN) === 'true';
  if (!loggedInUser) return;

  authButtons.classList.add('hidden'); userMenu.classList.remove('hidden');
  usernameDisplay.textContent = isAdmin ? 'Admin' : loggedInUser;

  if (isAdmin) { adminPanel.classList.remove('hidden'); dashboard.classList.add('hidden'); adminPanelBtn.classList.remove('hidden'); renderAdminPanel(); }
  else { dashboard.classList.remove('hidden'); adminPanel.classList.add('hidden'); adminPanelBtn.classList.add('hidden'); updateUserDashboard(); }
}

// Update user dashboard
function updateUserDashboard() {
  const username = localStorage.getItem(KEYS.LOGGED_IN);
  const users = safeParse(KEYS.USERS, {});
  const user = users[username];
  if (!user) return;
  walletBalance.textContent = `₦${(user.wallet||0).toLocaleString()}`;
  const totalInvest = (user.activeInvestments||[]).reduce((s,i)=>s+(i.amount||0),0);
  activeInvestments.textContent = `₦${totalInvest.toLocaleString()}`; referralEarnings.textContent = `₦${(user.referralEarnings||0).toLocaleString()}`;
  // render investments
  investmentHistory.innerHTML = '';
  (user.activeInvestments || []).forEach((inv, idx) => {
    const row = el('tr'); row.innerHTML = `<td>${inv.plan}</td><td>₦${inv.amount.toLocaleString()}</td><td>${inv.roi}%</td><td>${inv.collected ? 'Collected':'Active'}</td><td>${inv.date}</td><td>${inv.collected?'-':'-'}</td>`;
    investmentHistory.appendChild(row);
  });
}

// Deposit: submit proof
confirmDepositBtn?.addEventListener('click', () => {
  const amount = Number(depositAmountInput.value || 0);
  const proofFile = depositProofInput.files[0];
  if (!amount || amount <= 0) return alert('Enter valid amount');
  if (!proofFile) return alert('Upload proof image');
  const username = localStorage.getItem(KEYS.LOGGED_IN) || 'guest';
  const pending = safeParse(KEYS.PENDING_DEPOSITS, []);
  const reader = new FileReader();
  reader.onload = function(e) {
    pending.push({ username, amount, date: new Date().toLocaleString(), proofName: proofFile.name, proofData: e.target.result, bank: 'Kuda Bank', account: acctNumSpan.textContent });
    saveKey(KEYS.PENDING_DEPOSITS, pending);
    // log activity
    const act = safeParse(KEYS.ACTIVITY, []); act.push({ username, action:'deposit', amount, status:'pending', date:new Date().toLocaleString() }); saveKey(KEYS.ACTIVITY, act);
    depositModal.classList.add('hidden'); depositAmountInput.value=''; depositProofInput.value=''; depositPreview.innerHTML='';
    renderAdminPanel();
    alert('Deposit submitted — pending admin approval.');
  };
  reader.readAsDataURL(proofFile);
});
cancelDepositBtn?.addEventListener('click', () => { depositModal.classList.add('hidden'); depositPreview.innerHTML=''; });

// preview selected proof image
depositProofInput?.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) { depositPreview.innerHTML=''; return; }
  const reader = new FileReader();
  reader.onload = function(ev) {
    depositPreview.innerHTML = `<img src="${ev.target.result}" alt="proof" style="max-width:160px;border-radius:6px;border:1px solid rgba(255,255,255,0.06)"/>`;
  };
  reader.readAsDataURL(f);
});

// Withdraw: request and push to pending withdraws
$('#withdraw-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = Number($('#withdraw-amount').value || 0);
  const bankName = $('#bank-name').value.trim();
  const accountNumber = $('#account-number-input').value.trim();
  const accountName = $('#account-name').value.trim();
  if (amount < 1700) return alert('Minimum withdrawal is ₦1,700');
  const username = localStorage.getItem(KEYS.LOGGED_IN);
  if (!username) return alert('Login required');
  const users = safeParse(KEYS.USERS, {});
  const user = users[username];
  if (!user || amount > (user.wallet||0)) return alert('Insufficient funds');
  // immediately deduct in demo
  user.wallet = (user.wallet||0) - amount; users[username] = user; saveKey(KEYS.USERS, users);
  const pendingW = safeParse(KEYS.PENDING_WITHDRAWS, []); pendingW.push({ username, amount, bankName, accountNumber, accountName, date:new Date().toLocaleString() }); saveKey(KEYS.PENDING_WITHDRAWS, pendingW);
  const act = safeParse(KEYS.ACTIVITY, []); act.push({ username, action:'withdrawal', amount, status:'pending', date:new Date().toLocaleString() }); saveKey(KEYS.ACTIVITY, act);
  $('#withdraw-modal').classList.add('hidden'); updateUserDashboard(); renderAdminPanel(); alert('Withdrawal requested — pending admin approval.');
});

// Invest: basic local invest
confirmInvestBtn?.addEventListener('click', () => {
  const amount = Number(investAmountInput.value || 0), plan = investPlanSelect.value;
  const planDetails = { starter:{min:1000,max:10000,roi:20}, premium:{min:10000,max:50000,roi:50}, executive:{min:50000,max:500000,roi:100} };
  const details = planDetails[plan];
  if (!details) return alert('Choose a plan');
  if (amount < details.min || amount > details.max) return alert(`Amount must be between ₦${details.min.toLocaleString()} and ₦${details.max.toLocaleString()}`);
  const username = localStorage.getItem(KEYS.LOGGED_IN);
  if (!username) return alert('Login required');
  const users = safeParse(KEYS.USERS, {}); const user = users[username];
  if (!user || amount > (user.wallet||0)) return alert('Insufficient funds');
  user.wallet -= amount; user.activeInvestments = user.activeInvestments || []; user.activeInvestments.push({ plan, amount, roi: details.roi, date: new Date().toLocaleDateString(), collected:false });
  users[username] = user; saveKey(KEYS.USERS, users); logActivity(username, 'investment', amount, 'completed'); investModal.classList.add('hidden'); updateUserDashboard(); alert(`Invested ₦${amount.toLocaleString()}`);
});

// Collect profit (button wired via delegation in updateUserDashboard if needed)
window.collectProfit = (index) => {
  const username = localStorage.getItem(KEYS.LOGGED_IN);
  if (!username) return alert('Login required');
  const users = safeParse(KEYS.USERS, {}); const user = users[username];
  if (!user || !user.activeInvestments || !user.activeInvestments[index]) return alert('Invalid investment');
  const inv = user.activeInvestments[index];
  const profit = Math.floor((inv.amount * inv.roi)/100); const total = inv.amount + profit;
  $('#collect-details').innerHTML = `<div>Plan: ${inv.plan}</div><div>Principal: ₦${inv.amount.toLocaleString()}</div><div>Profit: ₦${profit.toLocaleString()}</div><div><strong>Total: ₦${total.toLocaleString()}</strong></div>`;
  collectModal.classList.remove('hidden');
  $('#confirm-collect').onclick = () => {
    user.wallet = (user.wallet||0) + total; inv.collected = true; users[username] = user; saveKey(KEYS.USERS, users); logActivity(username, 'profit_collection', total, 'completed'); collectModal.classList.add('hidden'); updateUserDashboard(); alert(`Collected ₦${total.toLocaleString()}`);
  };
};

// Referral
$('#referral-btn')?.addEventListener('click', () => {
  const username = localStorage.getItem(KEYS.LOGGED_IN);
  if (!username) return alert('Login required');
  const users = safeParse(KEYS.USERS, {}); const user = users[username];
  $('#referral-link').value = `${window.location.origin}?ref=${user.referralCode}`;
  $('#referral-earnings-modal').textContent = (user.referralEarnings||0).toLocaleString();
  const referralCount = Object.values(users).filter(u => u.referredBy === user.referralCode).length;
  $('#referral-count').textContent = referralCount;
  referralModal.classList.remove('hidden');
});
$('#copy-referral')?.addEventListener('click', () => { const input = $('#referral-link'); input.select(); document.execCommand('copy'); alert('Referral copied'); });

// Admin rendering & actions
function renderAdminPanel() {
  const users = safeParse(KEYS.USERS, {}), activities = safeParse(KEYS.ACTIVITY, []), pendingDeposits = safeParse(KEYS.PENDING_DEPOSITS, []), pendingWithdrawals = safeParse(KEYS.PENDING_WITHDRAWS, []);
  adminTotalUsers.textContent = Object.keys(users).length;
  const totalInv = Object.values(users).reduce((sum,u)=>sum+(u.activeInvestments||[]).reduce((s,i)=>s+(i.amount||0),0),0);
  adminTotalInvestments.textContent = totalInv.toLocaleString();
  adminPendingDeposits.textContent = pendingDeposits.length;
  adminPendingWithdrawals.textContent = pendingWithdrawals.length;

  // activity
  adminActivityLog.innerHTML = ''; activities.slice(-20).reverse().forEach(act => {
    const tr = el('tr'); tr.innerHTML = `<td>${act.username}</td><td>${act.action}</td><td>₦${act.amount.toLocaleString()}</td><td>${act.status}</td><td>${act.date}</td>`; adminActivityLog.appendChild(tr);
  });

  // pending deposits list
  adminPendingDepositsList.innerHTML = '';
  pendingDeposits.forEach((dep, idx) => {
    const div = el('div'); div.className = 'card'; div.innerHTML = `<strong>${dep.username}</strong><div>₦${dep.amount.toLocaleString()}</div><div class="muted">${dep.date}</div><div style="margin-top:8px"><img src="${dep.proofData}" style="max-width:200px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);display:block;margin-bottom:8px"/><div style="display:flex;gap:8px"><button data-idx="${idx}" class="approve-dep btn btn-primary">Approve</button><button data-idx="${idx}" class="reject-dep btn btn-outline">Reject</button></div></div>`; adminPendingDepositsList.appendChild(div);
  });

  // pending withdrawals
  adminPendingWithdrawalsList.innerHTML = '';
  pendingWithdrawals.forEach((wit, idx) => {
    const div = el('div'); div.className = 'card'; div.innerHTML = `<strong>${wit.username}</strong><div>₦${wit.amount.toLocaleString()} — ${wit.bankName} ${wit.accountNumber}</div><div class="muted">${wit.date}</div><div style="margin-top:8px"><button data-idx="${idx}" class="approve-w btn btn-primary">Approve</button></div>`; adminPendingWithdrawalsList.appendChild(div);
  });
}

// delegate admin action clicks
document.addEventListener('click', (e) => {
  const aprDep = e.target.closest('.approve-dep');
  const rejDep = e.target.closest('.reject-dep');
  const aprW = e.target.closest('.approve-w');

  if (aprDep) {
    const idx = Number(aprDep.dataset.idx);
    const pend = safeParse(KEYS.PENDING_DEPOSITS, []);
    const dep = pend[idx]; if (!dep) return alert('Not found');
    const users = safeParse(KEYS.USERS, {}); users[dep.username] = users[dep.username] || { username:dep.username, password:'', wallet:0, activeInvestments:[], referralEarnings:0 };
    users[dep.username].wallet = (users[dep.username].wallet||0) + dep.amount; users[dep.username].deposited = true; saveKey(KEYS.USERS, users);
    pend.splice(idx,1); saveKey(KEYS.PENDING_DEPOSITS, pend);
    logActivity(dep.username, 'deposit_approved', dep.amount, 'completed'); renderAdminPanel(); alert('Deposit approved');
  }

  if (rejDep) {
    const idx = Number(rejDep.dataset.idx);
    const pend = safeParse(KEYS.PENDING_DEPOSITS, []); pend.splice(idx,1); saveKey(KEYS.PENDING_DEPOSITS, pend); renderAdminPanel(); alert('Deposit rejected');
  }

  if (aprW) {
    const idx = Number(aprW.dataset.idx);
    const pendW = safeParse(KEYS.PENDING_WITHDRAWS, []);
    const wit = pendW[idx]; if (!wit) return alert('Not found');
    pendW.splice(idx,1); saveKey(KEYS.PENDING_WITHDRAWS, pendW);
    logActivity(wit.username, 'withdrawal_approved', wit.amount, 'completed'); renderAdminPanel(); alert('Withdrawal approved (demo)');
  }
});

// activity logger
function logActivity(username, action, amount=0, status='pending') {
  const acts = safeParse(KEYS.ACTIVITY, []); acts.push({ username, action, amount, status, date: new Date().toLocaleString() }); saveKey(KEYS.ACTIVITY, acts);
}

// logout
logoutBtn?.addEventListener('click', () => {
  localStorage.setItem(KEYS.LOGGED_IN, ''); localStorage.setItem(KEYS.IS_ADMIN, 'false');
  authButtons.classList.remove('hidden'); userMenu.classList.add('hidden'); dashboard.classList.add('hidden'); adminPanel.classList.add('hidden'); landing.classList.remove('hidden');
  location.reload();
});

// Initial load attempt (if already logged in)
(function init() {
  // wire quick open buttons
  $('#deposit-btn')?.addEventListener('click', () => depositModal.classList.remove('hidden'));
  $('#invest-btn')?.addEventListener('click', () => investModal.classList.remove('hidden'));
  $('#referral-btn')?.addEventListener('click', () => referralModal.classList.remove('hidden'));

  // if logged in
  const logged = localStorage.getItem(KEYS.LOGGED_IN);
  if (logged) loadDashboard();

  // guarded three.js background (small, low cost)
  try {
    if (window.THREE) {
      const canvas = document.getElementById('bg-canvas'), scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000); camera.position.z = 6;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      const count = 1600; const geometry = new THREE.BufferGeometry(); const positions = new Float32Array(count*3);
      for (let i=0;i<positions.length;i++) positions[i] = (Math.random()-0.5) * 12;
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ size: 0.02, color: 0x667eea, transparent: true, opacity: 0.85 });
      const points = new THREE.Points(geometry, material); scene.add(points);
      (function animate(){ requestAnimationFrame(animate); points.rotation.x += 0.0006; points.rotation.y += 0.0008; renderer.render(scene,camera); })();
      window.addEventListener('resize', () => { camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
    }
  } catch (e) { console.warn('particles failed', e); }
})();
