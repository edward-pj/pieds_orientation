/**
 * PIEDS Orientation Website Configuration
 */
const CONFIG = {
  // Target countdown date: 20th October at 9:00 PM (IST / GMT+5:30)
  targetDate: new Date('2026-10-20T21:00:00+05:30'),

  // Total hidden locations on campus (for the FOMO marketing quest)
  totalLocations: 9,

  // Campus QR locations mapped to physical posters
  // Poster 1 -> Location 1
  // Poster 2 -> Location 4
  validLocations: [1, 4],

  // Storage configuration (both Cookie and localStorage used simultaneously)
  storageKey: 'pieds_scanned_locations',
  cookieMaxAgeDays: 365,

  // Visual text options
  labels: {
    unitDays: 'DAYS',
    unitHours: 'HOURS',
    unitMinutes: 'MINUTES',
    unitSeconds: 'SECONDS',
    questStatusSingular: '1 out of 9 locations scanned',
    questStatusPlural: (count, total) => `${count} out of ${total} locations scanned`,
    questStatusZero: '0 out of 9 locations scanned',
    timerExpiredTitle: 'THE TIME HAS COME',
    timerExpiredSub: 'ORIENTATION COMMENCING'
  }
};

// Export for module or browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
