import { MicVAD } from "@ricky0123/vad-web";

async function startVAD() {
    try {
        const vad = await MicVAD.new({
            onSpeechStart: () => {
                console.log("检测到人声：S");
            },
            onSpeechEnd: (audio) => {
                console.log("人声结束。");
                // audio 是包含语音数据的 Float32Array
            },
        });

        vad.start();
        console.log("VAD 服务已启动，正在监听麦克风...");
    } catch (e) {
        console.error("初始化 VAD 失败:", e);
    }
}

startVAD();