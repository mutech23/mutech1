/* app.js
   Full client-side app for MUTECH Investment Platform
   - Default admin: declantessa@gmail.com / BAMIDELE!1
   - Uses localStorage to persist users, sessions, pending items
   - Implements deposits (with proof upload), withdrawals, investments (all admin-approval driven)
   - Referral system: 5% of approved investment credited to referrer
   - Min investment = ₦5000, Min withdrawal = ₦8000
   - Admin panel shows all users (with passwords), pending lists, approve/reject actions
   - Modal logic, copy-to-clipboard, preview proofs
*/

/* --------- Configuration & Utilities --------- */
const CONFIG = {
  ADMIN_EMAIL: "declantessa@gmail.com",
  ADMIN_PASS: "BAMIDELE!1",
  MIN_INVEST: 5000,
  MIN_WITHDRAW: 8000,
  REFERRAL_PERCENT: 0.05, // 5% of approved investment
  APP_PREFIX: "mutech_", // prefix for localStorage keys
};

const LS = {
  users: `${CONFIG.APP_PREFIX}users`, // array of user objects
  session: `${CONFIG.APP_PREFIX}session`, // current logged-in email
  deposits: `${CONFIG.APP_PREFIX}deposits`,
  withdrawals: `${CONFIG.APP_PREFIX}withdrawals`,
  investments: `${CONFIG.APP_PREFIX}investments`,
};

/* Simple helpers */
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));
const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

/* --------- Local Storage Layer --------- */
function read(key, def = null) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : def;
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function ensureInit() {
  if (!read(LS.users)) {
    // create admin user by default (role = admin)
    const adminUser = {
      id: uid(),
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASS,
      role: "admin",
      wallet: 0,
      referralCode: "ADMIN", // admin referral code
      referredBy: null,
      referralEarnings: 0,
      referralCount: 0,
      registeredAt: new Date().toISOString(),
    };
    write(LS.users, [adminUser]);
  }
  if (!read(LS.deposits)) write(LS.deposits, []);
  if (!read(LS.withdrawals)) write(LS.withdrawals, []);
  if (!read(LS.investments)) write(LS.investments, []);
  if (!read(LS.session)) write(LS.session, null);
}
ensureInit();

/* --------- App State & Current Session --------- */
function currentSession() {
  return read(LS.session);
}
function setSession(email) {
  write(LS.session, email);
}
function clearSession() {
  write(LS.session, null);
}

/* --------- Data Accessors --------- */
function allUsers() {
  return read(LS.users) || [];
}
function saveUsers(arr) {
  write(LS.users, arr);
}
function findUserByEmail(email) {
  return allUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase());
}
function addUser(userObj) {
  const u = allUsers();
  u.push(userObj);
  saveUsers(u);
}
function allDeposits() {
  return read(LS.deposits) || [];
}
function saveDeposits(list) {
  write(LS.deposits, list);
}
function allWithdrawals() {
  return read(LS.withdrawals) || [];
}
function saveWithdrawals(list) {
  write(LS.withdrawals, list);
}
function allInvestments() {
  return read(LS.investments) || [];
}
function saveInvestments(list) {
  write(LS.investments, list);
}

/* --------- DOM Elements --------- */
/* navigation & auth */
const loginBtn = qs("#loginBtn");
const registerBtn = qs("#registerBtn");
const loginModal = qs("#loginModal");
const registerModal = qs("#registerModal");
const depositModal = qs("#depositModal");
const withdrawModal = qs("#withdrawModal");
const investModal = qs("#investModal");
const referralModal = qs("#referralModal");
const themeToggle = qs("#themeToggle");

/* auth forms */
const loginForm = qs("#loginForm");
const registerForm = qs("#registerForm");
const loginEmail = qs("#loginEmail");
const loginPassword = qs("#loginPassword");
const registerEmail = qs("#registerEmail");
const registerPassword = qs("#registerPassword");
const referralCodeInput = qs("#referralCode");

/* landing & dashboard */
const landingSection = qs("#landingSection");
const dashboardSection = qs("#dashboardSection");
const adminSection = qs("#adminSection");
const authButtons = qs("#authButtons");
const userInfo = qs("#userInfo");
const usernameSpan = qs("#username");
const logoutBtn = qs("#logoutBtn");
const adminBtn = qs("#adminBtn");

