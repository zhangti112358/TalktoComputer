import { Buffer } from 'buffer';
import { getWaveBlob, WavRecorder } from "webm-to-wav-converter";
import { useState, useEffect, useRef, useContext, createContext } from "react";

import { useGlobalState, GlobalStateProvider } from './globalState';
import { WAV_SAMPLE_RATE, WAV_BITS_PER_SAMPLE, WAV_CHANNELS } from '@/electron/define.ts';

// 音频处理工具类
export class MediaUtils {
  static async webm2wav(webmBlob: Blob, sampleRate: number, bitsPerSample: number, channels: number): Promise<Buffer> {
    // webmBlob 转换为 wavBlob
    let f32_flag = true;
    if (bitsPerSample == 16){
      f32_flag = false;
    }
    const audioBlob = await getWaveBlob(webmBlob, f32_flag, { sampleRate: sampleRate });
    
    // 获取buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);  // 注意：在渲染进程中，Buffer.from 实际上返回的是 Uint8Array

    // 添加 WAV 文件头，转换成 WAV 格式
    const wavBuffer = MediaUtils.audioBuffer2WavBuffer(buffer, sampleRate, bitsPerSample, channels);

    return wavBuffer;
  }

  // 创建 WAV 文件头
  static createWavHeader(sampleRate: number, bitsPerSample: number, channels: number, dataLength: number): Buffer {
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
  static audioBuffer2WavBuffer(audioBuffer: Buffer, sampleRate: number, bitsPerSample: number, channels: number): Buffer {
    // 创建 WAV 文件头
    const header = MediaUtils.createWavHeader(sampleRate, bitsPerSample, channels, audioBuffer.length);

    // 合并文件头和音频数据
    const wavBuffer = Buffer.concat([header, audioBuffer]);
    return wavBuffer;
  }
}


// 音频录制
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error("获取麦克风失败:", error);
      throw error;
    }
  }

  async stopRecording(): Promise<string> {
    
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve('');
        return;
      }

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        const audioBlobWebm = new Blob(this.audioChunks, { type: "audio/webm" });

        const wavBuffer = await MediaUtils.webm2wav(audioBlobWebm, WAV_SAMPLE_RATE, WAV_BITS_PER_SAMPLE, WAV_CHANNELS);
          
        // 传输给后端
        console.log('音频大小:', wavBuffer.length, '字节');
        const result = await window.electron.sendAudioData(wavBuffer);
        console.log('音频传输结果:', result);


        const audioUrl = URL.createObjectURL(audioBlobWebm);
        resolve(audioUrl);

      };

      this.mediaRecorder.stop();
    });
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

// 音频录制组件
export const AudioRecorderComponent = () => {
  
  const { recording, setRecording } = useGlobalState(); // recording使用全局状态中的
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder>(new AudioRecorder());

  useEffect(() => {
    // 注册事件监听器
    const startRecordingListener = () => {
      startRecording();
    };

    const stopRecordingListener = () => {
      stopRecording();
    };

    window.electron.ipcRenderer.on('startRecording', startRecordingListener);
    window.electron.ipcRenderer.on('stopRecording', stopRecordingListener);

    // 清理函数，组件卸载时移除监听器
    return () => {
      window.electron.ipcRenderer.removeListener('startRecording', startRecordingListener);
      window.electron.ipcRenderer.removeListener('stopRecording', stopRecordingListener);
    };
  }, []); // 空依赖数组，确保效果只运行一次


  const startRecording = async () => {
    try {
      // 如果存在之前的音频URL，先清理掉
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      await recorderRef.current.startRecording();
      setRecording(true);
    } catch (error) {
      console.error("录音失败:", error);
    }
  };

  const stopRecording = async () => {
    const audioUrl = await recorderRef.current.stopRecording();
    setAudioURL(audioUrl);
    setRecording(false);
  };

  // 组件卸载时清理URL
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  // 返回可视化录制音频的组件
  function view() {
    return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "停止录音" : "开始录音"}
      </button>
      {audioURL && (
        <div>
          <audio controls>
            <source src={audioURL} type="audio/webm" />
            你的浏览器不支持音频播放
          </audio>
          <a href={audioURL} download="recording.webm">
            下载音频
          </a>
        </div>
      )}
    </div>);
  }

  // 只有录音组件 无视图
  function noView() {
    return <></>;
  }

  // return view();
  return noView();

};
