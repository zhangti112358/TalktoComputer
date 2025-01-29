const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  // 这些可以被UI使用
  subscribeStatistics: (callback) =>
    ipcOn('statistics', (stats) => {
      callback(stats);
    }),
  getStaticData: () => ipcInvoke('getStaticData'),
} satisfies Window['electron']
);


function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key);
}

// ipc on 返回取消订阅函数
function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}
