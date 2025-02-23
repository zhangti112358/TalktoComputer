import { app, BrowserWindow, globalShortcut, ipcMain, systemPreferences } from 'electron';
import { GlobalKeyboardListener } from "node-global-key-listener";
import fs from 'fs';
import path from 'path';

import { ipcMainHandle, isDev, portDev } from './util.js'
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { pollResources, getStaticData } from './resourceManager.js';
import { im } from 'mathjs';
import { SiliconFlow, SiliconFlowKeyDefault } from './computer/siliconflow.js';

import { VOICE_INPUT_SHORTCUT, WAV_SAMPLE_RATE, WAV_BITS_PER_SAMPLE, WAV_CHANNELS } from './define.js';

// 语音输入快捷键
const voiceInputShortcut = VOICE_INPUT_SHORTCUT;
const hasMicrophonePermission = systemPreferences.getMediaAccessStatus('microphone') === 'granted';


// 添加创建 WAV 文件头的函数
function createWavHeader(sampleRate: number, bitsPerSample: number, channels: number, dataLength: number) {
  const buffer = Buffer.alloc(44);
  
  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);  // 文件大小
  buffer.write('WAVE', 8);
  
  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);  // fmt chunk size
  buffer.writeUInt16LE(1, 20);   // audio format (PCM)
  buffer.writeUInt16LE(channels, 22);  // 声道数
  buffer.writeUInt32LE(sampleRate, 24);  // 采样率
  buffer.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);  // byte rate
  buffer.writeUInt16LE((channels * bitsPerSample) / 8, 32);  // block align
  buffer.writeUInt16LE(bitsPerSample, 34);  // bits per sample
  
  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  
  return buffer;
}

// 给音频数据添加 WAV 文件头，转换成 WAV 格式
async function audioBuffer2WavBuffer(audioBuffer: Buffer): Promise<Buffer> {
    // 创建 WAV 文件头
    const sampleRate = WAV_SAMPLE_RATE;  // 采样率
    const bitsPerSample = WAV_BITS_PER_SAMPLE;  // 位深度
    const channels = WAV_CHANNELS;        // 单声道
    const header = createWavHeader(sampleRate, bitsPerSample, channels, audioBuffer.length);
    
    // 合并文件头和音频数据
    const wavBuffer = Buffer.concat([header, audioBuffer]);
    return wavBuffer;
}

// 字符保存文件
async function saveTextToFile(text: string, filePath: string) {
      // 随便创建一个buffer保存，字符串转buffer
      const buffer = Buffer.from(text);
      await fs.promises.writeFile(filePath, buffer);
}


app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    }
  });

  // console.log('hasMicrophonePermission', hasMicrophonePermission);

  if (isDev()){
    // 区分开发过程，实时加载代码修改
    // electron 启动界面，内容从端口读取 内容由React实时创建
    mainWindow.loadURL(`http://localhost:${portDev()}`);
  }
  else {
    // 加载UI 一个html页面
    mainWindow.loadFile(getUIPath());
  }

  // pollResources(mainWindow); // 资源监控（前后端交互示例）

  // 用ipcHandle代替上面的代码 类型安全
  ipcMainHandle('getStaticData', () => {
    return getStaticData();
  });

  // 当按下快捷键时，开始语音输入
  let voiceInputFlag = false;
  const v = new GlobalKeyboardListener();
  // 监听快捷键
  v.addListener(function (e, down) {
    // console.log(`Key pressed: ${e.name}, state: ${e.state}`);
    if (e.name === voiceInputShortcut) {
      // 如果已经按下，等待抬起停止
      if (voiceInputFlag) {
        if (e.state === 'UP'){
          mainWindow.webContents.send('stopRecording');
          voiceInputFlag = false;
        }
      }
      // 如果没有按下，等待按下操作
      else {
        if (e.state === 'DOWN'){
          mainWindow.webContents.send('startRecording');
          voiceInputFlag = true;
        }
      }
    }
  });

  // ipcMainHandle('sendAudio', (audioData) => {
  //   return getStaticData();
  // });
  let siliconflow =  new SiliconFlow(SiliconFlowKeyDefault());
// 在 main.ts 中
  ipcMain.handle('sendAudio', async (event, audioData: Buffer) => {
    try {
      const wavBuffer = await audioBuffer2WavBuffer(audioData);

      // debug 
      // const audioPath ='./audio.wav';
      // await fs.promises.writeFile(audioPath, wavBuffer);
      // console.log('audioPath', audioPath);

      // 语音识别
      const result = await siliconflow.speechWavToText(wavBuffer);
      console.log('result', result);
      // console.log('sampleRate', WAV_SAMPLE_RATE);

      return { success: true };
    } catch(err: any) {
      return { success: false, error: err.message };
    }
  });

});
