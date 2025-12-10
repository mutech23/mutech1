// 3D Background Animation
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 5;

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 10;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.005,
    color: 0x667eea
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    particlesMesh.rotation.x += 0.0005;
    particlesMesh.rotation.y += 0.0005;
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Admin Credentials
const ADMIN_CREDENTIALS = {
    email: 'declantessa@gmail.com',
    password: 'BAMIDELE!1'
};

// Initialize Storage
const initStorage = () => {
    if (!localStorage.getItem('mutech_users')) {
        localStorage.setItem('mutech_users', JSON.stringify({}));
    }
    if (!localStorage.getItem('mutech_activity')) {
        localStorage.setItem('mutech_activity', JSON.stringify([]));
    }
    if (!localStorage.getItem('mutech_pending_deposits')) {
        localStorage.setItem('mutech_pending_deposits', JSON.stringify([]));
    }
    if (!localStorage.getItem('mutech_pending_withdrawals')) {
        localStorage.setItem('mutech_pending_withdrawals', JSON.stringify([]));
    }
};

initStorage();

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const closeLogin = document.getElementById('close-login');
const closeRegister = document.getElementById('close-register');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authButtons = document.getElementById('auth-buttons');
const userMenu = document.getElementById('user-menu');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');
const dashboard = document.getElementById('dashboard');
const adminPanel = document.getElementById('admin-panel');
const adminPanelBtn = document.getElementById('admin-panel-btn');

// Wallet elements
const walletBalance = document.getElementById('wallet-balance');
const activeInvestments = document.getElementById('active-investments');
const referralEarnings = document.getElementById('referral-earnings');

// Modal elements
const depositModal = document.getElementById('deposit-modal');
const withdrawModal = document.getElementById('withdraw-modal');
const investModal = document.getElementById('invest-modal');
const referralModal = document.getElementById('referral-modal');
const collectModal = document.getElementById('collect-modal');

// Utility Functions
const logActivity = (username, action, amount, status = 'pending') => {
    const activities = JSON.parse(localStorage.getItem('mutech_activity'));
    activities.push({
        username,
        action,
        amount,
        status,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('mutech_activity', JSON.stringify(activities));
};

const checkAdmin = (username) => {
    return username === 'declantessa@gmail.com';
};

// Auth Modal Handlers
loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
registerBtn.addEventListener('click', () => registerModal.classList.remove('hidden'));
closeLogin.addEventListener('click', () => loginModal.classList.add('hidden'));
closeRegister.addEventListener('click', () => registerModal.classList.add('hidden'));

switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.add('hidden');
    registerModal.classList.remove('hidden');
});

switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.classList.add('hidden');
    loginModal.classList.remove('hidden');
});

// Login Handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Check admin login
    if (username === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('mutech_logged_in', username);
        localStorage.setItem('mutech_is_admin', 'true');
        loginModal.classList.add('hidden');
        loginForm.reset();
        loadDashboard();
        return;
    }

    const users = JSON.parse(localStorage.getItem('mutech_users'));
    if (users[username] && users[username].password === password) {
        localStorage.setItem('mutech_logged_in', username);
        localStorage.setItem('mutech_is_admin', 'false');
        logActivity(username, 'login', 0, 'completed');
        loginModal.classList.add('hidden');
        loginForm.reset();
        loadDashboard();
    } else {
        alert('Invalid credentials!');
    }
});

// Register Handler
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const referralCode = document.getElementById('referral-code').value;

    const users = JSON.parse(localStorage.getItem('mutech_users'));

    if (users[username]) {
        alert('Username already exists!');
        return;
    }

    const userReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    users[username] = {
        username,
        password,
        referralCode: userReferralCode,
        wallet: 1000,
        activeInvestments: [],
        referralEarnings: 0,
        deposited: false,
        referredBy: referralCode || null
    };

    // Process referral bonus
    if (referralCode) {
        const referrer = Object.values(users).find(u => u.referralCode === referralCode);
        if (referrer) {
            referrer.referralEarnings += 200;
            users[referrer.username] = referrer;
            users[username].wallet += 200;
        }
    }

    localStorage.setItem('mutech_users', JSON.stringify(users));
    localStorage.setItem('mutech_logged_in', username);
    localStorage.setItem('mutech_is_admin', 'false');
    
    logActivity(username, 'register', 0, 'completed');
    
    registerModal.classList.add('hidden');
    registerForm.reset();
    loadDashboard();
    
    alert(`Welcome ${username}! You received ₦1,000 bonus. Your referral code: ${userReferralCode}`);
});