/* deposit interactions */
const copyAccountBtn = qs("#copyAccountBtn");
const copyMsg = qs("#copyMsg");
const submitProofBtn = qs("#submitDepositBtn");
const depositProofInput = qs("#depositProof");
const depositAmountInput = qs("#depositAmount");
const proofPreview = qs("#proofPreview");

/* dashboard actions */
const walletBalanceEl = qs("#walletBalance");
const activeInvestmentsEl = qs("#activeInvestments");
const referralEarningsEl = qs("#referralEarnings");
const depositBtn = qs("#depositBtn");
const withdrawBtn = qs("#withdrawBtn");
const investBtn = qs("#investBtn");
const referralBtn = qs("#referralBtn");
const investmentHistoryTbody = qs("#investmentHistory");

/* modals forms */
const withdrawForm = qs("#withdrawForm");
const investForm = qs("#investForm");
const investPlanSelect = qs("#investPlan");
const investAmountInput = qs("#investAmount");

/* referral modal */
const referralLinkInput = qs("#referralLink");
const copyReferralBtn = qs("#copyReferralBtn");
const referralTotalEl = qs("#referralTotal");
const referralCountEl = qs("#referralCount");

/* admin elements */
const totalUsersEl = qs("#totalUsers");
const totalInvestmentsEl = qs("#totalInvestments");
const pendingDepositsCountEl = qs("#pendingDepositsCount");
const pendingDepositsList = qs("#pendingDepositsList");
const pendingWithdrawalsList = qs("#pendingWithdrawalsList");
const pendingInvestmentsList = qs("#pendingInvestmentsList");
const usersListEl = qs("#usersList");

/* misc */
const accountNumberSpan = qs("#accountNumber");
const switchToRegisterLink = qs("#switchToRegister");
const switchToLoginLink = qs("#switchToLogin");

/* modal close buttons (data-modal attr) */
qsa(".close-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const modalId = btn.dataset.modal;
    if (modalId) closeModalById(modalId);
    else btn.closest(".modal")?.classList.remove("open");
  });
});

/* open plan buttons on landing */
qsa(".plan-btn").forEach(b => {
  b.addEventListener("click", () => {
    const plan = b.dataset.plan;
    openModal("investModal");
    // pre-select plan
    investPlanSelect.value = plan;
  });
});

/* --------- Modal Utility --------- */
function openModal(id) {
  const el = qs(`#${id}`);
  if (!el) return;
  el.style.display = "flex";
  setTimeout(() => el.classList.add("open"), 10);
}
function closeModalById(id) {
  const el = qs(`#${id}`);
  if (!el) return;
  el.classList.remove("open");
  setTimeout(() => {
    el.style.display = "none";
    // if deposit proof form, clear preview
    if (id === "depositModal") {
      depositProofInput.value = "";
      proofPreview.innerHTML = "";
      depositAmountInput.value = "";
    }
    if (id === "registerModal") {
      registerPassword.value = "";
      registerEmail.value = "";
      referralCodeInput.value = "";
    }
    if (id === "loginModal") {
      loginEmail.value = "";
      loginPassword.value = "";
    }
  }, 200);
}
/* close modals when clicking outside content */
qsa(".modal").forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
      setTimeout(() => modal.style.display = "none", 200);
    }
  });
});

/* --------- Theme Toggle (simple) --------- */
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  themeToggle.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
});

/* --------- Copy Account Number --------- */
copyAccountBtn.addEventListener("click", async () => {
  try {
    const txt = accountNumberSpan.textContent || "";
    await navigator.clipboard.writeText(txt);
    copyMsg.classList.remove("hidden");
    setTimeout(() => copyMsg.classList.add("hidden"), 2000);
  } catch (e) {
    alert("Unable to copy automatically. Select and copy the number manually.");
  }
});

/* --------- Preview Deposit Proof Image --------- */
depositProofInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) {
    proofPreview.innerHTML = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = function(evt) {
    proofPreview.innerHTML = `<img src="${evt.target.result}" alt="proof" style="max-width:100%; border-radius:8px; border:1px solid #ddd;"/>`;
    // store preview dataURL temporarily on input element dataset for submit
    depositProofInput.dataset.preview = evt.target.result;
  };
  reader.readAsDataURL(file);
});

