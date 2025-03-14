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
import { Search } from "lucide-react"; // 可选的搜索图标
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';

import { useGlobalState } from './globalState';
import { ShortcutCommand, ShortcutCommandType } from '../electron/computer/define';

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

  // 数据管理
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
  useEffect(() => {
    window.electron.sendTextData('updateShortcutCommand', JSON.stringify(shortcutCommandList));
    console.log("所有数据已更新");
    // 在这里添加将数据保存到后台/JSON文件的逻辑
  }, [shortcutCommandList]);

/*
使用 shadcn ui 组件库的 card 和 button 组件，
展示 一个搜索的card
必应
谷歌
知乎
哔哩哔哩
小红书
这六个名字
*/
  const [searchQuery, setSearchQuery] = useState("");
  // 搜索引擎列表
  const searchEngines = [
    { name: "搜索", icon: "🔍", url: "" },
    { name: "必应", icon: "🔎", url: "https://www.bing.com/search?q=" },
    { name: "谷歌", icon: "🌐", url: "https://www.google.com/search?q=" },
    { name: "知乎", icon: "❓", url: "https://www.zhihu.com/search?q=" },
    { name: "哔哩哔哩", icon: "📺", url: "https://search.bilibili.com/all?keyword=" },
    { name: "小红书", icon: "📕", url: "https://www.xiaohongshu.com/search_result?keyword=" }
  ];
  
  const handleSearch = (engine: string) => {
    if (!searchQuery.trim()) return;
    
    const selectedEngine = searchEngines.find(e => e.name === engine);
    if (selectedEngine && selectedEngine.url) {
      window.open(selectedEngine.url + encodeURIComponent(searchQuery), "_blank");
    }
  };

  return (
    <div className="space-y-8">
    {/* 搜索卡片 */}
    <Card className="w-full">
      <CardHeader>
        <CardTitle>快捷搜索</CardTitle>
        <CardDescription>选择搜索引擎快速查找内容</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="输入搜索内容..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch("必应"); // 默认使用必应搜索
              }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {searchEngines.map((engine) => (
          <Button
            key={engine.name}
            variant={engine.name === "搜索" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSearch(engine.name)}
            disabled={engine.name === "搜索" || !searchQuery.trim()}
          >
            <span className="mr-1">{engine.icon}</span> {engine.name}
          </Button>
        ))}
      </CardFooter>
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