// Load Dashboard
const loadDashboard = () => {
    const loggedInUser = localStorage.getItem('mutech_logged_in');
    const isAdmin = localStorage.getItem('mutech_is_admin') === 'true';

    if (!loggedInUser) return;

    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    usernameDisplay.textContent = isAdmin ? 'Admin' : loggedInUser;

    if (isAdmin) {
        adminPanelBtn.classList.remove('hidden');
        dashboard.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loadAdminPanel();
    } else {
        adminPanelBtn.classList.add('hidden');
        dashboard.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        updateUserDashboard();
    }
};

// Update User Dashboard
const updateUserDashboard = () => {
    const username = localStorage.getItem('mutech_logged_in');
    const users = JSON.parse(localStorage.getItem('mutech_users'));
    const user = users[username];

    if (!user) return;

    walletBalance.textContent = user.wallet.toLocaleString();
    const totalInvestments = user.activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    activeInvestments.textContent = totalInvestments.toLocaleString();
    referralEarnings.textContent = user.referralEarnings.toLocaleString();

    // Update investment history
    const historyTable = document.getElementById('investment-history');
    historyTable.innerHTML = '';

    user.activeInvestments.forEach((inv, index) => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        
        const maturityDate = new Date(inv.date);
        maturityDate.setDate(maturityDate.getDate() + (inv.plan === 'starter' ? 7 : inv.plan === 'premium' ? 14 : 30));
        const isMatured = new Date() >= maturityDate;

        row.innerHTML = `
            <td class="px-4 py-3">${inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)}</td>
            <td class="px-4 py-3">₦${inv.amount.toLocaleString()}</td>
            <td class="px-4 py-3">${inv.roi}%</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs ${inv.collected ? 'bg-gray-600' : isMatured ? 'bg-green-600' : 'bg-blue-600'}">
                    ${inv.collected ? 'Collected' : isMatured ? 'Matured' : 'Active'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">${inv.date}</td>
            <td class="px-4 py-3">
                ${!inv.collected && isMatured ? `<button onclick="collectProfit(${index})" class="px-3 py-1 bg-green-600 rounded-lg text-sm hover:bg-green-700">Collect</button>` : '-'}
            </td>
        `;
        historyTable.appendChild(row);
    });
};

// Deposit Handler
document.getElementById('deposit-btn').addEventListener('click', () => {
    depositModal.classList.remove('hidden');
});

document.getElementById('close-deposit').addEventListener('click', () => {
    depositModal.classList.add('hidden');
});

document.getElementById('confirm-deposit').addEventListener('click', () => {
    const amount = Number(document.getElementById('deposit-amount').value);
    const proof = document.getElementById('deposit-proof').files[0];

    if (!amount || amount <= 0) {
        alert('Enter valid amount!');
        return;
    }

    if (!proof) {
        alert('Upload payment proof!');
        return;
    }

    const username = localStorage.getItem('mutech_logged_in');
    const pendingDeposits = JSON.parse(localStorage.getItem('mutech_pending_deposits'));
    
    pendingDeposits.push({
        username,
        amount,
        date: new Date().toLocaleString(),
        proofName: proof.name
    });

    localStorage.setItem('mutech_pending_deposits', JSON.stringify(pendingDeposits));
    logActivity(username, 'deposit', amount, 'pending');

    depositModal.classList.add('hidden');
    document.getElementById('deposit-amount').value = '';
    document.getElementById('deposit-proof').value = '';

    alert('Deposit submitted! Waiting for admin approval.');
});

// Withdraw Handler
document.getElementById('withdraw-btn').addEventListener('click', () => {
    withdrawModal.classList.remove('hidden');
    document.getElementById('withdraw-form').classList.remove('hidden');
    document.getElementById('withdraw-success').classList.add('hidden');
});

document.getElementById('close-withdraw').addEventListener('click', () => {
    withdrawModal.classList.add('hidden');
});

document.getElementById('withdraw-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = Number(document.getElementById('withdraw-amount').value);
    const bankName = document.getElementById('bank-name').value;
    const accountNumber = document.getElementById('account-number-input').value;
    const accountName = document.getElementById('account-name').value;

    if (amount < 1700) {
        alert('Minimum withdrawal is ₦1,700!');
        return;
    }

    const username = localStorage.getItem('mutech_logged_in');
    const users = JSON.parse(localStorage.getItem('mutech_users'));
    const user = users[username];

    if (amount > user.wallet) {
        alert('Insufficient funds!');
        return;
    }

    // Deduct from wallet immediately
    user.wallet -= amount;
    users[username] = user;
    localStorage.setItem('mutech_users', JSON.stringify(users));

    // Add to pending withdrawals
    const pendingWithdrawals = JSON.parse(localStorage.getItem('mutech_pending_withdrawals'));
    pendingWithdrawals.push({
        username,
        amount,
        bankName,
        accountNumber,
        accountName,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('mutech_pending_withdrawals', JSON.stringify(pendingWithdrawals));

    logActivity(username, 'withdrawal', amount, 'pending');

    document.getElementById('withdraw-form').classList.add('hidden');
    document.getElementById('withdraw-success').classList.remove('hidden');
    document.getElementById('withdraw-amount-success').textContent = amount.toLocaleString();
    document.getElementById('withdraw-bank-success').textContent = bankName;
    document.getElementById('withdraw-account-number-success').textContent = accountNumber;

    updateUserDashboard();
});

document.getElementById('close-withdraw-success').addEventListener('click', () => {
    withdrawModal.classList.add('hidden');
    document.getElementById('withdraw-form').reset();
});// Investment Handler
document.getElementById('invest-btn').addEventListener('click', () => {
    investModal.classList.remove('hidden');
});

document.querySelectorAll('.invest-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('invest-plan-select').value = btn.dataset.plan;
        investModal.classList.remove('hidden');
    });
});