/* --------- Registration --------- */
registerBtn.addEventListener("click", () => openModal("registerModal"));
switchToLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  closeModalById("registerModal");
  openModal("loginModal");
});
switchToRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  closeModalById("loginModal");
  openModal("registerModal");
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = registerEmail.value.trim().toLowerCase();
  const password = registerPassword.value;
  const refCode = referralCodeInput.value && referralCodeInput.value.trim();

  if (!email || !password) return alert("Please provide email and password.");

  if (findUserByEmail(email)) {
    return alert("An account with this email already exists. Please login.");
  }

  // create user & generate a referral code
  const newUser = {
    id: uid(),
    email,
    password,
    role: "user",
    wallet: 0,
    referralCode: email.split("@")[0] + "_" + Math.random().toString(36).slice(2,6).toUpperCase(),
    referredBy: null,
    referralEarnings: 0,
    referralCount: 0,
    registeredAt: new Date().toISOString(),
  };

  // If referral code provided, find referrer
  if (refCode) {
    const referrer = allUsers().find(u => u.referralCode && u.referralCode.toLowerCase() === refCode.toLowerCase());
    if (referrer) {
      newUser.referredBy = referrer.email;
      // increment referral count (this counts registrations, actual earnings credited on approved investments)
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      saveUsers(allUsers().map(u => u.email === referrer.email ? referrer : u));
    } // else: silently ignore invalid code
  }

  addUser(newUser);
  alert("Registration successful. Please login.");
  closeModalById("registerModal");
  openModal("loginModal");
});

/* --------- Login & Logout --------- */
loginBtn.addEventListener("click", () => openModal("loginModal"));

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value;
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return alert("Invalid credentials.");
  }
  setSession(user.email);
  refreshUI();
  closeModalById("loginModal");
});

/* Logout */
logoutBtn.addEventListener("click", () => {
  clearSession();
  refreshUI();
});

/* --------- Deposit Flow (submit proof) --------- */
depositBtn.addEventListener("click", () => {
  if (!currentSession()) {
    openModal("loginModal");
    return;
  }
  openModal("depositModal");
});

submitProofBtn.addEventListener("click", () => {
  const sessionEmail = currentSession();
  if (!sessionEmail) return alert("Please login to submit deposit proof.");

  const amount = Number(depositAmountInput.value);
  const preview = depositProofInput.dataset.preview;

  if (!amount || amount <= 0) return alert("Please enter a valid deposit amount.");
  if (!preview) return alert("Please upload a proof image.");

  const deposit = {
    id: uid(),
    userEmail: sessionEmail,
    amount,
    proofDataUrl: preview,
    status: "pending", // pending / approved / rejected
    createdAt: new Date().toISOString()
  };

  const deps = allDeposits();
  deps.unshift(deposit);
  saveDeposits(deps);

  alert("Deposit proof submitted. Admin will verify and approve.");
  closeModalById("depositModal");
  renderAdminPendingLists();
});

/* --------- Withdrawal Flow --------- */
withdrawBtn.addEventListener("click", () => {
  if (!currentSession()) {
    openModal("loginModal");
    return;
  }
  openModal("withdrawModal");
});

withdrawForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const sessionEmail = currentSession();
  if (!sessionEmail) return alert("Please login first.");

  const amount = Number(qs("#withdrawAmount").value);
  const bankName = qs("#bankName").value.trim();
  const accountNum = qs("#accountNum").value.trim();
  const accountName = qs("#accountName").value.trim();

  if (!amount || amount < CONFIG.MIN_WITHDRAW) {
    return alert(`Minimum withdrawal is ${money(CONFIG.MIN_WITHDRAW)}.`);
  }
  if (!bankName || !accountNum || !accountName) return alert("Please complete bank details.");

  const withdrawals = allWithdrawals();
  withdrawals.unshift({
    id: uid(),
    userEmail: sessionEmail,
    amount,
    bankName,
    accountNum,
    accountName,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  saveWithdrawals(withdrawals);
  alert("Withdrawal request submitted. Admin will process it.");
  closeModalById("withdrawModal");
  renderAdminPendingLists();
});

/* --------- Investment Flow (user -> pending -> admin) --------- */
investBtn.addEventListener("click", () => {
  if (!currentSession()) {
    openModal("loginModal");
    return;
  }
  openModal("investModal");
});

investForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const sessionEmail = currentSession();
  if (!sessionEmail) return alert("Please login.");

  const plan = investPlanSelect.value;
  const amount = Number(investAmountInput.value);

  if (!amount || amount < CONFIG.MIN_INVEST) {
    return alert(`Minimum investment is ${money(CONFIG.MIN_INVEST)}.`);
  }

  // create pending investment
  const defROI = (plan === "starter") ? 0.20 : (plan === "premium") ? 0.50 : 1.0;
  const investment = {
    id: uid(),
    userEmail: sessionEmail,
    plan,
    amount,
    roiPercent: defROI * 100,
    expectedReturn: Math.round(amount * (1 + defROI)),
    status: "pending", // pending / approved / rejected / active / completed
    createdAt: new Date().toISOString()
  };

  const invs = allInvestments();
  invs.unshift(investment);
  saveInvestments(invs);

  alert("Investment request sent for admin approval.");
  closeModalById("investModal");
  renderAdminPendingLists();
});

