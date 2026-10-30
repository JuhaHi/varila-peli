// Web Audio API Sound Synthesizer for Tapaus Värilä 1888
class SoundFX {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private noiseGain: GainNode | null = null;
  private radioOsc: OscillatorNode | null = null;
  private radioGain: GainNode | null = null;
  public soundEnabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleSound(enabled?: boolean) {
    this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
    if (!this.soundEnabled) {
      this.stopRadioStatic();
    }
    return this.soundEnabled;
  }

  public playKeyClick() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playTerminalBeep(freq = 880, duration = 0.1) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context catch
    }
  }

  public playSuccess() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
      });
    } catch {
      // Audio context catch
    }
  }

  public playFailure() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context catch
    }
  }

  public playNFCSuccess() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // High-tech sci-fi scanner unlock sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.4);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(3520, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio context catch
    }
  }

  // Radio Static / Heterodyne scanner
  public startRadioStatic(targetFreqDelta = 100) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.stopRadioStatic();

    try {
      // White noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter to simulate analog radio
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      this.noiseGain = ctx.createGain();
      // Noise is louder when far from target frequency
      const noiseLevel = Math.min(0.2, Math.max(0.03, Math.abs(targetFreqDelta) / 500));
      this.noiseGain.gain.setValueAtTime(noiseLevel, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.noiseGain);
      this.noiseGain.connect(ctx.destination);
      whiteNoise.start();
      this.noiseNode = whiteNoise;

      // Heterodyne whistle osc (whistle changes pitch with tuning delta)
      this.radioOsc = ctx.createOscillator();
      this.radioOsc.type = 'sine';
      const whistleFreq = Math.max(100, Math.min(4000, 300 + Math.abs(targetFreqDelta) * 15));
      this.radioOsc.frequency.setValueAtTime(whistleFreq, ctx.currentTime);

      this.radioGain = ctx.createGain();
      // Whistle is most audible near target frequency
      const whistleVolume = Math.abs(targetFreqDelta) < 30 ? (1 - Math.abs(targetFreqDelta) / 30) * 0.15 : 0.01;
      this.radioGain.gain.setValueAtTime(whistleVolume, ctx.currentTime);

      this.radioOsc.connect(this.radioGain);
      this.radioGain.connect(ctx.destination);
      this.radioOsc.start();
    } catch {
      // Catch autoplay
    }
  }

  public updateRadioTuning(targetFreqDelta: number) {
    if (!this.soundEnabled || !this.ctx) return;
    const ctx = this.ctx;

    try {
      if (this.noiseGain) {
        const noiseLevel = Math.min(0.18, Math.max(0.02, Math.abs(targetFreqDelta) / 400));
        this.noiseGain.gain.setTargetAtTime(noiseLevel, ctx.currentTime, 0.05);
      }
      if (this.radioOsc && this.radioGain) {
        const whistleFreq = Math.max(100, Math.min(4000, 300 + Math.abs(targetFreqDelta) * 20));
        this.radioOsc.frequency.setTargetAtTime(whistleFreq, ctx.currentTime, 0.05);

        const whistleVolume = Math.abs(targetFreqDelta) < 30 ? (1 - Math.abs(targetFreqDelta) / 30) * 0.18 : 0.01;
        this.radioGain.gain.setTargetAtTime(whistleVolume, ctx.currentTime, 0.05);
      }
    } catch {
      // Safe catch
    }
  }

  public stopRadioStatic() {
    try {
      if (this.noiseNode) {
        (this.noiseNode as AudioScheduledSourceNode).stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.radioOsc) {
        this.radioOsc.stop();
        this.radioOsc.disconnect();
        this.radioOsc = null;
      }
    } catch {
      // Safe ignore
    }
  }

  public playMorseLetter(pattern: string) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    let time = ctx.currentTime;
    const unit = 0.08; // dot length

    for (const char of pattern) {
      const isDash = char === '-';
      const duration = isDash ? unit * 3 : unit;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.setValueAtTime(0.1, time + 0.005);
      gain.gain.setValueAtTime(0.1, time + duration - 0.005);
      gain.gain.setValueAtTime(0, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);

      time += duration + unit; // pause between parts
    }
  }
}

export const soundFX = new SoundFX();