document.getElementById('close-invest').addEventListener('click', () => {
    investModal.classList.add('hidden');
});

document.getElementById('confirm-invest').addEventListener('click', () => {
    const amount = Number(document.getElementById('invest-amount').value);
    const plan = document.getElementById('invest-plan-select').value;

    const planDetails = {
        starter: { min: 1000, max: 10000, roi: 20 },
        premium: { min: 10000, max: 50000, roi: 50 },
        executive: { min: 50000, max: 500000, roi: 100 }
    };

    const details = planDetails[plan];

    if (amount < details.min || amount > details.max) {
        alert(`Amount must be between ₦${details.min.toLocaleString()} and ₦${details.max.toLocaleString()}`);
        return;
    }

    const username = localStorage.getItem('mutech_logged_in');
    const users = JSON.parse(localStorage.getItem('mutech_users'));
    const user = users[username];

    if (amount > user.wallet) {
        alert('Insufficient funds!');
        return;
    }

    user.wallet -= amount;
    user.activeInvestments.push({
        plan,
        amount,
        roi: details.roi,
        date: new Date().toLocaleDateString(),
        collected: false
    });

    users[username] = user;
    localStorage.setItem('mutech_users', JSON.stringify(users));
    logActivity(username, 'investment', amount, 'completed');

    investModal.classList.add('hidden');
    document.getElementById('invest-amount').value = '';
    updateUserDashboard();

    alert(`Investment of ₦${amount.toLocaleString()} successful!`);
});

// Collect Profit
window.collectProfit = (index) => {
    const username = localStorage.getItem('mutech_logged_in');
    const users = JSON.parse(localStorage.getItem('mutech_users'));
    const user = users[username];
    const inv = user.activeInvestments[index];

    const profit = Math.floor((inv.amount * inv.roi) / 100);
    const total = inv.amount + profit;

    document.getElementById('collect-details').innerHTML = `
        <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-400">Plan:</span><span>${inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Principal:</span><span>₦${inv.amount.toLocaleString()}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Profit:</span><span class="text-green-400">₦${profit.toLocaleString()}</span></div>
            <div class="flex justify-between font-bold text-lg"><span>Total:</span><span>₦${total.toLocaleString()}</span></div>
        </div>
    `;

    collectModal.classList.remove('hidden');
    document.getElementById('confirm-collect').onclick = () => {
        user.wallet += total;
        inv.collected = true;
        users[username] = user;
        localStorage.setItem('mutech_users', JSON.stringify(users));
        logActivity(username, 'profit_collection', total, 'completed');
        collectModal.classList.add('hidden');
        updateUserDashboard();
        alert(`Collected ₦${total.toLocaleString()}!`);
    };
};

document.getElementById('close-collect').addEventListener('click', () => {
    collectModal.classList.add('hidden');
});

// Referral Handler
document.getElementById('referral-btn').addEventListener('click', () => {
    const username = localStorage.getItem('mutech_logged_in');
    const users = JSON.parse(localStorage.getItem('mutech_users'));
    const user = users[username];

    document.getElementById('referral-link').value = `${window.location.origin}?ref=${user.referralCode}`;
    document.getElementById('referral-earnings-modal').textContent = user.referralEarnings.toLocaleString();
    
    const referralCount = Object.values(users).filter(u => u.referredBy === user.referralCode).length;
    document.getElementById('referral-count').textContent = referralCount;

    referralModal.classList.remove('hidden');
});

document.getElementById('close-referral').addEventListener('click', () => {
    referralModal.classList.add('hidden');
});

document.getElementById('copy-referral').addEventListener('click', () => {
    const input = document.getElementById('referral-link');
    input.select();
    document.execCommand('copy');
    alert('Referral link copied!');
});

// Admin Panel
adminPanelBtn.addEventListener('click', () => {
    if (adminPanel.classList.contains('hidden')) {
        dashboard.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loadAdminPanel();
    } else {
        adminPanel.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }
});

