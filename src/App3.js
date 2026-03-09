import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App3.css";

import { Monitor, Cloud, Server, Code, Database, Zap } from "lucide-react";

// Icon map with string keys
const iconMap = {
  monitor: <Monitor size={24} />,
  cloud: <Cloud size={24} />,
  server: <Server size={24} />,
  code: <Code size={24} />,
  database: <Database size={24} />,
  zap: <Zap size={24} />,
};

const CustomNode = ({ data }) => {
  const icon = iconMap[data.icon] ?? null;
  return (
    <div className="node-container">
      <div className="node-icon">{icon}</div>
      <div className="node-label">{data.label}</div>
    </div>
  );
};

// Circular styled node
const CustomNodeVariant = ({ data }) => {
  const icon = iconMap[data.icon] ?? null;
  return (
    <div className="circular-node">
      <div className="circular-node-icon">{icon}</div>
      <div className="circular-node-label">{data.label}</div>
    </div>
  );
};

// Node definitions
const nodes = [
  {
    id: "1",
    type: "custom",
    position: { x: 250, y: 50 },
    data: { label: "Load Balancer", icon: "cloud" },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 100, y: 180 },
    data: { label: "Web Server 1", icon: "monitor" },
  },
  {
    id: "3",
    type: "custom",
    position: { x: 400, y: 180 },
    data: { label: "Web Server 2", icon: "monitor" },
  },
  {
    id: "4",
    type: "custom",
    position: { x: 250, y: 320 },
    data: { label: "App Server", icon: "server" },
  },
  {
    id: "5",
    type: "circular",
    position: { x: 100, y: 470 },
    data: { label: "Database", icon: "database" },
  },
  {
    id: "6",
    type: "circular",
    position: { x: 400, y: 470 },
    data: { label: "Cache", icon: "zap" },
  },
];

// Edge definitions
const edges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
  { id: "e4-6", source: "4", target: "6" },
];

// Register node types
const nodeTypes = {
  custom: CustomNode,
  circular: CustomNodeVariant,
};

// Main component
const SystemDesignDiagram = () => {
  return (
    <ReactFlowProvider>
      <div style={{ width: "100%", height: "700px" }}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default SystemDesignDiagram;
