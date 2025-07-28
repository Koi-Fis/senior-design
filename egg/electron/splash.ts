// splash.ts
import { BrowserWindow } from 'electron'

let splash: BrowserWindow | null = null

export function createSplashWindow(): BrowserWindow {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Create splash screen HTML content
  const splashHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-image: linear-gradient(to right top, #00A86F,  #144e38);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            overflow: hidden;
          }
          .splash-content {
            text-align: center;
          }
          .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 20px;
            animation: fadeIn 0.8s ease-in;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          .loading-text {
            font-size: 14px;
            opacity: 0.8;
            animation: fadeIn 1.2s ease-in;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="splash-content">
          <div class="logo">E.G.G</div>
          <div class="spinner"></div>
          <div class="loading-text">Loading...</div>
        </div>
      </body>
    </html>
  `

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`)

  // Handle splash window closed event
  splash.on('closed', () => {
    splash = null
  })

  return splash
}

export function closeSplashWindow(): void {
  if (splash && !splash.isDestroyed()) {
    splash.close()
    splash = null
  }
}

export function getSplashWindow(): BrowserWindow | null {
  return splash
}

export function isSplashWindowOpen(): boolean {
  return splash !== null && !splash.isDestroyed()
}