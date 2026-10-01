# ShivHeadphones // Premium Audio Architecture

A 3D interactive, scroll-driven web experience showcasing ShivHeadphones with beryllium driver topology, real-time 3D canvas viewport, dynamic DSP audio telemetry, interactive finish matrix, and an Explore catalog.

## Tech Stack
- **Framework**: HTML5, Vanilla JavaScript (ES Modules), Tailwind CSS
- **3D / Animations**: Three.js, Canvas frame sequencer
- **Bundler & Dev Server**: Vite
- **Deployment**: Vercel ready

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
npm install
```

### Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```
The output files will be built in the `dist` directory.

### Deploying to Vercel
1. Import this repository in [Vercel](https://vercel.com).
2. Framework Preset will be automatically detected as **Vite**.
3. Build Command: `vite build` (or `npm run build`).
4. Output Directory: `dist`.
5. Click **Deploy**.
