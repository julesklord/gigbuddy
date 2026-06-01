<table border="0">
  <tr>
    <td width="200" align="center" valign="top">
      <img src="shot.png" width="180" alt="gigBuddy logo">
    </td>
    <td valign="top">
      <h1>gigBuddy</h1>
      <p><strong>Real-time music dashboard</strong><br/>
      <em>Synchronizes setlists, lyrics, and chords while controlling Spotify and YouTube Music playback.</em></p>
      <p>
        <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License Apache 2.0"></a>
        <img src="https://img.shields.io/badge/status-development-orange" alt="Status">
        <img src="https://img.shields.io/badge/tech-React%20%2B%20Firebase-yellow" alt="Tech Stack">
      </p>
    </td>
  </tr>
</table>

---

## Features

- **Sync:** Real-time setlist, lyric, and chord synchronization across devices.
- **Media Control:** Direct Spotify and YouTube Music playback control from the interface.
- **Access:** Offline support for cached stage data.
- **Interface:** High-contrast, touch-optimized UI for live performance.

---

## Documentation

The **[Wiki](docs/wiki/index.md)** contains technical specifications, architectural ADRs, and guides.

*   **[Data Schema](docs/wiki/schema.json)**
*   **[Contributing Guide](docs/wiki/CONTRIBUTING.md)**
*   **[Agent SOP](docs/AGENT.md)**

---

## Installation

### Prerequisites
- Node.js (v18+).
- Firebase Project.
- (Optional) Spotify and YouTube developer credentials.

### Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd gigbuddy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env.local`.
   - Add Firebase, Spotify, and YouTube credentials.

4. **Initialize Firebase:**
   - Configure Firestore security rules using `firestore.rules`.
   - Set up initial data with `firebase-blueprint.json`.

5. **Execute Locally:**
   ```bash
   npm run dev
   ```

## Deployment

Deploy the application to Vercel, Netlify, or Firebase Hosting. Ensure environment variables are configured in the deployment platform.

## License

Apache License 2.0. See [LICENSE](LICENSE).
