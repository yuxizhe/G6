import { Graph } from '@antv/g6';
// 直接导入真实的超图数据
// @ts-ignore - data.js is a plain JS file without TypeScript types
import { datas } from '../../../../hypergraph/data.js';

// 使用导入的真实数据
const embeddedData = datas;

// 颜色配置
const colors = [
  '#F6BD16',
  '#00C9C9',
  '#F08F56',
  '#D580FF',
  '#FF3D00',
  '#16f69c',
  '#004ac9',
  '#f056d1',
  '#a680ff',
  '#c8ff00',
];

const entityTypeColors = {
  PERSON: '#00C9C9',
  CONCEPT: '#a68fff',
  ORGANIZATION: '#F08F56',
  LOCATION: '#16f69c',
  EVENT: '#004ac9',
  PRODUCT: '#f056d1',
};

export const demoHypergraph: TestCase = async (context) => {
  // 默认选中第一个顶点
  let selectedVertex = embeddedData.vertices.length > 0 ? embeddedData.vertices[0].id : '';
  let visualizationMode: 'hyper' | 'graph' = 'hyper';

  // 转换数据为 G6 格式
  const convertGraphData = (vertex: string, mode: 'hyper' | 'graph') => {
    const graphData = (embeddedData.graphs as any)[vertex];
    if (!graphData) return null;

    const hyperData: { nodes: any[]; edges: any[]; hyperEdges: any[] } = { nodes: [], edges: [], hyperEdges: [] };
    const plugins: any[] = [];

    // 添加顶点
    for (const [key, value] of Object.entries(graphData.vertices)) {
      hyperData.nodes.push({
        id: key,
        label: key,
        ...(value as any),
      });
    }

    if (mode === 'graph') {
      // Graph模式：只显示维度为2的球棍图
      const edgeKeys = Object.keys(graphData.edges);
      const edgeSet = new Set();

      for (let i = 0; i < edgeKeys.length; i++) {
        const key = edgeKeys[i];
        const edge = (graphData.edges as any)[key];
        const nodes = key.split('|#|');

        if (nodes.length !== 2) continue;

        const [a, b] = nodes;
        const edgeId = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          hyperData.edges.push({
            id: edgeId,
            source: a,
            target: b,
            ...(edge as any),
          });
        }
      }

      // 过滤不在边中的节点
      hyperData.nodes = hyperData.nodes.filter((node: any) => {
        return hyperData.edges.some((edge: any) => {
          return edge.source === node.id || edge.target === node.id;
        });
      });
    } else {
      // Hyper模式：使用bubble-sets插件
      const createStyle = (baseColor: string) => ({
        fill: baseColor,
        stroke: baseColor,
        fillOpacity: 0.15,
        strokeOpacity: 0.8,
        lineWidth: 2,
        maxRoutingIterations: 100,
        maxMarchingIterations: 20,
        pixelGroup: 4,
        edgeR0: 10,
        edgeR1: 60,
        nodeR0: 15,
        nodeR1: 50,
        morphBuffer: 10,
        threshold: 4,
        memberInfluenceFactor: 1,
        edgeInfluenceFactor: 4,
        nonMemberInfluenceFactor: -0.8,
        virtualEdges: true,
      });

      // 添加超边
      const edgeKeys = Object.keys(graphData.edges);
      for (let i = 0; i < edgeKeys.length; i++) {
        const key = edgeKeys[i];
        const edge = (graphData.edges as any)[key];
        const nodes = key.split('|#|');

        plugins.push({
          key: `bubble-sets-${i}`,
          type: 'bubble-sets',
          members: nodes,
          ...createStyle(colors[i % colors.length]),
        });

        hyperData.hyperEdges.push({
          id: key,
          ...(edge as any),
          members: nodes,
        });
      }
    }

    // 添加tooltip插件
    plugins.push({
      type: 'tooltip',
      key: 'tooltip',
      getContent: (e: any, items: any[]) => {
        let result = '';
        items.forEach((item) => {
          result += `<h4 style="margin: 0 0 8px 0;">${item.id}</h4>`;
          if (item.entity_type) {
            result += `<p style="margin: 4px 0;"><strong>Type:</strong> ${item.entity_type}</p>`;
          }
          if (item.description) {
            const desc = item.description.split('<SEP>').slice(0, 2).join('; ');
            result += `<p style="margin: 4px 0;"><strong>Description:</strong> ${desc}</p>`;
          }
          if (item.degree !== undefined) {
            result += `<p style="margin: 4px 0;"><strong>Degree:</strong> ${item.degree}</p>`;
          }
        });
        return result;
      },
    });

    return {
      data: hyperData,
      plugins: mode === 'graph' ? [plugins[plugins.length - 1]] : plugins,
    };
  };

  const initialData = convertGraphData(selectedVertex, visualizationMode);
  if (!initialData) {
    throw new Error('No graph data available');
  }

  const graph = new Graph({
    ...context,
    width: window.innerWidth,
    height: window.innerHeight,
    autoResize: true,
    data: initialData.data,
    behaviors: ['drag-canvas', 'drag-element', 'zoom-canvas'],
    plugins: initialData.plugins,
    node: {
      style: {
        size: (d: any) => (visualizationMode === 'graph' ? 20 : 25),
        labelText: (d: any) => d.id,
        labelFontSize: 10,
        labelMaxWidth: 150,
        labelWordWrap: true,
        labelBackground: true,
        labelPadding: [2, 4],
        labelBackgroundFill: 'rgba(255, 255, 255, 0.9)',
        labelBackgroundRadius: 3,
        fill: (d: any) => {
          if (d.id === selectedVertex) {
            return 'black';
          }
          if (d.entity_type) {
            return (entityTypeColors as any)[d.entity_type] || '#8566CC';
          }
          return '#8566CC';
        },
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    edge: {
      style: {
        stroke: (d: any) => (visualizationMode === 'graph' ? '#a68fff' : '#e0e0e0'),
        lineWidth: (d: any) => (visualizationMode === 'graph' ? 2 : 1),
      },
    },
    layout: {
      type: 'force',
      animated: true,
      preventOverlap: true,
      nodeSize: 40,
      linkDistance: 150,
      clustering: true,
      nodeClusterBy: 'entity_type',
      gravity: 20,
    },
    autoFit: 'view',
  });

  await graph.render();

  // 添加交互式控制面板
  demoHypergraph.form = (panel) => {
    const config = {
      selectedVertex: selectedVertex,
      visualizationMode: visualizationMode,
      showHyperedges: true,
      nodeSize: 25,
      bubbleOpacity: 0.15,
      // Layout parameters
      layoutType: 'force',
      linkDistance: 150,
      gravity: 20,
      animated: true,
      preventOverlap: true,
      maxSpeed: 1000,
      minMovement: 0.5,
      clusterNodeStrength: 20,
      leafCluster: false,
      // BubbleSets parameters
      maxRoutingIterations: 100,
      maxMarchingIterations: 20,
      pixelGroup: 4,
      edgeR0: 10,
      edgeR1: 20,
      nodeR0: 15,
      nodeR1: 50,
      morphBuffer: 10,
      threshold: 1,
      memberInfluenceFactor: 1,
      edgeInfluenceFactor: 1,
      nonMemberInfluenceFactor: -0.8,
      virtualEdges: true,
      strokeWidth: 2,
      strokeOpacity: 0.8,
    };

    // 辅助函数：更新布局
    const updateLayout = () => {
      graph.setLayout({
        type: config.layoutType,
        animated: config.animated,
        preventOverlap: config.preventOverlap,
        nodeSize: 40,
        linkDistance: config.linkDistance,
        clustering: visualizationMode !== 'graph',
        nodeClusterBy: visualizationMode !== 'graph' ? 'entity_type' : undefined,
        gravity: config.gravity,
        maxSpeed: config.maxSpeed,
        minMovement: config.minMovement,
        clusterNodeStrength: config.clusterNodeStrength,
        leafCluster: config.leafCluster,
      });
      graph.layout();
    };

    // 辅助函数：更新所有 BubbleSets 插件
    const updateBubbleSets = (updates: any) => {
      if (visualizationMode !== 'graph') {
        const plugins = graph.getPlugins();
        plugins.forEach((plugin: any) => {
          if (plugin.key?.startsWith('bubble-sets-')) {
            graph.updatePlugin({ key: plugin.key, ...updates });
          }
        });
        graph.render();
      }
    };

    // 顶点选择器
    return [
      panel
        .add(
          config,
          'selectedVertex',
          embeddedData.vertices.map((v: any) => v.id),
        )
        .name('Selected Vertex')
        .onChange(async (value: string) => {
          selectedVertex = value;
          const newData = convertGraphData(value, visualizationMode);
          if (newData) {
            // 更新数据和插件
            graph.setData(newData.data);
            graph.setPlugins(newData.plugins);
            await graph.render();
          }
        }),

      // 可视化模式切换
      panel
        .add(config, 'visualizationMode', ['hyper', 'graph'])
        .name('Visualization Mode')
        .onChange(async (value: 'hyper' | 'graph') => {
          visualizationMode = value;
          const newData = convertGraphData(selectedVertex, value);
          if (newData) {
            // 更新数据和插件
            graph.setData(newData.data);
            graph.setPlugins(newData.plugins);

            // 更新布局
            graph.setLayout({
              type: 'force',
              animated: true,
              preventOverlap: true,
              nodeSize: 40,
              linkDistance: value === 'graph' ? 100 : 150,
              clustering: value !== 'graph',
              nodeClusterBy: value !== 'graph' ? 'entity_type' : undefined,
              gravity: 20,
            });

            // 更新节点和边样式
            graph.updateNodeData(
              graph.getNodeData().map((node) => ({
                id: node.id,
                style: {
                  size: value === 'graph' ? 20 : 25,
                },
              })),
            );

            graph.updateEdgeData(
              graph.getEdgeData().map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                style: {
                  stroke: value === 'graph' ? '#a68fff' : '#e0e0e0',
                  lineWidth: value === 'graph' ? 2 : 1,
                },
              })),
            );

            await graph.render();
          }
        }),

      // 显示/隐藏超边
      panel
        .add(config, 'showHyperedges')
        .name('Show Hyperedges')
        .onChange((value: boolean) => {
          updateBubbleSets({
            fillOpacity: value ? config.bubbleOpacity : 0,
            strokeOpacity: value ? 0.8 : 0,
          });
        }),

      // 节点大小调整
      panel
        .add(config, 'nodeSize', 10, 50, 1)
        .name('Node Size')
        .onChange((value: number) => {
          graph.updateNodeData(graph.getNodeData().map((node) => ({ id: node.id, style: { size: value } })));
          graph.render();
        }),

      // Bubble 透明度调整
      panel
        .add(config, 'bubbleOpacity', 0, 1, 0.05)
        .name('Bubble Opacity')
        .onChange((value: number) => {
          if (config.showHyperedges) updateBubbleSets({ fillOpacity: value });
        }),

      // === Layout Parameters (布局参数) ===
      panel
        .add(config, 'layoutType', [
          'force',
          'circular',
          'concentric',
          'd3-force',
          'd3-force-3d',
          'dagre',
          'antv-dagre',
          'force-atlas2',
          'fruchterman',
          'grid',
          'mds',
          'radial',
          'random',
          'snake',
          'fishbone',
        ])
        .name('📐 Layout Type (布局类型)')
        .onChange(updateLayout),
      panel.add(config, 'linkDistance', 50, 300, 10).name('🔗 Link Distance (边长度)').onChange(updateLayout),
      panel.add(config, 'gravity', 0, 100, 5).name('🎯 Gravity (中心引力)').onChange(updateLayout),
      panel.add(config, 'animated').name('🎬 Animated (动画)').onChange(updateLayout),
      panel.add(config, 'preventOverlap').name('🚫 Prevent Overlap (防重叠)').onChange(updateLayout),
      panel.add(config, 'maxSpeed', 100, 2000, 100).name('⚡ Max Speed (最大速度)').onChange(updateLayout),
      panel.add(config, 'minMovement', 0.1, 5, 0.1).name('🎚️ Min Movement (停止阈值)').onChange(updateLayout),
      panel.add(config, 'clusterNodeStrength', 0, 100, 5).name('🔮 Cluster Strength (聚类强度)').onChange(updateLayout),
      panel.add(config, 'leafCluster').name('🍃 Leaf Cluster (叶子聚类)').onChange(updateLayout),
      panel.add({ Relayout: () => graph.layout() }, 'Relayout').name('🔄 Re-layout Graph (重新布局)'),

      // === BubbleSets Algorithm Parameters (算法参数) ===
      panel
        .add(config, 'maxRoutingIterations', 10, 200, 10)
        .name('🔄 Max Routing Iter (路由迭代)')
        .onChange((v: number) => updateBubbleSets({ maxRoutingIterations: v })),
      panel
        .add(config, 'maxMarchingIterations', 5, 50, 5)
        .name('🚶 Max Marching Iter (行进迭代)')
        .onChange((v: number) => updateBubbleSets({ maxMarchingIterations: v })),
      panel
        .add(config, 'pixelGroup', 1, 10, 1)
        .name('🔲 Pixel Group (像素组)')
        .onChange((v: number) => updateBubbleSets({ pixelGroup: v })),
      panel
        .add(config, 'edgeR0', 0, 30, 1)
        .name('📏 Edge R0 (边内径)')
        .onChange((v: number) => updateBubbleSets({ edgeR0: v })),
      panel
        .add(config, 'edgeR1', 0, 50, 1)
        .name('📐 Edge R1 (边外径)')
        .onChange((v: number) => updateBubbleSets({ edgeR1: v })),
      panel
        .add(config, 'nodeR0', 0, 50, 1)
        .name('⭕ Node R0 (节点内径)')
        .onChange((v: number) => updateBubbleSets({ nodeR0: v })),
      panel
        .add(config, 'nodeR1', 0, 100, 1)
        .name('⚪ Node R1 (节点外径)')
        .onChange((v: number) => updateBubbleSets({ nodeR1: v })),
      panel
        .add(config, 'morphBuffer', 0, 30, 1)
        .name('🔄 Morph Buffer (形态缓冲)')
        .onChange((v: number) => updateBubbleSets({ morphBuffer: v })),
      panel
        .add(config, 'threshold', 0, 5, 0.1)
        .name('🎚️ Threshold (阈值)')
        .onChange((v: number) => updateBubbleSets({ threshold: v })),
      panel
        .add(config, 'memberInfluenceFactor', 0, 2, 0.1)
        .name('👥 Member Influence (成员影响)')
        .onChange((v: number) => updateBubbleSets({ memberInfluenceFactor: v })),
      panel
        .add(config, 'edgeInfluenceFactor', 0, 2, 0.1)
        .name('🔗 Edge Influence (边影响)')
        .onChange((v: number) => updateBubbleSets({ edgeInfluenceFactor: v })),
      panel
        .add(config, 'nonMemberInfluenceFactor', -2, 0, 0.1)
        .name('⛔ Non-Member Influence (排斥影响)')
        .onChange((v: number) => updateBubbleSets({ nonMemberInfluenceFactor: v })),
      panel
        .add(config, 'virtualEdges')
        .name('🔗 Virtual Edges (虚拟边)')
        .onChange((v: boolean) => updateBubbleSets({ virtualEdges: v })),

      // === BubbleSets Style Parameters (样式参数) ===
      panel
        .add(config, 'strokeWidth', 0, 10, 0.5)
        .name('✏️ Stroke Width (线宽)')
        .onChange((v: number) => updateBubbleSets({ lineWidth: v })),
      panel
        .add(config, 'strokeOpacity', 0, 1, 0.05)
        .name('👁️ Stroke Opacity (线透明度)')
        .onChange((v: number) => {
          if (config.showHyperedges) updateBubbleSets({ strokeOpacity: v });
        }),
    ];
  };

  return graph;
};
