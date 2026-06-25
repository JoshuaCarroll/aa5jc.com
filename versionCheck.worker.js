let currentVersion;

async function checkForUpdates() {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    const data = await res.json();

    if (!currentVersion) {
      currentVersion = data.version;
    } else if (data.version !== currentVersion) {
      postMessage({ version: data.version, message: data.message });
    }
  } catch (err) {
    // Silently fail; will retry on next interval
  }

  setTimeout(checkForUpdates, 10000); // Schedule the next check
}

checkForUpdates();
