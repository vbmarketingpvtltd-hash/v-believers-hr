// --- SECURITY GATEKEEPER ---
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "auth.html";
}

// Set this to just "/api" because your netlify.toml handles the rest
const API_URL = "/api"; 

window.logout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "auth.html";
};

const branches = ["Kurnool", "Hyderabad", "Kalahasthi", "HYD-->KNL"];
const bridges = ["Veera", "Ramana", "Jyothi Sai", "Mythri", "Vishnu", "Mahesh", "Asish", "Rishik"];

const $ = id => document.getElementById(id);
const form = $("appForm"), tableBody = $("tableBody");
let isBinOpen = false;

async function loadData() {
  try {
    // Corrected: Removed the extra "/api" from the template literal
    const response = await fetch(`${API_URL}/applications?bin=${isBinOpen}`);
    if (!response.ok) return;
    const applications = await response.json();
    renderTable(applications);
  } catch (err) {
    console.error("Could not connect to server:", err);
  }
}

function fillDropdowns() {
    $("branch").innerHTML = "<option value=''>Select Branch</option>" + branches.map(b => `<option>${b}</option>`).join("");
    $("filterBranch").innerHTML = "<option value=''>All Branch</option>" + branches.map(b => `<option>${b}</option>`).join("");
    $("bridge").innerHTML = "<option value=''>Select Bridge</option>" + bridges.map(b => `<option>${b}</option>`).join("");
    $("filterBridge").innerHTML = "<option value=''>All Bridge</option>" + bridges.map(b => `<option>${b}</option>`).join("");
}

function renderTable(data) {
    tableBody.innerHTML = "";
    const fb = $("filterBranch").value, fs = $("filterStatus").value, fbr = $("filterBridge").value;

    data.forEach(d => {
        if (fb && d.branch !== fb) return;
        if (fs && d.status !== fs) return;
        if (fbr && d.bridge !== fbr) return;

        const actionButtons = isBinOpen 
            ? `<button onclick="restoreApp('${d._id}')">✅ Restore</button>` 
            : `<button onclick="editApp('${d._id}')">Edit</button>
               <button onclick="letterApp('${JSON.stringify(d).replace(/"/g, '&quot;')}')">Letter</button>
               <button onclick="deleteApp('${d._id}')">🗑 Delete</button>`;

        tableBody.innerHTML += `
        <tr>
            <td>${d.regNo}</td><td>${d.name}</td><td>${d.fatherName}</td>
            <td>${d.dob}</td><td>${d.qualification}</td><td>${d.circleDate}</td>
            <td>${d.gender}</td><td>${d.branch}</td><td>${d.email}</td>
            <td>${d.district}</td><td>${d.phone}</td><td>${d.bridge}</td><td>${d.status}</td>
            <td>${actionButtons}</td>
        </tr>`;
    });
}

form.onsubmit = async (e) => {
    e.preventDefault();
    const regNo = $("regNo").value;
    const id = $("docId").value;

    if (!id) {
        // Corrected URL
        const checkResponse = await fetch(`${API_URL}/check-duplicate/${regNo}`);
        const checkResult = await checkResponse.json();
        if (checkResult.exists) {
            alert(`⚠️ Error: Registration Number ${regNo} already exists for ${checkResult.name}!`);
            return;
        }
    }

    const d = {
        id: id || null,
        regNo: regNo,
        name: $("name").value,
        fatherName: $("fatherName").value,
        dob: $("dob").value,
        qualification: $("qualification").value,
        circleDate: $("circleDate").value,
        gender: $("gender").value,
        branch: $("branch").value,
        email: $("email").value,
        district: $("district").value,
        phone: $("phone").value,
        bridge: $("bridge").value,
        status: $("status").value
    };

    // Corrected URL
    const response = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d)
    });

    if (response.ok) {
        form.reset();
        $("docId").value = "";
        loadData();
        alert("Action successful!");
    }
};

window.editApp = async (id) => {
    // Corrected URL
    const response = await fetch(`${API_URL}/applications?bin=false`);
    const apps = await response.json();
    const app = apps.find(a => a._id === id);
    if (app) {
        $("docId").value = app._id;
        $("regNo").value = app.regNo || "";
        $("name").value = app.name || "";
        $("fatherName").value = app.fatherName || "";
        $("dob").value = app.dob || "";
        $("qualification").value = app.qualification || "";
        $("circleDate").value = app.circleDate || "";
        $("gender").value = app.gender || "";
        $("branch").value = app.branch || "";
        $("email").value = app.email || "";
        $("district").value = app.district || "";
        $("phone").value = app.phone || "";
        $("bridge").value = app.bridge || "";
        $("status").value = app.status || "";
        window.scrollTo(0, 0);
    }
};

window.deleteApp = async (id) => {
    if(confirm("Move this application to Bin?")) {
        // Corrected URL
        await fetch(`${API_URL}/applications/${id}`, { method: 'DELETE' });
        loadData();
    }
};

// --- Replace ONLY this function in your app.js ---
window.restoreApp = async (id) => {
    // We use the existing POST route to update the isDeleted status
    const response = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, isDeleted: false })
    });

    if (response.ok) {
        alert("✅ Application Restored!");
        loadData();
    } else {
        alert("❌ Failed to restore.");
    }
};
$("openBinBtn").onclick = () => {
    isBinOpen = !isBinOpen;
    $("openBinBtn").innerText = isBinOpen ? "📁 View Active" : "🗑 Open Bin";
    loadData();
};

window.letterApp = (dataStr) => {
    const data = JSON.parse(dataStr);
    localStorage.setItem("letterData", JSON.stringify(data));
    window.location.href = "selection.html";
};

$("filterBranch").onchange = () => loadData();
$("filterStatus").onchange = () => loadData();
$("filterBridge").onchange = () => loadData();
$("clearFilters").onclick = () => {
    $("filterBranch").value = ""; $("filterStatus").value = ""; $("filterBridge").value = "";
    loadData();
};

fillDropdowns();
loadData();

