/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Module: Real-Time Audio Chime Synthesizer (Web Audio API)
 * ==============================================================================
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Check user preferences in localStorage
    const saved = localStorage.getItem('lifeline_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('lifeline_sound_enabled', String(this.soundEnabled));
    if (this.soundEnabled) {
      this.playStatusBlip();
    }
    return this.soundEnabled;
  }

  private getAudioContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    try {
      if (!this.ctx || this.ctx.state === 'suspended') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Plays a distinct, professional two-tone emergency dispatch alert chime.
   * (Frequencies 880 Hz -> 1174 Hz, soft sine tone, gentle decay)
   */
  public playEmergencyAlert() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1 (A5: 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2 (D6: 1174.66Hz) - slightly louder for emergency emphasis
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.16);
      gain2.gain.setValueAtTime(0.22, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.6);
    } catch {
      // Audio playback fails gracefully if browser requires user gesture
    }
  }

  /**
   * Plays a subtle, clean single-tone status update blip.
   * (Frequency 587 Hz, soft ramp)
   */
  public playStatusBlip() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Graceful fallback
    }
  }
}

export const soundManager = new SoundSynthesizer();
