
// Simple Web Audio API Synthesizer
// This avoids the need for external MP3 files

let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

type SoundType = 'click' | 'pop' | 'success' | 'wrong' | 'start' | 'powerup';

export const playSfx = (type: SoundType) => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        // High pitched short blip for UI buttons
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'pop':
        // Hollow wooden pop for bond interaction
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'success':
        // Major Arpeggio (C-E-G)
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        
        // Note 1
        osc.frequency.setValueAtTime(523.25, now); // C5
        // Note 2
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        // Note 3
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        
        osc.start(now);
        osc.stop(now + 0.6);
        break;

      case 'wrong':
        // Low buzzing sawtooth slide
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'start':
        // Futuristic sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'powerup':
        // Fast high pitch wobble
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
        osc.frequency.linearRampToValueAtTime(600, now + 0.2);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  } catch (e) {
    console.error("Audio playback error", e);
  }
};
