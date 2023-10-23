import { contextBridge } from 'electron'
contextBridge.exposeInMainWorld('myAPI', {
  doSome: () => alert(1)
})

window.myAPI.doSome()