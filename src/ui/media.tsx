import { Buffer } from 'buffer';
import { getWaveBlob, WavRecorder } from "webm-to-wav-converter";
import { useState, useEffect, useRef } from "react";

import { WAV_SAMPLE_RATE } from '@/electron/define.ts';


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

  // async stopRecording(): Promise<string> {
  //   if (!this.mediaRecorder || !this.isRecording) {
  //     return '';
  //   }
  //   this.mediaRecorder.stop();

  //   this.isRecording = false;
  //   const audioBlobWebm = new Blob(this.audioChunks, { type: "audio/webm" });

  //   // 把webm转换成wav
  //   console.log('音频大小:', this.audioChunks.length, '个块');
  //   const audioBlob = await getWaveBlob(audioBlobWebm, false, { sampleRate: WAV_SAMPLE_RATE });
  //   console.log('audioBlob', audioBlob);
  //   console.log('time', new Date().getTime());
    
  //   // 传输给后端
  //   // 将 Blob 转换为 ArrayBuffer，再转为 Buffer
  //   const arrayBuffer = await audioBlob.arrayBuffer();
  //   // 注意：在渲染进程中，Buffer.from 实际上返回的是 Uint8Array
  //   const buffer = Buffer.from(arrayBuffer);
      
  //   // // 传输给后端
  //   console.log('音频大小:', buffer.length, '字节');
  //   const result = await window.electron.sendAudioData(buffer);
  //   console.log('音频传输结果:', result);

  //   const audioUrl = URL.createObjectURL(audioBlobWebm);
  //   return audioUrl;
  // }
  async stopRecording(): Promise<string> {
    
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve('');
        return;
      }

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        const audioBlobWebm = new Blob(this.audioChunks, { type: "audio/webm" });

        // 把webm转换成wav
        console.log('音频大小:', this.audioChunks.length, '个块');
        const audioBlob = await getWaveBlob(audioBlobWebm, false, { sampleRate: WAV_SAMPLE_RATE });
        
        // 传输给后端
        // 将 Blob 转换为 ArrayBuffer，再转为 Buffer
        const arrayBuffer = await audioBlob.arrayBuffer();
        // 注意：在渲染进程中，Buffer.from 实际上返回的是 Uint8Array
        const buffer = Buffer.from(arrayBuffer);
          
        // // 传输给后端
        console.log('音频大小:', buffer.length, '字节');
        const result = await window.electron.sendAudioData(buffer);
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
export const AudioRecorderComponent = () => {
  const [recording, setRecording] = useState(false);
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
    </div>
  );

};
