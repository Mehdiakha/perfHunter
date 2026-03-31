# Performance Monitor

A simple, interactive Windows performance monitor built with Electron.

## Features

- **Real-time metrics**: CPU, Memory, Disk, Network usage
- **Historical charts**: 60-second rolling history with smooth animations
- **Per-core CPU monitoring**
- **Top processes by CPU usage**
- **System information display**

## Development

### Install dependencies
```bash
npm install
```

### Run in development mode
```bash
npm start
# or
npm run dev
```

## Building Executable

### Install build dependencies
```bash
npm install
```

### Build for Windows

```bash
npm run build
```

This creates two outputs in the `dist` folder:
- **Installer**: `Performance Monitor Setup x.x.x.exe` - Traditional Windows installer
- **Portable**: `Performance Monitor.exe` - Single executable, no installation needed

### Build output directory only (faster)
```bash
npm run build-dir
```

## File Structure

```
performance-monitor/
├── main.js          # Main process (system metrics collection)
├── preload.js       # Secure bridge between main and renderer
├── index.html       # UI structure
├── styles.css       # Styling
├── renderer.js      # UI logic and charts
├── package.json     # Dependencies and build config
└── dist/            # Built executables
```

## How It Works

### Main Process (`main.js`)
- Runs in Node.js
- Collects system metrics using `systeminformation`
- Sends data to renderer via IPC every second
- Handles window management

### Preload Script (`preload.js`)
- Security bridge between main and renderer
- Exposes safe APIs to renderer

### Renderer Process (`renderer.js`)
- Runs in Chromium (Chrome browser)
- Updates UI based on received data
- Draws charts using Canvas API
- Handles user interactions

## Adding an Icon

1. Create a 256x256 PNG image
2. Convert to ICO format using an online tool
3. Name it `icon.ico` and place in project root
4. Rebuild with `npm run build`
