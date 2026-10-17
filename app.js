/**
 * PIEDS Orientation - Industrial Quest & Countdown Engine
 */

(function () {
  'use strict';

  // Fallback configuration if config.js is not loaded first
  const config = window.CONFIG || {
    targetDate: new Date('2026-10-20T21:00:00+05:30'),
    totalLocations: 9,
    validLocations: [1, 4],
    storageKey: 'pieds_scanned_locations',
    cookieMaxAgeDays: 365
  };

  // DOM Elements
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  const questCounterEl = document.getElementById('quest-counter');
  const toastBanner = document.getElementById('toast-banner');
  const toastMessage = document.getElementById('toast-message');

  const plaqueHitbox = document.getElementById('plaque-hitbox') || document.getElementById('logo-hitbox');
  const devPanel = document.getElementById('dev-panel');

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
  // Quest UI Rendering: "1/9" or "2/9" Counter & 9 Physical Pegs
  // =========================================================================

  function updateQuestUI(newScanInfo) {
    const scanned = getScannedLocations();
    const count = scanned.length;

    // Update 3D counter: "1/9", "2/9", "0/9"
    if (questCounterEl) {
      questCounterEl.textContent = `${count}/9`;
    }

    // Update the 9 physical pegs
    for (let i = 1; i <= config.totalLocations; i++) {
      const peg = document.getElementById(`peg-${i}`);
      if (peg) {
        if (scanned.includes(i)) {
          peg.classList.add('active');
        } else {
          peg.classList.remove('active');
        }
      }
    }

    // Notification toast & haptic feedback upon new scan
    if (newScanInfo && newScanInfo.isNew) {
      showToast(`Checkpoint ${newScanInfo.id < 10 ? '0' + newScanInfo.id : newScanInfo.id} Discovered`);
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
    
    // Check parameters: ?loc=1, ?location=4, ?scan=1, ?pos=4
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

    // Enable debug panel if ?debug=1 or ?test=1
    if (params.get('debug') === '1' || params.get('test') === '1') {
      if (devPanel) devPanel.classList.add('active');
    }
  }

  // =========================================================================
  // Countdown Timer Engine (DAYS, HOURS, MINS, SECS)
  // Target: 20th October at 9:00 PM IST
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

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minutesEl) minutesEl.textContent = pad(minutes);
    if (secondsEl) secondsEl.textContent = pad(seconds);
  }

  // =========================================================================
  // Secret Dev Helper (Tap Center Plaque 3 times)
  // =========================================================================

  let tapCount = 0;
  let tapTimer = null;

  if (plaqueHitbox && devPanel) {
    plaqueHitbox.addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 800);

      if (tapCount >= 3) {
        devPanel.classList.toggle('active');
        tapCount = 0;
      }
    });
  }

  // Attach dev simulation methods
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