/* --------- Referral Modal & Copying --------- */
referralBtn.addEventListener("click", () => {
  if (!currentSession()) {
    openModal("loginModal");
    return;
  }
  const user = findUserByEmail(currentSession());
  if (!user) return;
  referralLinkInput.value = `${location.origin}${location.pathname}?ref=${user.referralCode}`;
  referralTotalEl.textContent = money(user.referralEarnings || 0);
  referralCountEl.textContent = user.referralCount || 0;
  openModal("referralModal");
});

copyReferralBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(referralLinkInput.value);
    copyReferralBtn.textContent = "Copied ✓";
    setTimeout(() => (copyReferralBtn.textContent = "Copy Link"), 1500);
  } catch {
    alert("Copy failed. Select and copy manually.");
  }
});

/* --------- Dashboard Rendering --------- */
function renderDashboardFor(userEmail) {
  const user = findUserByEmail(userEmail);
  if (!user) return;

  walletBalanceEl.textContent = money(user.wallet || 0);

  // active investments = sum of approved/active investments amounts for user
  const invs = allInvestments().filter(i => i.userEmail === userEmail && (i.status === "approved" || i.status === "active" || i.status === "completed"));
  const activeSum = invs.reduce((s, it) => s + (it.amount || 0), 0);
  activeInvestmentsEl.textContent = money(activeSum);

  referralEarningsEl.textContent = money(user.referralEarnings || 0);

  // render investment history
  const hist = allInvestments().filter(i => i.userEmail === userEmail);
  investmentHistoryTbody.innerHTML = hist.map(h => `
    <tr>
      <td>${h.plan}</td>
      <td>${money(h.amount)}</td>
      <td>${h.roiPercent}%</td>
      <td>${new Date(h.createdAt).toLocaleString()}</td>
      <td>${h.status}</td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="small muted">No investments yet</td></tr>`;
}

/* --------- Admin Panel Rendering & Actions --------- */
function renderAdminPendingLists() {
  const deposits = allDeposits().filter(d => d.status === "pending");
  const withdrawals = allWithdrawals().filter(w => w.status === "pending");
  const investments = allInvestments().filter(i => i.status === "pending");

  pendingDepositsCountEl.textContent = deposits.length;
  pendingDepositsList.innerHTML = deposits.map(d => {
    const user = findUserByEmail(d.userEmail) || {};
    return `
      <div class="admin-item" data-id="${d.id}">
        <div><strong>${d.userEmail}</strong> • ${money(d.amount)} • ${new Date(d.createdAt).toLocaleString()}</div>
        <div style="margin-top:10px;">
          <img src="${d.proofDataUrl}" alt="proof" style="max-width:140px; border-radius:6px; display:block; margin-bottom:8px; border:1px solid var(--border)"/>
          <div class="admin-btn-wrap">
            <button class="btn btn-primary approve-deposit" data-id="${d.id}">Approve</button>
            <button class="btn btn-outline reject-deposit" data-id="${d.id}">Reject</button>
          </div>
        </div>
      </div>
    `;
  }).join("") || `<div class="small muted">No pending deposits</div>`;

  pendingWithdrawalsList.innerHTML = withdrawals.map(w => `
    <div class="admin-item" data-id="${w.id}">
      <div><strong>${w.userEmail}</strong> • ${money(w.amount)} • ${new Date(w.createdAt).toLocaleString()}</div>
      <div class="small muted">${w.bankName} • ${w.accountNum} • ${w.accountName}</div>
      <div class="admin-btn-wrap">
        <button class="btn btn-primary approve-withdraw" data-id="${w.id}">Approve</button>
        <button class="btn btn-outline reject-withdraw" data-id="${w.id}">Reject</button>
      </div>
    </div>
  `).join("") || `<div class="small muted">No pending withdrawals</div>`;

  pendingInvestmentsList.innerHTML = investments.map(i => `
    <div class="admin-item" data-id="${i.id}">
      <div><strong>${i.userEmail}</strong> • ${i.plan} • ${money(i.amount)} • ROI ${i.roiPercent}%</div>
      <div class="admin-btn-wrap">
        <button class="btn btn-primary approve-invest" data-id="${i.id}">Approve</button>
        <button class="btn btn-outline reject-invest" data-id="${i.id}">Reject</button>
      </div>
    </div>
  `).join("") || `<div class="small muted">No pending investments</div>`;

  // attach action listeners (delegation-ish)
  qsa(".approve-deposit").forEach(b => b.addEventListener("click", handleApproveDeposit));
  qsa(".reject-deposit").forEach(b => b.addEventListener("click", handleRejectDeposit));
  qsa(".approve-withdraw").forEach(b => b.addEventListener("click", handleApproveWithdraw));
  qsa(".reject-withdraw").forEach(b => b.addEventListener("click", handleRejectWithdraw));
  qsa(".approve-invest").forEach(b => b.addEventListener("click", handleApproveInvest));
  qsa(".reject-invest").forEach(b => b.addEventListener("click", handleRejectInvest));

  // render users list with password visible (admin requirement)
  const us = allUsers();
  usersListEl.innerHTML = us.map(u => `
    <div class="admin-item">
      <div><strong>${u.email}</strong> • role: ${u.role}</div>
      <div class="small muted">Password: <code>${u.password}</code></div>
      <div class="small muted">Wallet: ${money(u.wallet || 0)} • Referrals: ${u.referralCount || 0} • Earnings: ${money(u.referralEarnings || 0)}</div>
    </div>
  `).join("");

  // totals & stats
  totalUsersEl.textContent = us.length;
  const totalInv = allInvestments().filter(i => i.status === "approved" || i.status === "active" || i.status === "completed").reduce((s, it) => s + it.amount, 0);
  totalInvestmentsEl.textContent = money(totalInv);
}

/* Admin action handlers */
function handleApproveDeposit(e) {
  const id = e.target.dataset.id;
  const deposits = allDeposits();
  const deposit = deposits.find(d => d.id === id);
  if (!deposit) return alert("Deposit not found");
  deposit.status = "approved";
  deposit.approvedAt = new Date().toISOString();
  saveDeposits(deposits);

  // credit user's wallet
  const user = findUserByEmail(deposit.userEmail);
  if (user) {
    user.wallet = (user.wallet || 0) + deposit.amount;
    saveUsers(allUsers().map(u => u.email === user.email ? user : u));
  }

  alert(`Deposit from ${deposit.userEmail} approved and wallet credited.`);
  renderAdminPendingLists();
  refreshUI();
}

function handleRejectDeposit(e) {
  const id = e.target.dataset.id;
  const deposits = allDeposits();
  const deposit = deposits.find(d => d.id === id);
  if (!deposit) return alert("Deposit not found");
  deposit.status = "rejected";
  deposit.rejectedAt = new Date().toISOString();
  saveDeposits(deposits);
  alert("Deposit rejected.");
  renderAdminPendingLists();
}

function handleApproveWithdraw(e) {
  const id = e.target.dataset.id;
  const withdrawals = allWithdrawals();
  const w = withdrawals.find(x => x.id === id);
  if (!w) return alert("Withdrawal not found");

  const user = findUserByEmail(w.userEmail);
  if (!user) return alert("User not found");

  if ((user.wallet || 0) < w.amount) {
    // mark as rejected automatically
    w.status = "rejected";
    w.rejectedAt = new Date().toISOString();
    saveWithdrawals(withdrawals);
    alert("Insufficient wallet balance. Withdrawal auto-rejected.");
    renderAdminPendingLists();
    return;
  }

  // process withdraw: deduct wallet and mark approved
  user.wallet = (user.wallet || 0) - w.amount;
  w.status = "approved";
  w.processedAt = new Date().toISOString();

  saveUsers(allUsers().map(u => u.email === user.email ? user : u));
  saveWithdrawals(withdrawals);
  alert(`Withdrawal for ${w.userEmail} approved. Wallet debited.`);
  renderAdminPendingLists();
  refreshUI();
}

function handleRejectWithdraw(e) {
  const id = e.target.dataset.id;
  const withdrawals = allWithdrawals();
  const w = withdrawals.find(x => x.id === id);
  if (!w) return alert("Withdrawal not found");
  w.status = "rejected";
  w.rejectedAt = new Date().toISOString();
  saveWithdrawals(withdrawals);
  alert("Withdrawal rejected.");
  renderAdminPendingLists();
}

function handleApproveInvest(e) {
  const id = e.target.dataset.id;
  const invs = allInvestments();
  const inv = invs.find(x => x.id === id);
  if (!inv) return alert("Investment not found");

  const user = findUserByEmail(inv.userEmail);
  if (!user) return alert("User not found");

  // ensure user has wallet funds
  if ((user.wallet || 0) < inv.amount) {
    inv.status = "rejected";
    inv.rejectedAt = new Date().toISOString();
    saveInvestments(invs);
    alert("User has insufficient wallet balance. Investment rejected.");
    renderAdminPendingLists();
    return;
  }

  // Deduct wallet, mark investment approved
  user.wallet = (user.wallet || 0) - inv.amount;
  inv.status = "approved";
  inv.approvedAt = new Date().toISOString();
  inv.activeAt = new Date().toISOString(); // starts immediately as active when admin approves
  inv.status = "active";

  // Persist
  saveUsers(allUsers().map(u => u.email === user.email ? user : u));
  saveInvestments(invs);

  // Referral bonus: if this user was referred, credit referrer referral earnings percent
  if (user.referredBy) {
    const ref = findUserByEmail(user.referredBy);
    if (ref) {
      const bonus = Math.round(inv.amount * CONFIG.REFERRAL_PERCENT);
      ref.referralEarnings = (ref.referralEarnings || 0) + bonus;
      ref.wallet = (ref.wallet || 0) + bonus;
      saveUsers(allUsers().map(u => u.email === ref.email ? ref : u));
    }
  }

  alert(`Investment approved and activated for ${inv.userEmail}. Wallet deducted.`);
  renderAdminPendingLists();
  refreshUI();
}

function handleRejectInvest(e) {
  const id = e.target.dataset.id;
  const invs = allInvestments();
  const inv = invs.find(x => x.id === id);
  if (!inv) return alert("Investment not found");
  inv.status = "rejected";
  inv.rejectedAt = new Date().toISOString();
  saveInvestments(invs);
  alert("Investment rejected.");
  renderAdminPendingLists();
}

/* --------- Admin Login Button & Access Control --------- */
adminBtn.addEventListener("click", () => {
  // admin panel is shown when a logged in user role === admin
  // This button only visible to admin; clicking it focuses admin section
  dashboardSection.classList.add("hidden");
  landingSection.classList.add("hidden");
  adminSection.classList.remove("hidden");
  renderAdminPendingLists();
});

/* --------- Routing & UI Refresh --------- */
function refreshUI() {
  const sessionEmail = currentSession();
  if (!sessionEmail) {
    // no user: show landing, hide dashboard & admin
    landingSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    adminSection.classList.add("hidden");
    authButtons.classList.remove("hidden");
    userInfo.classList.add("hidden");
    adminBtn.classList.add("hidden");
    return;
  }

  const user = findUserByEmail(sessionEmail);
  if (!user) {
    clearSession();
    return refreshUI();
  }

  // show logged-in state
  landingSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  authButtons.classList.add("hidden");
  userInfo.classList.remove("hidden");
  usernameSpan.textContent = user.email;
  logoutBtn.classList.remove("hidden");

  renderDashboardFor(user.email);

  if (user.role === "admin") {
    adminBtn.classList.remove("hidden");
    // if admin, show admin panel
    adminSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    renderAdminPendingLists();
  } else {
    adminBtn.classList.add("hidden");
    adminSection.classList.add("hidden");
  }
}

/* on initial load, check for referral in URL */
function handleReferralFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      // prefill registration referral input if register modal opened
      referralCodeInput.value = ref;
    }
  } catch (e) {}
}
handleReferralFromQuery();

/* Render initial UI state */
refreshUI();

/* Provide helpful keyboard shortcuts & testing helpers (optional) */
document.addEventListener("keydown", (e) => {
  // Esc: close any open modal
  if (e.key === "Escape") qsa(".modal.open").forEach(m => { m.classList.remove("open"); setTimeout(()=>m.style.display="none",200); });
});

/* --------- Expose some dev helpers (for quick debugging in console) --------- */
window.MUTECH = {
  read,
  write,
  allUsers,
  allDeposits,
  allWithdrawals,
  allInvestments,
  CONFIG,
  resetAll: () => {
    if (!confirm("Reset all app data? This will wipe users, sessions, and all items.")) return;
    localStorage.clear();
    ensureInit();
    location.reload();
  }
};

/* --------- Final update of admin pending lists (if admin logged in) --------- */
renderAdminPendingLists();
