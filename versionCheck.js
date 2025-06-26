
let currentVersion;

async function checkForUpdates() {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' }); // Avoid cached versions
    const data = await res.json();

    if (!currentVersion) {
      currentVersion = data.version;
    } else if (data.version !== currentVersion) {
      if (prompt(`A new version (${data.version}) is available. Do you want to reload the page?`)) {
        location.reload(true); // Force full reload
      }
    }
  } catch (err) {
    console.error("Version check failed:", err);
  }
}

// Check every 10 seconds
setInterval(checkForUpdates, 10000);

// Optionally run once on page load
checkForUpdates();