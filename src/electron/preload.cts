const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  // 这些可以被UI使用
  subscribeStatistics: (callback) =>
    ipcOn('statistics', (stats) => {
      callback(stats);
    }),
  getStaticData: () => ipcInvoke('getStaticData'),
  sendAudioData: (audioData) => ipcInvoke('sendAudio', audioData),
  sendTextData: (type, text) => ipcInvoke('sendText', { type, text }),
  
  // ipc
  ipcRenderer: {
    on: (channel, func) => electron.ipcRenderer.on(channel, func),
    once: (channel, func) => electron.ipcRenderer.once(channel, func),
    removeListener: (channel, func) => electron.ipcRenderer.removeListener(channel, func),
  },
} satisfies Window['electron']
);


function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  data?: any  // 添加可选参数
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, data);
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
