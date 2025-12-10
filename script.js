<script>
// Utility functions
function togglePassword(inputId, elem){
  const input = document.getElementById(inputId);
  input.type = input.type === "password" ? "text" : "password";
  elem.textContent = input.type === "password" ? "👁️" : "🙈";
}

// Theme toggle
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", ()=>{
  document.body.classList.toggle("light-mode");
  themeToggle.textContent = document.body.classList.contains("light-mode") ? "🌞" : "🌙";
});

// Copy account number
document.getElementById("copyAccountBtn").addEventListener("click", ()=>{
  const account = document.getElementById("accountNumber").textContent;
  navigator.clipboard.writeText(account);
  document.getElementById("copyMsg").classList.remove("hidden");
  setTimeout(()=> document.getElementById("copyMsg").classList.add("hidden"), 2000);
});

// Modal handling
document.querySelectorAll(".close-btn").forEach(btn=>{
  btn.addEventListener("click", ()=> btn.closest(".modal").classList.remove("active"));
});
function openModal(id){ document.getElementById(id).classList.add("active"); }

// Authentication (localStorage mock)
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
function saveUsers(){ localStorage.setItem("users", JSON.stringify(users)); }
function saveCurrentUser(){ localStorage.setItem("currentUser", JSON.stringify(currentUser)); }

// Update UI
function updateUI(){
  if(currentUser){
    document.getElementById("authButtons").classList.add("hidden");
    document.getElementById("userInfo").classList.remove("hidden");
    document.getElementById("username").textContent = currentUser.email;
    if(currentUser.isAdmin) document.getElementById("adminBtn").classList.remove("hidden");
    document.getElementById("landingSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("walletBalance").textContent = "₦"+currentUser.wallet;
    document.getElementById("userReferralCode").value = currentUser.referralCode;
    updateInvestmentHistory();
  } else {
    document.getElementById("authButtons").classList.remove("hidden");
    document.getElementById("userInfo").classList.add("hidden");
    document.getElementById("landingSection").classList.remove("hidden");
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("adminSection").classList.add("hidden");
  }
}
updateUI();

// Login/Register modals
document.getElementById("loginBtn").addEventListener("click", ()=> openModal("loginModal"));
document.getElementById("registerBtn").addEventListener("click", ()=> openModal("registerModal"));
document.getElementById("switchToRegister").addEventListener("click", ()=>{
  document.getElementById("loginModal").classList.remove("active"); 
  openModal("registerModal");
});
document.getElementById("switchToLogin").addEventListener("click", ()=>{
  document.getElementById("registerModal").classList.remove("active"); 
  openModal("loginModal");
});

// Admin panel
document.getElementById("adminBtn").addEventListener("click", ()=>{
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("adminSection").classList.remove("hidden");
  updateAdminPanel();
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", ()=>{
  currentUser = null;
  saveCurrentUser();
  updateUI();
});

// Register
document.getElementById("registerForm").addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const referralCode = document.getElementById("referralCode").value || Math.random().toString(36).substring(2,8).toUpperCase();
  if(users.find(u=>u.email===email)){ alert("Email already exists"); return; }

  const user = {email,password,wallet:0,referralCode,isAdmin:false,investments:[],referredBy:referralCode};
  users.push(user);

  // Handle referral bonus if valid
  const referrer = users.find(u => u.referralCode === referralCode);
  if(referrer && referrer.email !== email){
    alert(`Referral applied! ${referrer.email} will earn 5% of your deposit.`);
  }

  currentUser = user;
  saveUsers(); saveCurrentUser(); updateUI();
  document.getElementById("registerModal").classList.remove("active");
});

// Login
document.getElementById("loginForm").addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const user = users.find(u=>u.email===email && u.password===password);
  if(!user){ alert("Invalid credentials"); return; }
  currentUser = user;
  saveCurrentUser(); updateUI();
  document.getElementById("loginModal").classList.remove("active");
});

// Deposit (mock)
document.getElementById("submitDepositBtn").addEventListener("click", ()=>{
  const amount = Number(document.getElementById("depositAmount").value);
  if(amount<=0){ alert("Enter valid amount"); return; }

  currentUser.wallet += amount;

  // Apply referral bonus if applicable
  if(currentUser.referredBy){
    const referrer = users.find(u => u.referralCode === currentUser.referredBy);
    if(referrer){
      const bonus = Math.floor(amount * 0.05);
      referrer.wallet += bonus;
      alert(`Referral bonus ₦${bonus} added to ${referrer.email}'s wallet!`);
    }
  }

  saveUsers(); saveCurrentUser(); updateUI();
  alert("Deposit successful!");
  document.getElementById("depositModal").classList.remove("active");
});

// Withdraw
document.getElementById("withdrawForm").addEventListener("submit", e=>{
  e.preventDefault();
  const amount = Number(document.getElementById("withdrawAmount").value);
  if(amount > currentUser.wallet){ alert("Insufficient balance"); return; }
  currentUser.wallet -= amount;
  saveCurrentUser(); saveUsers(); updateUI();
  alert("Withdrawal request submitted!");
  document.getElementById("withdrawModal").classList.remove("active");
});

// Invest
document.getElementById("investForm").addEventListener("submit", e=>{
  e.preventDefault();
  const plan = document.getElementById("investPlan").value;
  const amount = Number(document.getElementById("investAmount").value);
  if(!plan || amount<=0 || amount>currentUser.wallet){ alert("Invalid investment"); return; }

  currentUser.wallet -= amount;
  currentUser.investments.push({plan,amount,date:new Date().toLocaleDateString(),roi:plan==="starter"?20:plan==="premium"?50:100,status:"Active"});
  saveCurrentUser(); saveUsers(); updateUI();
  alert("Investment successful!");
  document.getElementById("investModal").classList.remove("active");
});

// Referral
document.getElementById("referralBtn").addEventListener("click", ()=> openModal("referralModal"));

// Investment history
function updateInvestmentHistory(){
  const tbody = document.getElementById("investmentHistory");
  tbody.innerHTML = "";
  if(currentUser && currentUser.investments){
    currentUser.investments.forEach(inv=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${inv.plan}</td><td>₦${inv.amount}</td><td>${inv.roi}%</td><td>${inv.date}</td><td>${inv.status}</td>`;
      tbody.appendChild(tr);
    });
  }
}

// Admin panel mock
function updateAdminPanel(){
  const totalUsers = users.length;
  const totalInvestments = users.reduce((sum,u)=>sum+(u.investments? u.investments.reduce((s,i)=>s+i.amount,0):0),0);
  document.getElementById("totalUsers").textContent = totalUsers;
  document.getElementById("totalInvestments").textContent = "₦"+totalInvestments;
  document.getElementById("pendingDepositsCount").textContent = 2; // Mock
}

// Initial admin user
if(!users.find(u=>u.isAdmin)){
  users.push({email:"admin@mutech.com",password:"admin123",isAdmin:true,wallet:0,investments:[],referralCode:"ADMIN"});
  saveUsers();
}

updateUI();
</script>
