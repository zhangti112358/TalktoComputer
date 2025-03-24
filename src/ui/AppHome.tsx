import { AppSidebar } from "@/components/app-home-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";


import { NAV_HEIGHT } from './Common.tsx';
import { sendTextType } from '@/electron/computer/define';
import { useGlobalState } from './globalState';


// ... 替换选中的行:
// 输入key（隐藏具体值） 刷新余额按钮 余额显示
const ApiKeySection = () => {
  const {apiKey, setApiKey} = useGlobalState();
  const {balance, setBalance} = useGlobalState();
  const [loading, setLoading] = useState(false);


  const fetchBalance = async () => {
    
    setLoading(true);
    try {
      // 获取余额
      const balance = await window.electron.sendTextData(sendTextType.getSiliconflowBalance, '');
      setBalance(balance); // 模拟获取到的余额
    } catch (error) {
      console.error("获取余额失败:", error);
    } finally {
      setLoading(false);
    }
  };


  const saveKeyFetchBalance = async (key:string) => {
    try {
      // 调用保存 API Key 的函数
      await window.electron.sendTextData(sendTextType.siliconflowKey, key);
      console.log('API Key 已保存');
      // 保存成功后，获取余额
      fetchBalance();
    } catch (error) {
      console.error('保存 API Key 失败:', error);
    }
  }

  // api key变化
  const handleApiKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    await saveKeyFetchBalance(newApiKey); // react 不会直接更新apiKey 下次渲染才会更新 所以这里直接使用newApiKey
  };

  return (
    <div className="space-y-8">
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-center text-xl">开始说话吧 熊猫会帮你做一些事</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 使用 */}
          <div className="grid grid-cols-12 gap-4 border rounded-lg p-4">
            <div className="col-span-2 font-bold flex items-center">
              使用
            </div>
            <div className="col-span-9 text-left">
              <p className="mb-2">1. 输入硅基流动平台的秘钥</p>
              <p className="mb-2">2. 点击熊猫右边的星星图标查看支持的功能</p>
              <p className="mb-2">3. 按住键盘"F4"键开始说话</p>
            </div>
          </div>

          {/* 查看项目 */}
          <div className="grid grid-cols-12 gap-4 border rounded-lg p-4">
            <div className="col-span-2 font-bold flex items-center">
              查看源码
            </div>
            <div className="col-span-9 text-left">
            <div className="flex items-center gap-2 mb-2">
                <a 
                  href="https://github.com/zhangti112358/TalktoComputer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 break-all select-all flex-1"
                  onClick={(e) => {
                    e.preventDefault(); // 阻止默认行为
                    window.electron.sendTextData(sendTextType.openUrl, 'https://github.com/zhangti112358/TalktoComputer');
                  }}
                >
                  https://github.com/zhangti112358/TalktoComputer
                </a>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* 硅基流动秘钥 */}
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey" className="font-bold">硅基流动 秘钥</Label>
            <div className="flex gap-2">
              <Input 
                id="apiKey"
                type="password" 
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e)}
                placeholder="输入秘钥"
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchBalance} 
                disabled={loading || !apiKey}
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="sr-only">刷新余额</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">余额:</span>
            {loading ? (
              <span className="text-sm text-muted-foreground">加载中...</span>
            ) : balance ? (
              <span className="text-sm font-semibold">{balance}</span>
            ) : (
              <span className="text-sm text-muted-foreground">未获取余额</span>
            )}
          </div>
          <div className="flex flex-col items-start gap-2 mb-2">
            <span className="whitespace-nowrap">注册账号:（使用这个链接注册，我会获得2000W Tokens奖励。你可以使用朋友的链接或者分享链接给朋友。)</span>
            <a 
              href="https://cloud.siliconflow.cn/i/hyRgBGdj" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 break-all select-all flex-1"
              onClick={(e) => {
                e.preventDefault(); // 阻止默认行为
                window.electron.sendTextData(sendTextType.openUrl, 'https://cloud.siliconflow.cn/i/hyRgBGdj');
              }}
            >
              https://cloud.siliconflow.cn/i/hyRgBGdj
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};



export function AppHome() {
  // const [number1, setNumber1]     = useState(0);
  return (
      <ApiKeySection />
    );
}