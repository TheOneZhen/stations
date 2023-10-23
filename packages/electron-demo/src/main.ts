import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { app as main, BrowserWindow } from 'electron'

const app = createApp(App)

app.use(router)

app.mount('#app')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })
  win.loadFile('../index.html')
}

main.whenReady().then(() => {
  createWindow()
  main.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})