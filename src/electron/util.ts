import { ipcMain, WebContents, WebFrameMain } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from 'url';

// 判断是否是开发模式
export function isDev(): boolean {
  // 对应运行electron命令 cross-env NODE_ENV=development electron .
  return process.env.NODE_ENV === 'development';
}

// 开发模式使用的端口号 对应vite.config.ts文件的端口
export function portDev(): string {
  return '12306';
}

// UI调用主进程
// 这样把事件名和事件参数的类型绑定在一起。是在EventPayloadMapping中定义好的，类型安全
export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<EventPayloadMapping[Key]> | EventPayloadMapping[Key]
) {
  
  ipcMain.handle(key, async (event, ...args) => {
    if (!event.senderFrame) {
      throw new Error('Event sender frame is null');
    }
    validateEventFrame(event.senderFrame);
    return handler(event, ...args);
});
}

// 主进程向UI进程发送消息
export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}

// 确认页面是由此程序生成的
export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === `localhost:${portDev()}`) {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error('Malicious event');
  }
}