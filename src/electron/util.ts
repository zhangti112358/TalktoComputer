import { ipcMain, WebContents } from "electron";

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

// UI调用主进程
// 这样把事件名和事件参数的类型绑定在一起。是在EventPayloadMapping中定义好的，类型安全
export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => EventPayloadMapping[Key]
) {
  ipcMain.handle(key, () => handler());
}

// 主进程向UI进程发送消息
export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}