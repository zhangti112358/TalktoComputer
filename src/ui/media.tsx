import { Buffer } from 'buffer';
import { getWaveBlob } from "webm-to-wav-converter";
import { useState, useEffect, useRef, useCallback } from "react";
import { MicVAD } from "@ricky0123/vad-web";

import { useGlobalState } from './globalState';
import { WAV_SAMPLE_RATE, WAV_BITS_PER_SAMPLE, WAV_CHANNELS } from '@/electron/computer/define';

// 音频处理工具类
export class MediaUtils {
  // 新增：将 Float32Array 直接转换为 Wav Buffer
  static float32ToWav(f32Array: Float32Array, sampleRate: number, bitsPerSample: number, channels: number): Buffer {
    let pcmBuffer: Buffer;
    
    if (bitsPerSample === 16) {
      // 转换为 Int16
      const int16Array = new Int16Array(f32Array.length);
      for (let i = 0; i < f32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, f32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      pcmBuffer = Buffer.from(int16Array.buffer);
    } else {
      // 保持 Float32
      pcmBuffer = Buffer.from(f32Array.buffer);
    }

    return MediaUtils.audioBuffer2WavBuffer(pcmBuffer, sampleRate, bitsPerSample, channels);
  }

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
        // console.log('音频大小:', wavBuffer.length, '字节');
        const result = await window.electron.sendAudioData(wavBuffer);
        console.log(result);

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
  
  const { recording, setRecording, autoRecord, setAutoRecord } = useGlobalState(); // 假设 globalState 中有 autoRecord
  const [audioURL, setAudioURL] = useState<string | null>(null);
  // 新增：专门用于标记是否正在进行手动录音的状态
  const [isManualRecording, setIsManualRecording] = useState(false);

  const recorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const vadRef = useRef<any>(null);

  const { hasInitializedRecoder } = useGlobalState();

  const startRecording = useCallback(async () => {
    // 1. 防抖检查
    if (recorderRef.current.getIsRecording()) {
      console.log("正在录音中，忽略重复的开始请求");
      return;
    }

    try {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }

      // 2. 标记确认为手动录音模式
      // 这会触发下方的 useEffect，自动安全地暂停/销毁 VAD
      setIsManualRecording(true);

      // 双重保险：虽然 Effect 会跑，但立即暂停它是最安全的
      if (vadRef.current) {
        vadRef.current.pause();
      }

      await recorderRef.current.startRecording();
      setRecording(true);
    } catch (error) {
      console.error("录音失败:", error);
      setIsManualRecording(false);
    }
  }, [audioURL, setRecording]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current.getIsRecording()) return;
    
    const audioUrl = await recorderRef.current.stopRecording();
    setAudioURL(audioUrl);
    setRecording(false);

    // 3. 手动录音结束，退出手动模式
    // 这会触发下方的 useEffect，如果 autoRecord 开着，它会自动将 VAD 恢复/重建
    setIsManualRecording(false);

  }, [setRecording]); 

  useEffect(() => {
    let isAborted = false; // 标志位：当前 effect 是否已被清理
    let isProcessing = false; // 定义处理状态标志位

    // 处理 VAD 逻辑
    const initVAD = async () => {
      // 只有在 (autoRecord 为 true) 且 (不在手动录音中) 时才初始化 VAD
      if (autoRecord && !isManualRecording) {
        
        try {
          const vadInstance = await MicVAD.new({
            preSpeechPadMs: 500, 
            positiveSpeechThreshold: 0.7, 
            minSpeechMs: 300, 
            onSpeechStart: () => {
              // 三重保险拦截
              if (isManualRecording) return;
              console.log(`[${new Date().toLocaleTimeString()}] UI: VAD 检测到语音开始`);
              setRecording(true);
            },
            onSpeechEnd: async (audio: Float32Array) => {
              // 三重保险拦截
              if (isManualRecording) return;
              console.log(`[${new Date().toLocaleTimeString()}] UI: VAD 检测到语音结束`);
              setRecording(false);
              
              if (isProcessing) {
                console.warn("VAD: 正在处理中，忽略此次重复触发");
                return;
              }

              if (audio.length < 8000) { 
                console.log("VAD: 音频过短，忽略发送");
                return;
              }

              try {
                isProcessing = true;
                const wavBuffer = MediaUtils.float32ToWav(
                  audio, 
                  16000, 
                  WAV_BITS_PER_SAMPLE, 
                  WAV_CHANNELS
                );
                
                console.log(`[${new Date().toLocaleTimeString()}] UI: 准备发送 VAD 音频, 大小: ${wavBuffer.length}`);
                const result = await window.electron.sendAudioData(wavBuffer);
                console.log("UI: 后端返回结果:", result);
              } catch (err) {
                console.error("UI: 发送音频失败:", err);
              } finally {
                isProcessing = false;
              }
            },
          onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
          baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
            redemptionMs: 400, 
          });

          // 关键修复：如果在 await 期间变为手动录音模式或组件卸载，则销毁
          if (isAborted || isManualRecording) {
            console.log("VAD: 初始化期间状态变更，立即销毁实例。");
            vadInstance.pause();
            return;
          }

          if (vadRef.current) {
             vadRef.current.pause();
          }

          vadRef.current = vadInstance;
          vadRef.current.start();
        } catch (e) {
          console.error("VAD initialization failed:", e);
        }
      } else {
        // 如果 autoRecord 为 false 或者 正在手动录音，暂停并清理
        if (vadRef.current) {
          console.log("VAD: 暂停检测 (autoRecord关闭 或 手动录音中)");
          vadRef.current.pause();
          vadRef.current = null;
        }
      }
    };

    initVAD();

    return () => {
      isAborted = true; 
      if (vadRef.current) {
        vadRef.current.pause();
        vadRef.current = null;
      }
    };
  }, [autoRecord, isManualRecording, startRecording, stopRecording]);

  useEffect(() => {
    // 移除 hasInitializedRecoder 检查，改用标准的 React 依赖更新机制
    // 这样当 startRecording/stopRecording 更新时（比如 autoRecord 变化），监听器也会更新
    
    // 注册事件监听器
    const startRecordingListener = () => {
      startRecording();
    };

    const stopRecordingListener = () => {
      stopRecording();
    };

    window.electron.ipcRenderer.on('startRecording', startRecordingListener);
    window.electron.ipcRenderer.on('stopRecording', stopRecordingListener);

    // 清理函数，组件卸载或依赖更新时移除监听器
    return () => {
      window.electron.ipcRenderer.removeListener('startRecording', startRecordingListener);
      window.electron.ipcRenderer.removeListener('stopRecording', stopRecordingListener);
    };
  }, [startRecording, stopRecording]); // 添加依赖，确保闭包最新


  // 组件卸载时清理URL
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  // 返回可视化录制音频的组件
  // function view() {
  //   return (
  //   <div>
  //     <button onClick={recording ? stopRecording : startRecording}>
  //       {recording ? "停止录音" : "开始录音"}
  //     </button>
  //     {audioURL && (
  //       <div>
  //         <audio controls>
  //           <source src={audioURL} type="audio/webm" />
  //           你的浏览器不支持音频播放
  //         </audio>
  //         <a href={audioURL} download="recording.webm">
  //           下载音频
  //         </a>
  //       </div>
  //     )}
  //   </div>);
  // }

  // 只有录音组件 无视图
  function noView() {
    return <></>;
  }

  // return view();
  return noView();

};
