import { useState, useEffect, ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; // 确保导入Switch组件
import { Label } from "@/components/ui/label"; // 确保导入Label组件
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';

import { useGlobalState } from './globalState';
import { ShortcutCommand, ShortcutCommandType, TextAutoProcess } from '../electron/computer/define';

// 通用的表格项接口
export interface EditableItem {
  [key: string]: any;
  name: string;
  value: string;
}

interface EditableTableProps<T extends EditableItem> {
  data: T[];
  onChange: (data: T[]) => void;
  columns?: ColumnDef<T, any>[];
  addRowButtonText?: string;
  emptyText?: string;
  createNewRow: () => T;
  title?: string | ReactNode;
  header_name?: string;
  header_value?: string;
}

export function EditableTable<T extends EditableItem>({
  data,
  onChange,
  columns,
  addRowButtonText = "增加",
  emptyText = "暂无数据",
  createNewRow,
  title,
  header_name = "名字",
  header_value = "内容",
}: EditableTableProps<T>) {
  const [tableData, setTableData] = useState<T[]>(data);
  
  // 同步外部数据到内部状态 - 这个需要保留，确保外部数据变化时内部更新
  useEffect(() => {
    setTableData(data);
  }, [data]);
  
  // 创建一个包装函数，每次内部数据变化时都调用 onChange
  const updateTableData = (newData: T[]) => {
    setTableData(newData);
    onChange(newData); // 同步到外部
  };
  
  // 如果没有提供列配置，使用默认配置
  const columnHelper = createColumnHelper<T>();
  
  const defaultColumns = [
    columnHelper.accessor('name', {
      header: () => <div className="text-center">{header_name}</div>,
      cell: ({ row, getValue }) => {
        const initialValue = getValue() as string;
        const [value, setValue] = useState(initialValue);
        
        useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);
        
        const onBlur = () => {
          // 使用新的更新函数
          updateTableData(
            tableData.map((rowData, index) => {
              if (index === row.index) {
                return {
                  ...rowData,
                  name: value,
                };
              }
              return rowData;
            })
          );
        };
        
        return (
          <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            className="h-8 w-full"
          />
        );
      },
    }),
    columnHelper.accessor('value', {
      header: () => <div className="text-center">{header_value}</div>,
      cell: ({ row, getValue }) => {
        const initialValue = getValue() as string;
        const [value, setValue] = useState(initialValue);
        
        useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);
        
        const onBlur = () => {
          // 使用新的更新函数
          updateTableData(
            tableData.map((rowData, index) => {
              if (index === row.index) {
                return {
                  ...rowData,
                  value: value,
                };
              }
              return rowData;
            })
          );
        };
        
        return (
          <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            className="h-8 w-full"
          />
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <Button 
          variant="outline" 
          size="sm"
          className="text-black-500"
          onClick={() => {
            // 使用新的更新函数
            updateTableData(tableData.filter((_, index) => index !== row.index));
          }}
          >
            删除
          </Button>
        );
      },
    }),
  ];

  // 配置表格
  const table = useReactTable({
    data: tableData,
    columns: columns || defaultColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 添加新行函数
  const addNewRow = () => {
    setTableData(old => [...old, createNewRow()]);
  };

  return (
    <div className="p-4 space-y-4">
      {title && (typeof title === 'string' ? <h2 className="text-lg font-semibold">{title}</h2> : title)}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns?.length || defaultColumns.length} className="text-center">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Button onClick={addNewRow} className="w-full">
        {addRowButtonText}
      </Button>
    </div>
  );
}


