/**
 * PIEDS Orientation Countdown & Scavenger Hunt Engine
 */

(function () {
  'use strict';

  // Fallback configuration if config.js is not loaded first
  const config = window.CONFIG || {
    targetDate: new Date('2026-10-20T21:00:00+05:30'),
    totalLocations: 9,
    validLocations: [1, 4],
    storageKey: 'pieds_scanned_locations',
    cookieMaxAgeDays: 365,
    labels: {
      questStatusSingular: '1 out of 9 locations scanned',
      questStatusPlural: (c, t) => `${c} out of ${t} locations scanned`,
      questStatusZero: '0 out of 9 locations scanned'
    }
  };

  // DOM Elements
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  const refDaysEl = document.getElementById('ref-days');
  const refHoursEl = document.getElementById('ref-hours');
  const refMinutesEl = document.getElementById('ref-minutes');
  const refSecondsEl = document.getElementById('ref-seconds');

  const questStatusText = document.getElementById('quest-status-text');
  const checkpointSlotsContainer = document.getElementById('checkpoint-slots');
  const toastBanner = document.getElementById('toast-banner');
  const toastMessage = document.getElementById('toast-message');

  const devPanel = document.getElementById('dev-panel');
  const logoWrapper = document.getElementById('logo-wrapper');

  // =========================================================================
  // Cookie and LocalStorage Operations
  // =========================================================================

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      try {
        return decodeURIComponent(parts.pop().split(';').shift());
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
  }

  function clearCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  }

  function getScannedLocations() {
    const locations = new Set();

    // 1. Read from localStorage
    try {
      const localData = localStorage.getItem(config.storageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          parsed.forEach(n => {
            const num = parseInt(n, 10);
            if (!isNaN(num) && num >= 1 && num <= config.totalLocations) {
              locations.add(num);
            }
          });
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    // 2. Read from Cookie
    try {
      const cookieData = getCookie(config.storageKey);
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        if (Array.isArray(parsed)) {
          parsed.forEach(n => {
            const num = parseInt(n, 10);
            if (!isNaN(num) && num >= 1 && num <= config.totalLocations) {
              locations.add(num);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Cookie read error:', e);
    }

    return Array.from(locations).sort((a, b) => a - b);
  }

  function saveScannedLocations(locArray) {
    const serialized = JSON.stringify(locArray);
    try {
      localStorage.setItem(config.storageKey, serialized);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    try {
      setCookie(config.storageKey, serialized, config.cookieMaxAgeDays);
    } catch (e) {
      console.warn('Cookie save error:', e);
    }
  }

  function registerScan(locationId) {
    const num = parseInt(locationId, 10);
    if (isNaN(num) || num < 1 || num > config.totalLocations) {
      return { isNew: false, count: getScannedLocations().length, id: null };
    }

    const current = getScannedLocations();
    const isNew = !current.includes(num);

    if (isNew) {
      current.push(num);
      current.sort((a, b) => a - b);
      saveScannedLocations(current);
    }

    return { isNew, count: current.length, id: num };
  }

  function resetAllScans() {
    try {
      localStorage.removeItem(config.storageKey);
    } catch (e) {}
    clearCookie(config.storageKey);
    updateQuestUI(null);
    showToast('Progress Reset');
  }

  // =========================================================================
  // Quest UI Rendering
  // =========================================================================

  function renderSlots() {
    checkpointSlotsContainer.innerHTML = '';
    for (let i = 1; i <= config.totalLocations; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.id = `slot-${i}`;
      slot.textContent = i < 10 ? `0${i}` : `${i}`;
      checkpointSlotsContainer.appendChild(slot);
    }
  }

  function updateQuestUI(newScanInfo) {
    const scanned = getScannedLocations();
    const count = scanned.length;

    // Update quest text
    if (count === 0) {
      questStatusText.innerHTML = config.labels.questStatusZero;
    } else if (count === 1) {
      questStatusText.innerHTML = `<span class="quest-highlight">1</span> out of 9 locations scanned`;
    } else {
      questStatusText.innerHTML = `<span class="quest-highlight">${count}</span> out of 9 locations scanned`;
    }

    // Update slot classes
    for (let i = 1; i <= config.totalLocations; i++) {
      const slot = document.getElementById(`slot-${i}`);
      if (slot) {
        if (scanned.includes(i)) {
          slot.classList.add('discovered');
        } else {
          slot.classList.remove('discovered');
        }
      }
    }

    // New scan trigger notification & haptic feedback
    if (newScanInfo && newScanInfo.isNew) {
      showToast(`Location #${newScanInfo.id} Discovered`);
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch (e) {}
      }
    }
  }

  let toastTimer = null;
  function showToast(text) {
    if (!toastBanner || !toastMessage) return;
    toastMessage.textContent = text;
    toastBanner.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastBanner.classList.remove('show');
    }, 3800);
  }

  // =========================================================================
  // QR Code URL Parameter Handler
  // =========================================================================

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Check multiple parameter names for flexibility: ?loc=1, ?location=4, ?scan=1, ?pos=4
    const locParam = params.get('loc') || params.get('location') || params.get('scan') || params.get('pos');
    
    // Also check hash: #loc1, #1, #loc=1
    let hashParam = null;
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace('#', '');
      const hashMatch = cleanHash.match(/(?:loc=?)?(\d+)/i);
      if (hashMatch) {
        hashParam = hashMatch[1];
      }
    }

    const targetLoc = locParam || hashParam;

    if (targetLoc) {
      const result = registerScan(targetLoc);
      updateQuestUI(result);

      // Clean the URL query params so reloading doesn't duplicate and sharing the link stays clean
      try {
        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, document.title, cleanUrl);
      } catch (e) {}
    } else {
      updateQuestUI(null);
    }

    // Enable debug panel if ?debug=1
    if (params.get('debug') === '1' || params.get('test') === '1') {
      if (devPanel) devPanel.classList.add('active');
    }
  }

  // =========================================================================
  // Countdown Timer Engine (Days, Hours, Minutes, Seconds)
  // =========================================================================

  function pad(num) {
    return num.toString().padStart(2, '0');
  }

  function updateTimer() {
    const now = new Date().getTime();
    const target = config.targetDate.getTime();
    const diff = target - now;

    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (diff > 0) {
      const totalSeconds = Math.floor(diff / 1000);
      days = Math.floor(totalSeconds / 86400);
      hours = Math.floor((totalSeconds % 86400) / 3600);
      minutes = Math.floor((totalSeconds % 3600) / 60);
      seconds = totalSeconds % 60;
    }

    const dStr = pad(days);
    const hStr = pad(hours);
    const mStr = pad(minutes);
    const sStr = pad(seconds);

    // Update main LED digits
    if (daysEl) daysEl.textContent = dStr;
    if (hoursEl) hoursEl.textContent = hStr;
    if (minutesEl) minutesEl.textContent = mStr;
    if (secondsEl) secondsEl.textContent = sStr;

    // Update mirror reflection digits
    if (refDaysEl) refDaysEl.textContent = dStr;
    if (refHoursEl) refHoursEl.textContent = hStr;
    if (refMinutesEl) refMinutesEl.textContent = mStr;
    if (refSecondsEl) refSecondsEl.textContent = sStr;
  }

  // =========================================================================
  // Easter Egg / Dev Helper (Tap Logo 3 times to toggle simulator)
  // =========================================================================

  let tapCount = 0;
  let tapTimer = null;

  if (logoWrapper && devPanel) {
    logoWrapper.addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 800);

      if (tapCount >= 3) {
        devPanel.classList.toggle('active');
        tapCount = 0;
      }
    });
  }

  // Attach dev buttons
  window.simulateScan = function (locId) {
    const result = registerScan(locId);
    updateQuestUI(result);
  };

  window.resetQuest = function () {
    resetAllScans();
  };

  // =========================================================================
  // Initialization
  // =========================================================================

  function init() {
    renderSlots();
    checkUrlParams();
    updateTimer();
    setInterval(updateTimer, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