const loadAdminPanel = () => {
    const users = JSON.parse(localStorage.getItem('mutech_users'));
    const activities = JSON.parse(localStorage.getItem('mutech_activity'));
    const pendingDeposits = JSON.parse(localStorage.getItem('mutech_pending_deposits'));
    const pendingWithdrawals = JSON.parse(localStorage.getItem('mutech_pending_withdrawals'));

    // Stats
    document.getElementById('admin-total-users').textContent = Object.keys(users).length;
    
    const totalInv = Object.values(users).reduce((sum, u) => {
        return sum + u.activeInvestments.reduce((s, inv) => s + inv.amount, 0);
    }, 0);
    document.getElementById('admin-total-investments').textContent = totalInv.toLocaleString();
    document.getElementById('admin-pending-deposits').textContent = pendingDeposits.length;
    document.getElementById('admin-pending-withdrawals').textContent = pendingWithdrawals.length;

    // Activity Log
    const activityLog = document.getElementById('admin-activity-log');
    activityLog.innerHTML = '';
    activities.slice(-20).reverse().forEach(act => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        row.innerHTML = `
            <td class="px-4 py-3">${act.username}</td>
            <td class="px-4 py-3">${act.action}</td>
            <td class="px-4 py-3">₦${act.amount.toLocaleString()}</td>
            <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs ${act.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}">${act.status}</span></td>
            <td class="px-4 py-3 text-xs">${act.date}</td>
            <td class="px-4 py-3">-</td>
        `;
        activityLog.appendChild(row);
    });

    // Pending Deposits
    const depositsList = document.getElementById('admin-pending-deposits-list');
    depositsList.innerHTML = '';
    pendingDeposits.forEach((dep, index) => {
        const div = document.createElement('div');
        div.className = 'glass-effect rounded-lg p-4';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-semibold">${dep.username}</p>
                    <p class="text-sm text-gray-400">Amount: ₦${dep.amount.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">${dep.date}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="approveDeposit(${index})" class="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-700">Approve</button>
                    <button onclick="rejectDeposit(${index})" class="px-4 py-2 bg-red-600 rounded-lg text-sm hover:bg-red-700">Reject</button>
                </div>
            </div>
        `;
        depositsList.appendChild(div);
    });

    // Pending Withdrawals
    const withdrawalsList = document.getElementById('admin-pending-withdrawals-list');
    withdrawalsList.innerHTML = '';
    pendingWithdrawals.forEach((wit, index) => {
        const div = document.createElement('div');
        div.className = 'glass-effect rounded-lg p-4';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-semibold">${wit.username}</p>
                    <p class="text-sm text-gray-400">Amount: ₦${wit.amount.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">${wit.bankName} - ${wit.accountNumber}</p>
                    <p class="text-xs text-gray-500">${wit.date}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="approveWithdrawal(${index})" class="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-700">Approve</button>
                </div>
            </div>
        `;
        withdrawalsList.appendChild(div);
    });
};

window.approveDeposit = (index) => {
    const pendingDeposits = JSON.parse(localStorage.getItem('mutech_pending_deposits'));
    const deposit = pendingDeposits[index];
    
    const users = JSON.parse(localStorage.getItem('mutech_users'));
    users[deposit.username].wallet += deposit.amount;
    users[deposit.username].deposited = true;
    localStorage.setItem('mutech_users', JSON.stringify(users));

    pendingDeposits.splice(index, 1);
    localStorage.setItem('mutech_pending_deposits', JSON.stringify(pendingDeposits));

    logActivity(deposit.username, 'deposit_approved', deposit.amount, 'completed');
    loadAdminPanel();
    alert('Deposit approved!');
};

window.rejectDeposit = (index) => {
    const pendingDeposits = JSON.parse(localStorage.getItem('mutech_pending_deposits'));
    pendingDeposits.splice(index, 1);
    localStorage.setItem('mutech_pending_deposits', JSON.stringify(pendingDeposits));
    loadAdminPanel();
    alert('Deposit rejected!');
};

window.approveWithdrawal = (index) => {
    const pendingWithdrawals = JSON.parse(localStorage.getItem('mutech_pending_withdrawals'));
    const withdrawal = pendingWithdrawals[index];

    pendingWithdrawals.splice(index, 1);
    localStorage.setItem('mutech_pending_withdrawals', JSON.stringify(pendingWithdrawals));

    logActivity(withdrawal.username, 'withdrawal_approved', withdrawal.amount, 'completed');
    loadAdminPanel();
    alert('Withdrawal approved!');
};

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.setItem('mutech_logged_in', '');
    localStorage.setItem('mutech_is_admin', 'false');
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
    dashboard.classList.add('hidden');
    adminPanel.classList.add('hidden');
});

// Initialize
loadDashboard();
