/**
 * Generates a simple notification chime as a WAV file.
 * Run: node scripts/generate-notification-sound.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 1.2; // seconds
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

// Generate a two-tone chime: 880Hz then 1175Hz (A5 then D6)
function generateSamples() {
  const samples = new Float64Array(NUM_SAMPLES);
  const tone1End = Math.floor(NUM_SAMPLES * 0.45);
  const tone2Start = Math.floor(NUM_SAMPLES * 0.5);
  const fadeLen = Math.floor(NUM_SAMPLES * 0.05);

  for (let i = 0; i < NUM_SAMPLES; i++) {
    let sample = 0;
    const t = i / SAMPLE_RATE;

    // Tone 1: 880Hz (A5) — first 45%
    if (i < tone1End) {
      let envelope = 1.0;
      // Attack
      if (i < fadeLen) envelope = i / fadeLen;
      // Release
      if (i > tone1End - fadeLen) envelope = (tone1End - i) / fadeLen;
      sample = 0.6 * envelope * Math.sin(2 * Math.PI * 880 * t);
    }

    // Tone 2: 1175Hz (D6) — from 50% to end
    if (i >= tone2Start) {
      let envelope = 1.0;
      // Attack
      if (i < tone2Start + fadeLen) envelope = (i - tone2Start) / fadeLen;
      // Release
      const releaseStart = NUM_SAMPLES - fadeLen;
      if (i > releaseStart) envelope = (NUM_SAMPLES - i) / fadeLen;
      sample += 0.5 * envelope * Math.sin(2 * Math.PI * 1175 * t);
    }

    // Clamp
    samples[i] = Math.max(-1, Math.min(1, sample));
  }
  return samples;
}

function writeWav(filePath, samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const fileSize = 36 + dataSize;

  const buf = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buf.write('RIFF', offset); offset += 4;
  buf.writeUInt32LE(fileSize, offset); offset += 4;
  buf.write('WAVE', offset); offset += 4;

  // fmt chunk
  buf.write('fmt ', offset); offset += 4;
  buf.writeUInt32LE(16, offset); offset += 4; // chunk size
  buf.writeUInt16LE(1, offset); offset += 2; // PCM format
  buf.writeUInt16LE(numChannels, offset); offset += 2;
  buf.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
  buf.writeUInt32LE(byteRate, offset); offset += 4;
  buf.writeUInt16LE(blockAlign, offset); offset += 2;
  buf.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data chunk
  buf.write('data', offset); offset += 4;
  buf.writeUInt32LE(dataSize, offset); offset += 4;

  // Write PCM samples
  for (let i = 0; i < samples.length; i++) {
    const val = Math.round(samples[i] * 32767);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, val)), offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buf);
  console.log(`Written: ${filePath} (${buf.length} bytes)`);
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });
const samples = generateSamples();
writeWav(path.join(outDir, 'ride_request.wav'), samples);
console.log('Done. Place this file in android/app/src/main/res/raw/ride_request.wav after expo prebuild.');
