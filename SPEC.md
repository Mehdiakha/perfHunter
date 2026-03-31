# Windows Performance Monitor

## 1. Project Overview
- **Project name**: Performance Monitor
- **Type**: Windows Desktop Application (Electron)
- **Core functionality**: Display real-time, detailed system metrics with interactive charts and expandable views
- **Target users**: Windows users who want comprehensive system monitoring

## 2. UI/UX Specification

### Layout Structure
- Single window, resizable: min 500x600, default 600x700
- Frameless window with custom title bar
- Two-panel layout: sidebar for navigation + main content area
- Sidebar: icon-based navigation (Dashboard, CPU, Memory, Disk, Network)

### Visual Design
- **Color palette**:
  - Background: #0d1117 (GitHub dark)
  - Card background: #161b22
  - Sidebar: #010409
  - Primary accent: #238636 (green)
  - Secondary accent: #1f6feb (blue)
  - Text primary: #c9d1d9
  - Text secondary: #8b949e
  - Border: #30363d
  - CPU: #f0883e (orange)
  - Memory: #58a6ff (light blue)
  - Disk: #bc8cff (purple)
  - Network: #3fb950 (green)
- **Typography**: Segoe UI, 12px small, 14px body, 18px headings, 28px large values
- **Spacing**: 12px padding, 16px gaps, 8px border-radius

### Components
1. **Title Bar**: App title, window controls (minimize, maximize, close)
2. **Sidebar**: Icon navigation with tooltips
3. **Dashboard View**: 4 metric cards with mini sparklines
4. **Detail Views**: Expandable sections for each metric with charts
5. **System Info**: OS version, uptime, hostname in footer

### Interactive Elements
- Click metric cards to expand detailed view
- Hover effects on all interactive elements
- Animated progress bars with gradient fills
- Line charts for historical data (last 60 seconds)
- Tooltips on hover showing exact values
- Smooth transitions between views (300ms ease)

## 3. Functional Specification

### Core Features
- Real-time metrics polling every 1 second
- Historical data storage (last 60 data points)
- Line charts with smooth curves
- Click to expand metric cards
- Top processes display
- System information panel

### Metrics Displayed

#### CPU
- Overall usage percentage
- Per-core usage (mini bars)
- CPU frequency (current/max)
- Temperature (if available)

#### Memory
- Used / Total (GB)
- Available memory
- Cached memory
- Usage percentage with chart

#### Disk
- Used / Total (GB) for each drive
- Read/Write activity (MB/s)
- Usage percentage with chart

#### Network
- Download/Upload speed (KB/s or MB/s)
- Total bytes transferred
- Active connections

### Data Flow
- Main process collects system stats via `systeminformation`
- IPC sends data to renderer every second
- Renderer maintains rolling 60-second history
- Charts render using Canvas API
- Smooth transitions between dashboard and detail views

## 4. Acceptance Criteria
- App launches and displays all 4 main metrics
- Clicking a metric card shows detailed view with chart
- Charts update in real-time with smooth animations
- Min/max/close buttons work correctly
- Window is draggable and resizable
- Historical data shows last 60 seconds