export function AppShortcut() {

  // 文本操作
  const { textAutoProcess, setTextAutoProcess } = useGlobalState();

  // 处理自动复制开关状态变化
  const handleAutoCopyChange = (checked: boolean) => {
    if (!checked) {
      // 如果关闭自动复制，则同时关闭自动粘贴和自动回车
      setTextAutoProcess({
        ...textAutoProcess,
        autoCopyFlag: false,
        autoPasteFlag: false,
        autoEnterFlag: false,
      });
    } else {
      // 仅开启自动复制
      setTextAutoProcess({
        ...textAutoProcess,
        autoCopyFlag: true,
      });
    }
  };

  // 处理自动粘贴开关状态变化
  const handleAutoPasteChange = (checked: boolean) => {
    if (checked) {
      // 如果开启自动粘贴，则同时开启自动复制
      setTextAutoProcess({
        ...textAutoProcess,
        autoCopyFlag: true,
        autoPasteFlag: true,
      });
    } else {
      // 如果关闭自动粘贴，则同时关闭自动回车
      setTextAutoProcess({
        ...textAutoProcess,
        autoPasteFlag: false,
        autoEnterFlag: false,
      });
    }
  };

  // 处理自动回车开关状态变化
  const handleAutoEnterChange = (checked: boolean) => {
    if (checked) {
      // 如果开启自动回车，则同时开启自动复制和自动粘贴
      setTextAutoProcess({
        ...textAutoProcess,
        autoCopyFlag: true,
        autoPasteFlag: true,
        autoEnterFlag: true,
      });
    } else {
      // 仅关闭自动回车
      setTextAutoProcess({
        ...textAutoProcess,
        autoEnterFlag: false,
      });
    }
  };

  // 每次文本处理设置变化时保存到后端
  let textAutoProcessPrev = textAutoProcess;
  useEffect(() => {
    // 避免每次渲染重复发送
    if (textAutoProcessPrev === textAutoProcess) {
      return;
    }
    textAutoProcessPrev = textAutoProcess;
    window.electron.sendTextData('updateTextAutoProcess', JSON.stringify(textAutoProcess));
    console.log("文本处理设置已更新", textAutoProcess);
  }, [textAutoProcess]);

  // 快捷指令数据
  const { shortcutCommandList, setShortcutCommandList } = useGlobalState();
  
  // 按类型分类数据
  const urlCommandList = shortcutCommandList.filter(cmd => cmd.type === ShortcutCommandType.url);
  const steamCommandList = shortcutCommandList.filter(cmd => cmd.type === ShortcutCommandType.steam);


  // 处理网页数据更新
  const handleUrlDataChange = (newUrlCommands: ShortcutCommand[]) => {
    const otherCommands = shortcutCommandList.filter(cmd => cmd.type !== ShortcutCommandType.url);
    setShortcutCommandList([...newUrlCommands, ...otherCommands]);
  };

  // 处理游戏数据更新
  const handleSteamDataChange = (newSteamCommands: ShortcutCommand[]) => {
    const otherCommands = shortcutCommandList.filter(cmd => cmd.type !== ShortcutCommandType.steam);
    setShortcutCommandList([...newSteamCommands, ...otherCommands]);
  };

  // 每次总数据变化时保存
  let shortcutCommandListPrev = shortcutCommandList;
  useEffect(() => {
    // 避免每次渲染重复发送
    if (shortcutCommandListPrev === shortcutCommandList) {
      return;
    }
    shortcutCommandListPrev = shortcutCommandList;
    window.electron.sendTextData('updateShortcutCommand', JSON.stringify(shortcutCommandList));
    console.log("所有数据已更新");
  }, [shortcutCommandList]);

  return (
    <div className="space-y-8">
    {/* 文字处理卡片 */}
    <Card className="w-full">
      <CardHeader>
        <CardTitle>文字</CardTitle>
        <CardDescription>自动文本处理选项</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-8 justify-center">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-copy" 
              checked={textAutoProcess.autoCopyFlag}
              onCheckedChange={handleAutoCopyChange}
              className="data-[state=checked]:bg-green-500"
            />
            <Label htmlFor="auto-copy">自动复制</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-paste" 
              checked={textAutoProcess.autoPasteFlag}
              onCheckedChange={handleAutoPasteChange}
              className="data-[state=checked]:bg-green-500"
            />
            <Label htmlFor="auto-paste">自动粘贴</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-enter" 
              checked={textAutoProcess.autoEnterFlag}
              onCheckedChange={handleAutoEnterChange}
              className="data-[state=checked]:bg-green-500"
            />
            <Label htmlFor="auto-enter">自动回车</Label>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* 搜索卡片*/}
    <Card className="w-full">
      <CardHeader>
        <CardTitle>搜索</CardTitle>
        <CardDescription>使用方式：“xx搜索+内容”</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center">
          {/* 使用 div 而不是 Button，只展示文本 */}
          <div className="px-3 py-1 text-sm border rounded-md">必应</div>
          <div className="px-3 py-1 text-sm border rounded-md">谷歌</div>
          <div className="px-3 py-1 text-sm border rounded-md">知乎</div>
          <div className="px-3 py-1 text-sm border rounded-md">哔哩哔哩</div>
          <div className="px-3 py-1 text-sm border rounded-md">小红书</div>
        </div>
      </CardContent>
    </Card>

      {/* 网页链接表格 */}
      <EditableTable
        data={urlCommandList}
        onChange={handleUrlDataChange}
        createNewRow={() => ({ type: ShortcutCommandType.url, name: "", value: "", embedding: [] })}
        title="网页"
        header_name="名字"
        header_value="链接"
      />

      {/* 游戏表格 */}
      <EditableTable
        data={steamCommandList}
        onChange={handleSteamDataChange}
        createNewRow={() => ({ type: ShortcutCommandType.steam, name: "", value: "", embedding: [] })}
        title="Steam"
        header_name="名字"
        header_value="游戏ID"
      />
    </div>
  );
}
