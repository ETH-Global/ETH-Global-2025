const toggleSlider = document.getElementById("power-button");
const connectionStatus = document.getElementById("connection-status");

function updateConnectionStatus(isConnected) {
  if (isConnected) {
    connectionStatus.textContent = "You are connected";
    connectionStatus.classList.remove("disconnected");
  } else {
    connectionStatus.textContent = "You are disconnected";
    connectionStatus.classList.add("disconnected");
  }
}


chrome.storage.local.get(["isAutoScanEnabled"], (result) => {
  const isEnabled = !!result.isAutoScanEnabled;
  toggleSlider.checked = isEnabled;
  updateConnectionStatus(isEnabled);
});

toggleSlider.addEventListener("change", () => {
  const isEnabled = toggleSlider.checked;
  updateConnectionStatus(isEnabled); // Update status on change

  if (isEnabled) {
    console.log('Requesting geolocation permission...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Permission granted:', position);
        enableScanning(true);
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        alert('Geolocation permission is required to enable auto-scanning. Please allow location access.');
        toggleSlider.checked = false;
        updateConnectionStatus(false); // Revert status if permission denied
        enableScanning(false);
      }
    );
  } else {
    enableScanning(false);
  }
});

function enableScanning(isEnabled) {
  chrome.storage.local.set({ isAutoScanEnabled: isEnabled }, () => {
    chrome.runtime.sendMessage({
      type: "TOGGLE_AUTOSCAN",
      isEnabled: isEnabled,
    });
    console.log(`Auto-scanning set to ${isEnabled}.`);
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.isAutoScanEnabled) {
    const isEnabled = !!changes.isAutoScanEnabled.newValue;
    toggleSlider.checked = isEnabled;
    updateConnectionStatus(isEnabled);
  }
});
