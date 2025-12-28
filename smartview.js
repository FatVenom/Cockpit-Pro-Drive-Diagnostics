const output = document.getElementById("output");
const btnRefresh = document.getElementById("refresh");
const btnTest = document.getElementById("selftest");
const btnDownload = document.getElementById("download");
const driveSelect = document.getElementById("drive-select");
const searchInput = document.getElementById("search-input");

// 1. Detect physical drives
function populateDrives() {
    cockpit.spawn(["lsblk", "-dno", "NAME", "-e7"])
        .then(data => {
            const drives = data.trim().split("\n");
            driveSelect.innerHTML = "";
            drives.forEach(drive => {
                if (!drive) return;
                const opt = document.createElement("option");
                opt.value = drive;
                opt.innerText = `/dev/${drive}`;
                driveSelect.appendChild(opt);
            });
        });
}

// 2. Fetch SMART Data
function getSmartData() {
    const drive = driveSelect.value;
    output.innerText = `[LOG] Loading report for /dev/${drive}...`;

    cockpit.spawn(["sudo", "/usr/sbin/smartctl", "-x", "-T", "permissive", `/dev/${drive}`])
        .then(data => { output.innerText = data; })
        .fail((err, data) => { output.innerText = data ? data : "Error: " + err; });
}

// 3. Download as File
function downloadReport() {
    const drive = driveSelect.value;
    const text = output.innerText;
    const blob = new Blob([text], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.download = `smart_report_${drive}_${new Date().toISOString().slice(0,10)}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
}

// 4. Search Filter
searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const lines = output.innerText.split("\n");
    if (!term) return;
    const filtered = lines.filter(l => l.toLowerCase().includes(term));
    if (filtered.length > 0) output.innerText = filtered.join("\n");
});

btnRefresh.addEventListener("click", getSmartData);
btnTest.addEventListener("click", () => {
    const drive = driveSelect.value;
    cockpit.spawn(["sudo", "/usr/sbin/smartctl", "-t", "short", `/dev/${drive}`])
        .then(() => { output.innerText = "Test started! Re-scan in 2 mins."; });
});
btnDownload.addEventListener("click", downloadReport);

populateDrives();


