import { NextRequest, NextResponse } from 'next/server';

// Generate a proper WAV file with sine wave audio (more universally supported than MP3)
function generateWavFile(durationSeconds: number = 5): ArrayBuffer {
  const sampleRate = 44100;
  const samples = sampleRate * durationSeconds;
  const frequency = 440; // A4 note (spiritual frequency)
  
  // Optional: add a second frequency for richness
  const frequency2 = 528; // Healing frequency
  
  // Create WAV header
  const channels = 1;
  const bytesPerSample = 2;
  const byteRate = sampleRate * channels * bytesPerSample;
  const blockAlign = channels * bytesPerSample;
  const dataSize = samples * channels * bytesPerSample;

  const wavSize = 36 + dataSize;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header helper
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, wavSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate audio data (blended sine waves with fade in/out)
  let sampleIndex = 44;
  const fadeIn = sampleRate * 0.2; // 200ms fade in
  const fadeOut = sampleRate * 0.2; // 200ms fade out
  
  for (let i = 0; i < samples; i++) {
    // Create fade envelope
    let envelope = 1.0;
    if (i < fadeIn) {
      envelope = i / fadeIn; // Fade in
    } else if (i > samples - fadeOut) {
      envelope = (samples - i) / fadeOut; // Fade out
    }
    
    // Blend two frequencies
    const sine1 = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    const sine2 = Math.sin((2 * Math.PI * frequency2 * i) / sampleRate);
    const value = (sine1 * 0.7 + sine2 * 0.3) * envelope * 0.8; // Mix with envelope
    
    // Convert to 16-bit PCM
    const sample = Math.max(-1, Math.min(1, value)) * 0x7fff;
    view.setInt16(sampleIndex, sample, true);
    sampleIndex += 2;
  }

  return buffer;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Parse duration from query or use default
    const duration = parseInt(request.nextUrl.searchParams.get('duration') || '5', 10);
    
    // Generate WAV audio data
    const audioBuffer = generateWavFile(Math.min(duration, 30)); // Cap at 30 seconds

    // Return as audio/wav with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
