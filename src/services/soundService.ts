/**
 * Sound Service — High-fidelity Web Audio API Sound Synthesizer
 * Provides zero-dependency, low-latency audio notifications for chat and realtime alerts.
 */

const STORAGE_KEY = 'sdk_sound_notifications_enabled';

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Load persisted preference (default: true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.isEnabled = saved !== null ? saved === 'true' : true;
    } catch {
      this.isEnabled = true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Could not persist sound preference:', e);
    }
  }

  public toggleSound(): boolean {
    this.setSoundEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  /**
   * Play subtle, modern dual-tone notification ping for incoming chat messages.
   * Tone 1: 587.33 Hz (D5) -> Tone 2: 880 Hz (A5)
   */
  public playMessageNotificationSound(): void {
    if (!this.isEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master Gain Node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      masterGain.connect(ctx.destination);

      // Oscillator 1 (Warm body tone)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // Glide to A5
      osc1.connect(masterGain);

      // Oscillator 2 (Sparkle harmonic chime)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.05); // D6
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.08, now + 0.05);
      osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(osc2Gain);
      osc2Gain.connect(masterGain);

      // Start & Stop
      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.35);
    } catch (err) {
      console.warn('Audio playback not permitted or failed:', err);
    }
  }

  /**
   * Play a brief success chime (e.g. task completed or approval)
   */
  public playSuccessChime(): void {
    if (!this.isEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      osc.connect(gain);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (err) {
      console.warn('Audio playback failed:', err);
    }
  }
}

export const soundService = new SoundService();
