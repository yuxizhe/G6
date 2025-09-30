# Hypergraph Demo 使用说明

## 🎯 当前状态

已创建超图可视化 demo，位于：`packages/g6/__tests__/demos/demo-hypergraph.ts`

## 🚀 如何查看

1. 确保开发服务器正在运行：

   ```bash
   pnpm dev:g6
   ```

2. 在浏览器中访问：http://localhost:8080

3. 在左上角的 Demo 下拉菜单中选择 **`demoHypergraph`**

## 🎨 功能特性

### 可视化模式

- **Hyper 模式**：使用 bubble-sets 插件显示超边（多个节点的关系）
- **Graph 模式**：只显示2节点之间的边（传统图模式）

### 交互控制

- **Selected Vertex**：选择不同的顶点查看其相关图数据
- **Visualization Mode**：切换 hyper/graph 模式
- **Show Hyperedges**：显示/隐藏超边
- **Node Size**：调整节点大小
- **Bubble Opacity**：调整气泡透明度
- **Link Distance**：调整链接距离
- **Re-layout Graph**：重新布局

## 📊 数据结构

Demo 使用的数据格式与 `hypergraph_viewer.html` 完全一致：

```javascript
{
  database: {
    name: string,
    vertices: number,
    edges: number
  },
  vertices: [
    {
      id: string,
      degree: number,
      entity_type: string,
      description: string
    },
    ...
  ],
  graphs: {
    'VERTEX_ID': {
      vertices: {
        'NODE_ID': {
          entity_type: string,
          degree: number,
          description: string
        },
        ...
      },
      edges: {
        'NODE1|#|NODE2|#|NODE3': {
          keywords: string,
          summary: string,
          weight: number
        },
        ...
      }
    },
    ...
  }
}
```

## 🔄 使用真实数据

当前 demo 使用的是内嵌的示例数据。要使用 `hypergraph/data.js` 中的真实数据：

### 方法 1：复制数据到 demo 文件

1. 打开 `hypergraph/data.js`
2. 复制 `datas` 对象的内容
3. 替换 `demo-hypergraph.ts` 中第 6-133 行的 `embeddedData` 对象

### 方法 2：创建独立的数据文件

1. 创建 `packages/g6/__tests__/demos/hypergraph-data.ts`：

   ```typescript
   export const hypergraphData = {
     // 从 hypergraph/data.js 复制数据
   };
   ```

2. 在 `demo-hypergraph.ts` 中导入：
   ```typescript
   import { hypergraphData } from './hypergraph-data';
   const embeddedData = hypergraphData;
   ```

## 🎨 颜色配置

### 超边颜色

```javascript
colors = [
  '#F6BD16', // 黄色
  '#00C9C9', // 青色
  '#F08F56', // 橙色
  '#D580FF', // 紫色
  '#FF3D00', // 红色
  '#16f69c', // 绿色
  // ... 更多颜色
];
```

### 实体类型颜色

```javascript
entityTypeColors = {
  PERSON: '#00C9C9',
  CONCEPT: '#a68fff',
  ORGANIZATION: '#F08F56',
  LOCATION: '#16f69c',
  EVENT: '#004ac9',
  PRODUCT: '#f056d1',
};
```

## 🔧 Bubble-Sets 参数调整

在 `createStyle` 函数中可以调整超边的渲染参数：

```typescript
const createStyle = (baseColor: string) => ({
  fill: baseColor,
  stroke: baseColor,
  fillOpacity: 0.15, // 填充透明度
  strokeOpacity: 0.8, // 边框透明度
  lineWidth: 2, // 边框宽度
  maxRoutingIterations: 100, // 路径计算迭代次数
  maxMarchingIterations: 20, // marching squares 迭代次数
  pixelGroup: 4, // 像素分组
  edgeR0: 10, // 边的内半径
  edgeR1: 60, // 边的外半径
  nodeR0: 15, // 节点的内半径
  nodeR1: 50, // 节点的外半径
  morphBuffer: 10, // 形态缓冲
  threshold: 4, // 阈值
  memberInfluenceFactor: 1, // 成员影响因子
  edgeInfluenceFactor: 4, // 边影响因子
  nonMemberInfluenceFactor: -0.8, // 非成员影响因子
  virtualEdges: true, // 虚拟边
});
```

## 📝 与 hypergraph_viewer.html 的对应关系

| hypergraph_viewer.html  | demo-hypergraph.ts          |
| ----------------------- | --------------------------- |
| React + G6 (UMD)        | TypeScript + G6 (ES Module) |
| embeddedData            | embeddedData                |
| selectedVertex state    | selectedVertex variable     |
| visualizationMode state | visualizationMode variable  |
| Graph initialization    | Graph initialization        |
| bubble-sets plugins     | bubble-sets plugins         |
| Force layout            | Force layout                |
| Tooltip plugin          | Tooltip plugin              |

## 🐛 常见问题

1. **Q: 为什么看不到超边？**

   A: 确保选择了 "hyper" 模式，并且 "Show Hyperedges" 开关是打开的。

2. **Q: 如何调整超边的透明度？**

   A: 使用右侧控制面板的 "Bubble Opacity" 滑块。

3. **Q: 如何切换到传统图模式？**

   A: 在 "Visualization Mode" 下拉菜单中选择 "graph"。

4. **Q: 数据太大加载慢怎么办？**

   A: 可以筛选数据，只保留部分顶点或者减少超边数量。

## 🎉 下一步

- 添加更多交互功能（如高亮、筛选等）
- 优化大规模数据的渲染性能
- 添加更多布局算法选项
- 实现超边的详细信息展示
