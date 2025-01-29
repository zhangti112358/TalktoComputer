import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import { ipcMainHandle, isDev, portDev } from './util.js'
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { pollResources, getStaticData } from './resourceManager.js';
import { get } from 'http';

type test = string;

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    }
  });

  if (isDev()){
    // 区分开发过程，实时加载代码修改
    // electron 启动界面，内容从端口读取 内容由React实时创建
    mainWindow.loadURL(`http://localhost:${portDev()}`);
  }
  else {
    // 加载UI 一个html页面
    mainWindow.loadFile(getUIPath());
  }

  pollResources(mainWindow);

  // UI进程从主进程获取数据 UI调用getStaticData，主进程调用getStaticData并返回数据
  // ipcMain.handle('getStaticData', () => {
  //   return getStaticData();
  // });
  // 用ipcHandle代替上面的代码 类型安全
  ipcMainHandle('getStaticData', () => {
    return getStaticData();
  });

});
