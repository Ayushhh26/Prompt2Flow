import React, { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as FaIcons from "react-icons/fa"; // Import all Font Awesome icons
import * as MdIcons from "react-icons/md"; // Import all Material Design icons
import "./App.css";

// Mapping of words to icons
const iconMapping = {
  start: FaIcons.FaPlay,
  process: MdIcons.MdSettings,
  stop: FaIcons.FaStop,
  user: FaIcons.FaUser,
  home: FaIcons.FaHome,
  settings: MdIcons.MdSettings,
};

// Custom Node Component with Dynamic Icons
const DynamicIconNode = ({ data }) => {
  const Icon = iconMapping[data.icon] || FaIcons.FaQuestionCircle; // Default icon if no match
  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "8px",
        backgroundColor: data.color || "#2563eb",
        color: "white",
        textAlign: "center",
        border: "2px solid #1e40af",
        width: "150px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Icon size={24} style={{ marginBottom: "10px" }} /> {/* Dynamic Icon */}
      <div>{data.label}</div>
    </div>
  );
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [prompt, setPrompt] = useState(""); // State for user input
  const reactFlowWrapper = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = () => {
    // Determine icon and color based on the prompt
    let icon = "start";
    let color = "#2563eb";

    if (prompt.toLowerCase().includes("process")) {
      icon = "process";
      color = "#10b981";
    } else if (prompt.toLowerCase().includes("stop")) {
      icon = "stop";
      color = "#ef4444";
    }

    const newNode = {
      id: `${nodes.length + 1}`,
      type: "dynamicIcon",
      data: { label: prompt || "New Node", icon, color },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };

    setNodes((nds) => [...nds, newNode]);
    setPrompt(""); // Clear the input field
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Side Panel */}
      <div
        style={{
          width: "300px",
          padding: "20px",
          borderRight: "1px solid #ddd",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h3
          style={{
            textAlign: "center",
            fontSize: "24px",
            fontWeight: "bold",
            color: "#2563eb", // Primary color
          }}
        >
          <span style={{ color: "#10b981" }}>Vizualize</span>
          <span style={{ color: "#ef4444" }}>IT</span>
        </h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write your prompt here..."
          style={{
            width: "90%",
            height: "300px",
            marginBottom: "10px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "5px",
          }}
        />
        <input
          type="file"
          accept=".txt"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setPrompt(event.target.result); // Set file content to the text area
              };
              reader.readAsText(file);
            }
          }}
          style={{
            marginBottom: "10px",
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            width: "100%",
          }}
        />
        <button
          onClick={handleAddNode}
          style={{
            padding: "10px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Generate FlowChart
        </button>
      </div>

      {/* React Flow Canvas */}
      <div style={{ flex: 1 }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          nodeTypes={{
            dynamicIcon: DynamicIconNode,
          }}
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
