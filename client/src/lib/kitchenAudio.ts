/**
 * Synthesize a luxury brass chime using Web Audio API
 * Avoids external MP3 assets and works natively in all modern browsers.
 */
export function playKitchenChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const playTone = (freq: number, start: number, duration: number, volume: number = 0.18) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Elegant two-tone bell chime: D5 (587.33Hz) -> A5 (880.00Hz)
    playTone(587.33, 0, 0.9, 0.15);
    playTone(880.0, 0.12, 1.4, 0.2);
  } catch {
    // Browser audio policy might block autoplay until user gesture
  }
}
