const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  // 这些可以被UI使用
  subscribeStatistics: (callback) => {
    electron.ipcRenderer.on("statistics", (_:any, stats:any) => {
      callback(stats)
    })
  },
  getStaticData: () => electron.ipcRenderer.invoke('getStaticData'),
} satisfies Window['electron']);


function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}