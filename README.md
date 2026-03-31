<p align="center">
  <img src="image.png" width="160"">
</p>

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
