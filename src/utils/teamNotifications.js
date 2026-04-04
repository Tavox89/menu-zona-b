let audioContext = null;
let lastFeedbackAt = 0;

function getFeedbackProfile(profile = 'service') {
  const normalized = String(profile || 'service').trim().toLowerCase();

  if (normalized === 'kitchen') {
    return {
      vibrate: [260, 90, 260, 90, 340],
      peaks: [
        { type: 'triangle', start: 0, stop: 0.32, from: 620, to: 760 },
        { type: 'sine', start: 0.04, stop: 0.38, from: 860, to: 1180 },
        { type: 'square', start: 0.2, stop: 0.58, from: 1040, to: 1280 },
      ],
      gain: [
        [0.0001, 0],
        [0.22, 0.03],
        [0.08, 0.18],
        [0.24, 0.28],
        [0.0001, 0.58],
      ],
    };
  }

  if (normalized === 'bar') {
    return {
      vibrate: [140, 60, 180, 60, 220],
      peaks: [
        { type: 'sine', start: 0, stop: 0.24, from: 920, to: 1240 },
        { type: 'triangle', start: 0.03, stop: 0.28, from: 660, to: 920 },
        { type: 'sine', start: 0.18, stop: 0.44, from: 1180, to: 1520 },
      ],
      gain: [
        [0.0001, 0],
        [0.14, 0.02],
        [0.05, 0.12],
        [0.18, 0.21],
        [0.0001, 0.44],
      ],
    };
  }

  if (normalized === 'horno') {
    return {
      vibrate: [220, 70, 220, 70, 320],
      peaks: [
        { type: 'triangle', start: 0, stop: 0.3, from: 540, to: 680 },
        { type: 'sine', start: 0.05, stop: 0.34, from: 720, to: 920 },
        { type: 'square', start: 0.2, stop: 0.56, from: 860, to: 1140 },
      ],
      gain: [
        [0.0001, 0],
        [0.18, 0.03],
        [0.07, 0.17],
        [0.2, 0.28],
        [0.0001, 0.56],
      ],
    };
  }

  if (normalized === 'test') {
    return {
      vibrate: [180, 70, 240, 70, 320],
      peaks: [
        { type: 'sine', start: 0, stop: 0.28, from: 780, to: 980 },
        { type: 'triangle', start: 0.02, stop: 0.34, from: 520, to: 720 },
        { type: 'sine', start: 0.22, stop: 0.52, from: 980, to: 1220 },
      ],
      gain: [
        [0.0001, 0],
        [0.16, 0.03],
        [0.06, 0.18],
        [0.18, 0.26],
        [0.0001, 0.52],
      ],
    };
  }

  return {
    vibrate: [160, 60, 220, 60, 260],
    peaks: [
      { type: 'sine', start: 0, stop: 0.24, from: 700, to: 860 },
      { type: 'triangle', start: 0.03, stop: 0.28, from: 460, to: 620 },
      { type: 'sine', start: 0.2, stop: 0.46, from: 900, to: 1100 },
    ],
    gain: [
      [0.0001, 0],
      [0.14, 0.03],
      [0.05, 0.16],
      [0.16, 0.24],
      [0.0001, 0.46],
    ],
  };
}

function reserveFeedbackSlot(force = false, windowMs = 1200) {
  const now = Date.now();
  if (!force && now - lastFeedbackAt < windowMs) {
    return false;
  }

  lastFeedbackAt = now;
  return true;
}

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
}

async function playTeamNotificationSoundInternal(profile = 'service') {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  try {
    if (context.state === 'suspended') {
      await context.resume();
    }

    const config = getFeedbackProfile(profile);
    const now = context.currentTime;
    const gain = context.createGain();
    config.gain.forEach(([value, offset], index) => {
      if (index === 0) {
        gain.gain.setValueAtTime(value, now + offset);
        return;
      }

      gain.gain.exponentialRampToValueAtTime(value, now + offset);
    });

    config.peaks.forEach((peak) => {
      const oscillator = context.createOscillator();
      oscillator.type = peak.type;
      oscillator.frequency.setValueAtTime(peak.from, now + peak.start);
      oscillator.frequency.exponentialRampToValueAtTime(peak.to, now + peak.stop);
      oscillator.connect(gain);
      oscillator.start(now + peak.start);
      oscillator.stop(now + peak.stop);
    });

    gain.connect(context.destination);
  } catch {
    // Ignore local audio failures.
  }
}

export async function playTeamNotificationSound(enabled = true, options = {}) {
  const { force = false, reserveSlot = true, profile = 'service' } = options;

  if (!enabled) {
    return;
  }

  if (reserveSlot && !reserveFeedbackSlot(force)) {
    return;
  }

  await playTeamNotificationSoundInternal(profile);
}

export function triggerTeamVibration(enabled = true, options = {}) {
  const { force = false, reserveSlot = true, profile = 'service' } = options;

  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  if (reserveSlot && !reserveFeedbackSlot(force)) {
    return;
  }

  try {
    navigator.vibrate(getFeedbackProfile(profile).vibrate);
  } catch {
    // Ignore vibration failures.
  }
}

export async function triggerTeamAttentionFeedback({
  soundEnabled = true,
  vibrationEnabled = true,
  force = false,
  profile = 'service',
} = {}) {
  if (!reserveFeedbackSlot(force)) {
    return;
  }

  triggerTeamVibration(vibrationEnabled, { reserveSlot: false, profile });
  await playTeamNotificationSound(soundEnabled, { reserveSlot: false, profile });
}
