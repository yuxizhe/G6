// TypeScript type definitions for data.js

interface DatabaseInfo {
  name: string;
  vertices: number;
  edges: number;
}

interface Vertex {
  id: string;
  degree: number;
  entity_type: string;
  description: string;
}

interface GraphVertex {
  entity_type: string;
  degree: number;
  description: string;
  [key: string]: any;
}

interface GraphEdge {
  keywords: string;
  summary: string;
  weight: number;
}

interface VertexGraph {
  vertices: {
    [nodeId: string]: GraphVertex;
  };
  edges: {
    [edgeId: string]: GraphEdge;
  };
}

interface HypergraphData {
  database: DatabaseInfo;
  vertices: Vertex[];
  graphs: {
    [vertexId: string]: VertexGraph;
  };
}

export const datas: HypergraphData;
