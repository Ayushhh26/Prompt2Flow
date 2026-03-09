import React, { useState, useCallback, useRef } from "react";
import {
  ReactFlowProvider,
  ReactFlow,
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";
import html2canvas from "html2canvas";
import "@xyflow/react/dist/style.css";
import { FaPaperclip, FaPaperPlane, FaCamera } from "react-icons/fa";
import { Monitor, Cloud, Server, Code, Database, Zap } from "lucide-react";
import "./App3.css";
import { Handle } from "@xyflow/react";
import { BaseEdge, getStraightPath } from "@xyflow/react";
import Dagre from "@dagrejs/dagre";

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY }) => {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
    </>
  );
};

const edgeTypes = {
  "custom-edge": CustomEdge,
};
// Icon map with string keys
const iconMap = {
  monitor: <Monitor size={24} />,
  cloud: <Cloud size={24} />,
  server: <Server size={24} />,
  code: <Code size={24} />,
  database: <Database size={24} />,
  zap: <Zap size={24} />,
};
const defaultEdgeOptions = {
  style: { stroke: "#2563eb", strokeWidth: 2 }, // Blue edges with a width of 2
};
const CustomNode = ({ data, isConnectable }) => {
  const icon = iconMap[data.icon] ?? null;
  return (
    <div className="node-container">
      {/* Top Handle */}
      <Handle
        type="target"
        position="top"
        id="top"
        style={{ background: "#2563eb" }}
        isConnectable={isConnectable}
      />
      {/* Output Handle */}

      <div className="node-icon">{icon}</div>
      <div className="node-label">{data.label}</div>
      {/* Input Handle */}

      {/* Bottom Handle */}
      <Handle
        type="source"
        position="bottom"
        id="bottom"
        style={{ background: "#2563eb" }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

const CustomNodeVariant = ({ data, isConnectable }) => {
  const icon = iconMap[data.icon] ?? null;
  return (
    <div className="circular-node">
      {/* Top Handle */}
      <Handle
        type="target"
        position="top"
        id="top"
        style={{ background: "#2563eb" }}
        isConnectable={isConnectable}
      />
      {/* Output Handle */}
      <Handle
        type="source"
        position="right"
        id="right"
        style={{ background: "#2563eb" }}
        isConnectable={isConnectable}
      />
      <div className="circular-node-icon">{icon}</div>
      <div className="circular-node-label">{data.label}</div>
      {/* Input Handle */}
      <Handle
        type="target"
        position="left"
        id="left"
        style={{ background: "#2563eb" }}
        isConnectable={isConnectable}
      />
      {/* Bottom Handle */}
      <Handle
        type="source"
        position="bottom"
        id="bottom"
        style={{ background: "#2563eb" }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
  circular: CustomNodeVariant,
};

const getLayoutedElements = (nodes, edges, options) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: options.direction });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    })
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showMessage, setShowMessage] = useState(true); // State to control the message visibility
  const [prompt, setPrompt] = useState(""); // State for user input
  const [darkMode, setDarkMode] = useState(false); // State for theme
  const [loading, setLoading] = useState(false); // Loading state
  const [layoutDirection, setLayoutDirection] = useState("TB"); // Layout direction (LR = Left-to-Right, TB = Top-to-Bottom)
  const { fitView } = useReactFlow();
  const reactFlowWrapper = useRef(null);

  const onLayout = useCallback(
    (layoutDirection) => {
      console.log(nodes);
      const layouted = getLayoutedElements(nodes, edges, { layoutDirection });

      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
      setLayoutDirection(layoutDirection == "LR" ? "TB" : "LR");
      fitView();
    },
    [nodes, edges]
  );

  // Function to fetch data from GPT API
  const fetchGPTData = async () => {
    let inputText = prompt;
    if (prompt.trim() !== "") {
      setShowMessage(false); // Hide the message
      setPrompt("");
    }
    if (!prompt.trim()) return;

    setLoading(true); // Show loading state

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer API KEY`, // Replace with your valid API key
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: `
You are an expert at analyzing and converting code or instructional text into logical steps and visual flows.
Your task is to:
1. Analyze the given input (either code or plain text).
2. Extract the key logical steps or concepts.
3. Generate a JSON structure with:
   - **nodes**: Each key step as a labeled node.
   - **edges**: Connections between these steps as directional relationships.
4. Ensure the output format is fully compatible with React Flow.

### Output JSON Format:
{
  "nodes": [
    {
      "id": "1",
      "data": { "label": "Step description here" },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2"
    }
  ]
}

Return only the JSON object. Do not include any additional text or explanation.
Input: ${inputText}
              `,
              },
            ],
            temperature: 0.3,
          }),
        }
      );
      setPrompt("");

      const { choices } = await response.json();
      const rawContent = choices[0].message.content;

      // Extract JSON from the response
      let flowData;
      try {
        flowData = JSON.parse(rawContent);
      } catch (error) {
        // Attempt to extract JSON if extra text is included
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          flowData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON format in GPT response");
        }
      }

      // Update nodes and edges
      const newNodes = flowData.nodes.map((node) => ({
        id: node.id,
        type: "custom",
        data: { label: node.data.label, icon: node.icon || "monitor" },
        position: { x: Math.random() * 400, y: Math.random() * 400 }, // Random position
      }));

      const newEdges = flowData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "step",
      }));

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
    } catch (error) {
      console.error("Error fetching GPT data:", error);
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = () => {
    if (prompt.trim() !== "") {
      setShowMessage(false); // Hide the message
    }

    const newNode = {
      id: `${nodes.length + 1}`,
      type: "custom",
      data: { label: prompt || "New Node", icon: "monitor", color: "#2563eb" },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };

    setNodes((nds) => [...nds, newNode]);
    setPrompt(""); // Clear the input field
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPrompt(event.target.result); // Set file content to the text area
      };
      reader.readAsText(file);
    }
  };

  const toggleTheme = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const handleScreenshot = async () => {
    if (reactFlowWrapper.current) {
      // Get the floating text area element
      const floatingTextArea = document.getElementById("floating-text-area");

      // Temporarily remove the floating text area from the DOM
      if (floatingTextArea) {
        floatingTextArea.style.display = "none";
      }
      // Wait for the DOM to fully update before capturing the screenshot
      setTimeout(async () => {
        const canvas = await html2canvas(reactFlowWrapper.current, {
          useCORS: true, // Enable cross-origin resource sharing for external assets
          logging: true, // Enable logging for debugging
          scale: 2, // Increase resolution of the screenshot
          foreignObjectRendering: true, // Enable foreignObject rendering for SVGs
        });

        // Restore the floating text area visibility
        if (floatingTextArea) {
          floatingTextArea.style.display = "flex";
        }

        // Convert canvas to image and trigger download
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = "reactflow-screenshot.png";
        link.click(); // Trigger the download
      }, 200); // Delay to ensure DOM updates (100ms should be sufficient)
      // Capture the React Flow wrapper
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: darkMode
          ? "linear-gradient(120deg, #2c2c2c, #3a3a3a)" // Greyish gradient for dark mode
          : "linear-gradient(120deg, #e0f7fa, #ffffff)", // Light blueish gradient for light mode
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      {/* Header Section with Logo and Theme Toggle and Screenshot Button **/}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px 20px",
          background: darkMode
            ? "linear-gradient(90deg, #2c2c2c, #3a3a3a)"
            : "linear-gradient(90deg, #e0f7fa, #ffffff)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          borderBottom: darkMode ? "1px solid #444" : "1px solid #ddd",
        }}
      >
        {/* Logo Section */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            margin: 0,
            fontFamily: "'Poppins', sans-serif",
            background: "linear-gradient(90deg, #2563eb, #10b981, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradient-animation 3s infinite",
          }}
        >
          Vizualize<span style={{ fontWeight: "lighter" }}>IT</span>
        </h1>

        {/* Buttons Section */}
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Screenshot Button */}
          <button
            onClick={handleScreenshot}
            style={{
              padding: "10px 15px",
              background: "linear-gradient(120deg, #10b981, #34d399)",
              color: "#ffffff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            <FaCamera />
            Download
          </button>

          {/* Apply Layout Button */}
          <button
            onClick={() => {
              layoutDirection == "LR" ? onLayout("LR") : onLayout("TB");
            }}
            style={{
              padding: "10px 15px",
              background: "linear-gradient(120deg, #2563eb, #4f46e5)",
              color: "#ffffff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            {layoutDirection == "LR"
              ? "Apply Vertical Layout"
              : "Apply Horizontal Layout"}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              padding: "10px 15px",
              background: darkMode
                ? "linear-gradient(120deg, #444, #555)"
                : "linear-gradient(120deg, #2563eb, #10b981)",
              color: "#ffffff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* React Flow Section */}

      {showMessage && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            padding: "20px",
            fontSize: "24px",
            fontWeight: "bold",
            fontFamily: "'Arial', sans-serif",
            background: "linear-gradient(90deg, #2563eb, #10b981, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradient-animation 3s infinite",
          }}
        >
          <h1 style={{ margin: 0 }}>
            Unleash Your Creativity - Build, Connect, and Visualize!
          </h1>
        </div>
      )}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
        >
          <Background />
          <Controls
            style={{
              color: "#2563eb", // Blue background, // White icons
              borderRadius: "5px", // Rounded corners
              padding: "5px", // Padding for better spacing
            }}
          />
        </ReactFlow>

        {/* Floating Text Input Section */}
        <div
          id="floating-text-area"
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            padding: "15px",
            background: darkMode
              ? "linear-gradient(120deg, #3a3a3a, #2c2c2c)"
              : "linear-gradient(120deg, #e0f7fa, #ffffff)",
            borderRadius: "20px",
            boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)",
            width: "90%",
            maxWidth: "1200px",
            animation: "fade-in 0.5s ease-in-out",
            border: darkMode ? "1px solid #444" : "1px solid #ddd",
          }}
        >
          {/* File Upload Icon */}
          <label
            htmlFor="file-upload"
            style={{
              cursor: "pointer",
              marginRight: "10px",
              color: darkMode ? "#ffffff" : "#2563eb",
              fontSize: "20px",
            }}
          >
            <FaPaperclip />
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          {/* Text Area */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write your prompt here..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent newline in the text area
                handleAddNode(); // Call the function to add a node
              }
            }}
            style={{
              flex: 1,
              height: "50px",
              marginRight: "10px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              resize: "none",
              backgroundColor: darkMode ? "#444" : "#ffffff",
              color: darkMode ? "#ffffff" : "#000000",
              fontFamily: "'Arial', sans-serif",
              fontSize: "16px",
            }}
          />

          {/* Send Button */}
          <button
            onClick={fetchGPTData}
            style={{
              padding: "10px 20px",
              background: darkMode
                ? "linear-gradient(120deg, #444, #555)"
                : "linear-gradient(120deg, #2563eb, #10b981)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            <FaPaperPlane />
          </button>
        </div>

        {loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              height: "10px",
              background: "#ddd",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, #2563eb, #10b981)",
                animation: "progress-bar 1.5s infinite",
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

const App2 = () => {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
};
export default App2;
