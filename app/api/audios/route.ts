// Mock API route that returns sample audio URLs
// Replace these with your actual backend API endpoint

export async function GET() {
  // Sample audio files - replace with your actual Ethiopian Orthodox Church music URLs
  const audioUrls = [
    'https://assets.mixkit.co/active_storage/spree/audio_files/002/624/002/624/preview_hq.mp3?1564564534',
    'https://assets.mixkit.co/active_storage/spree/audio_files/002/625/002/625/preview_hq.mp3?1564565036',
    'https://assets.mixkit.co/active_storage/spree/audio_files/002/626/002/626/preview_hq.mp3?1564565566',
    'https://assets.mixkit.co/active_storage/spree/audio_files/002/627/002/627/preview_hq.mp3?1564566056',
    'https://assets.mixkit.co/active_storage/spree/audio_files/002/628/002/628/preview_hq.mp3?1564566558',
  ];

  return Response.json(audioUrls);
}
