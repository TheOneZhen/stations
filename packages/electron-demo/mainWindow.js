import { app, BrowserWindow, Notification } from 'electron'

function show () {
  new Notification({
    title: "haha",
    body: "haha"
  }).show()
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: './info.js'
    }
  })
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  show()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})