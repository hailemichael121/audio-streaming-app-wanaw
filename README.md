# Ethiopian Orthodox Church Music Streaming App

A mobile-first audio streaming application built with Next.js, React, and TypeScript. Designed for deployment as a Progressive Web App and compatible with Capacitor for native iOS and Android wrapping.

## Features

### Navigation & Information Architecture
- **Month Selection Screen**: Grid of 12 months with Amharic names
- **Day Selection Screen**: Days filtered by selected month
- **Category Selection Screen**: Two category options per day
- **Audio List Screen**: Searchable list of audios with play controls

### Audio Player
- **Persistent Bottom Player**: Fixed player visible across all screens
- **Play/Pause Controls**: Large thumb-friendly buttons
- **Seek Bar**: Scrubbable progress bar with current/total time
- **Skip Navigation**: Previous/next track buttons
- **Volume Control**: Volume indicator (ready for native integration)

### Search Functionality
- **Instant Client-Side Search**: Debounced search filtering
- **Scope**: Search within current month, day, and category
- **Touch-Optimized UI**: No hover interactions, mobile-first design

### Offline Downloads
- **Monthly Downloads**: Download entire months for offline access
- **Progress Tracking**: Visual progress indicators
- **Storage Management**: Monitor and manage offline storage
- **IndexedDB Storage**: Persistent file storage with fallback

### Background Playback
- **Media Session API**: Lock-screen media controls on mobile
- **Wake Lock**: Prevents screen from sleeping during playback
- **Background Audio**: Continues playing when app is minimized
- **Capacitor Integration Ready**: Ready for native Capacitor plugins

### Accessibility & Performance
- **Mobile-First Design**: Optimized for 360px+ screens
- **Touch-Friendly Controls**: 48px+ minimum touch targets
- **No Hover Dependencies**: Works perfectly on touch devices
- **Semantic HTML**: Proper ARIA roles and labels
- **Relative Units**: Uses rem/% for true responsive scaling

## Project Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout with AudioPlayerProvider
│   ├── page.tsx                # Month selection screen
│   ├── day/page.tsx            # Day selection screen
│   ├── category/page.tsx       # Category selection screen
│   ├── audios/page.tsx         # Audio list screen with search
│   ├── downloads/page.tsx      # Offline downloads management
│   ├── api/audios/route.ts     # Mock API endpoint
│   └── globals.css             # Tailwind theme with warm colors
├── components/
│   ├── AudioPlayer.tsx         # Persistent bottom player
│   ├── screens/
│   │   ├── MonthScreen.tsx     # Month grid selection
│   │   ├── DayScreen.tsx       # Day list selection
│   │   ├── CategoryScreen.tsx  # Category selection
│   │   ├── AudioListScreen.tsx # Audio list with search
│   │   └── DownloadsScreen.tsx # Download management
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── AudioContext.tsx        # Global audio state management
│   ├── offlineService.ts       # Offline download/storage service
│   └── mediaSessionService.ts  # Media Session API integration
└── public/
    └── [assets]
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19.2 with shadcn/ui components
- **Styling**: Tailwind CSS v4 with custom theme
- **State Management**: React Context API
- **Storage**: IndexedDB + localStorage
- **Type Safety**: TypeScript
- **Icons**: Lucide React

## Getting Started

### Installation

```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

The app runs on `http://localhost:3000` with hot-reload enabled.

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

## Capacitor Integration

The app is ready for Capacitor wrapping. To add native capabilities:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Add iOS/Android platforms
npx cap add ios
npx cap add android

# Sync web code to native projects
npx cap sync
```

### Required Capacitor Plugins for Full Functionality

1. **@capacitor/filesystem** - For offline file storage on native
2. **@capacitor/media** - For media session and background playback
3. **@capacitor/app** - For app lifecycle management

## API Integration

### Mock Audio Data
Currently using mock data generator. To integrate with real API:

1. Update `generateMockAudios()` in `AudioListScreen.tsx` to call your API
2. Replace audio URLs with actual backend endpoints
3. Update types in `/lib/types.ts` if needed

### Example API Structure Expected
```typescript
GET /api/audios?month=1&day=15&category=one
[
  {
    id: "string",
    title: "string",
    filename: "string",
    url: "string",
    duration: number
  }
]
```

## Design System

### Color Palette (Warm & Spiritual)
- **Primary**: Deep brown/amber (for sacred atmosphere)
- **Accent**: Warm gold/orange (highlights, active states)
- **Background**: Off-white/cream (easy on eyes)
- **Neutrals**: Grays for secondary content

### Typography
- **Sans-serif**: Geist (headings & body)
- **Monospace**: Geist Mono (code)

### Spacing
- Based on 4px grid
- Uses Tailwind scale: 4px, 8px, 12px, 16px, 20px, 24px, etc.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Mobile browsers: Chrome, Firefox, Safari on iOS 14.5+

## Key Implementation Details

### Audio Playback
- Uses HTML5 Audio API for playback
- Implements proper CORS headers
- Handles browser autoplay policies gracefully

### State Management
- Global state via React Context (AudioContext)
- No third-party state library required
- Scales well for the feature set

### Offline Storage
- IndexedDB for persistent blob storage
- localStorage for quick object URL access
- Automatic cleanup with cache invalidation

### Media Controls
- Media Session API for lock-screen controls
- Wake Lock API to prevent screen sleep
- Respects Do Not Disturb settings

## Performance Optimizations

- Code splitting via Next.js automatic route splitting
- Image optimization with next/image (when used)
- Minimal JavaScript bundle
- CSS-in-JS compiled to static CSS

## Accessibility Features

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Touch-friendly minimum 48px targets
- Screen reader optimized text

## Troubleshooting

### Audio Won't Play
- Check browser autoplay policy (requires user gesture)
- Verify CORS headers on audio files
- Check browser console for errors

### Offline Downloads Not Working
- Verify IndexedDB is enabled
- Check available storage quota
- Look for browser storage permission issues

### Background Playback Not Continuing
- Media Session API not available in all browsers
- Ensure app has proper background permission
- Check Capacitor configuration on native

## Future Enhancements

- [ ] Lyrics display synchronized with playback
- [ ] Favorite/bookmark functionality
- [ ] Sharing capabilities
- [ ] User progress tracking
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Streaming quality selection
- [ ] Playlist creation

## License

[Your License Here]

## Contributing

[Contribution Guidelines Here]
