import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Maximize, Minimize, Loader2, AlertCircle, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';

const NODE_SIZES = {
  center: { width: 120, height: 120 },
  case: { width: 90, height: 90 },
  evidence: { width: 80, height: 80 },
  tag: { width: 100, height: 36 },
  other: { width: 80, height: 36 },
};

const applyRadialLayout = (apiNodes, currentCaseId) => {
  const nodes = JSON.parse(JSON.stringify(apiNodes));

  const centerNode = nodes.find(n => n.id === currentCaseId || n.data?.case_id === currentCaseId);
  const tags = nodes.filter(n => n.type === 'tag');
  const evidence = nodes.filter(n => n.type === 'evidence');
  const cases = nodes.filter(n => n.type === 'case' && n.id !== currentCaseId && n.data?.case_id !== currentCaseId);

  const processedIds = new Set([
    ...(centerNode ? [centerNode.id] : []),
    ...tags.map(n => n.id),
    ...evidence.map(n => n.id),
    ...cases.map(n => n.id)
  ]);
  const others = nodes.filter(n => !processedIds.has(n.id));

  const positionCircle = (nodesArray, radius, startAngle = 0, sizeKey = 'other') => {
    const total = nodesArray.length;
    const size = NODE_SIZES[sizeKey] || NODE_SIZES.other;
    nodesArray.forEach((n, i) => {
      const angle = startAngle + (i / total) * 2 * Math.PI;
      // Offset position so the node CENTER is on the circle, not the top-left corner
      n.position = {
        x: Math.round(Math.cos(angle) * radius - size.width / 2),
        y: Math.round(Math.sin(angle) * radius - size.height / 2),
      };
      n.sourcePosition = 'right';
      n.targetPosition = 'left';
    });
  };

  positionCircle(tags, 220, 0, 'tag');
  positionCircle(evidence, 350, Math.PI / 4, 'evidence');
  positionCircle(cases, 550, Math.PI / 8, 'case');
  positionCircle(others, 700, 0, 'other');

  if (centerNode) {
    const cSize = NODE_SIZES.center;
    centerNode.position = { x: -cSize.width / 2, y: -cSize.height / 2 };
    centerNode.sourcePosition = 'right';
    centerNode.targetPosition = 'left';
  }

  return nodes;
};

const applyStylesToNodesAndEdges = (radiallyLayoutedNodes, apiEdges, currentCaseId) => {
  const styledNodes = radiallyLayoutedNodes.map((n) => {
    let displayLabel = n.data?.title || n.data?.case_id || n.data?.label || n.id;
    if (typeof displayLabel === 'string' && displayLabel.length > 30) {
      displayLabel = displayLabel.substring(0, 30) + '...';
    }

    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontSize: '10px',
      padding: '8px',
      borderRadius: '4px',
      cursor: 'pointer',
    };

    if (n.id === currentCaseId || n.data?.case_id === currentCaseId) {
      return {
        ...n,
        type: 'default',
        style: {
          ...baseStyle,
          width: NODE_SIZES.center.width, height: NODE_SIZES.center.height,
          background: '#1a73e8', color: '#ffffff', border: '4px solid #d2e3fc', borderRadius: '50%',
          fontWeight: '700', fontSize: '11px',
          boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)'
        },
        data: { ...n.data, label: `CURRENT CASE\n${displayLabel}` }
      };
    } else if (n.type === 'case') {
      return {
        ...n,
        type: 'default',
        style: {
          ...baseStyle,
          width: NODE_SIZES.case.width, height: NODE_SIZES.case.height,
          background: '#ffffff', color: '#202124', border: '2px solid #dadce0', borderRadius: '50%',
          fontWeight: '500',
          boxShadow: '0 1px 3px rgba(60,64,67,0.3)'
        },
        data: { ...n.data, label: displayLabel }
      };
    } else if (n.type === 'evidence') {
      return {
        ...n,
        type: 'default',
        style: {
          ...baseStyle,
          width: NODE_SIZES.evidence.width, height: NODE_SIZES.evidence.height,
          background: '#e8f0fe', color: '#1967d2', border: '2px solid #aecbfa', borderRadius: '50%',
          fontWeight: '500'
        },
        data: { ...n.data, label: displayLabel }
      };
    } else {
      return {
        ...n,
        type: 'default',
        style: {
          ...baseStyle,
          width: NODE_SIZES.tag.width,
          background: '#f1f3f4', color: '#5f6368', border: '1px solid #dadce0', borderRadius: '24px',
          fontWeight: '500', padding: '6px 12px'
        },
        data: { ...n.data, label: displayLabel }
      };
    }
  });

  const styledEdges = apiEdges.map((e, idx) => {
    const isShared = e.label?.includes('SHARES_TAG');
    const isTagged = e.label === 'TAGGED_WITH';
    const isEvidence = e.label === 'HAS_EVIDENCE';

    const edgeId = e.id || `e-${e.source}-${e.target}-${idx}`;
    const cleanEdge = { id: edgeId, source: e.source, target: e.target, animated: false };

    if (isShared) {
      return { ...cleanEdge, style: { stroke: '#fbbc04', strokeWidth: 1.5, opacity: 0.8 }, animated: true };
    }
    if (isTagged) {
      return { ...cleanEdge, style: { stroke: '#bdc1c6', strokeWidth: 1.5, strokeDasharray: '4 4' } };
    }
    if (isEvidence) {
      return { ...cleanEdge, style: { stroke: '#1a73e8', strokeWidth: 2, opacity: 0.6 } };
    }
    
    return { ...cleanEdge, style: { stroke: '#dadce0', strokeWidth: 1 } };
  });

  return { nodes: styledNodes, edges: styledEdges };
};


export default function EvidenceGraph() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case_id') || localStorage.getItem('activeCaseId');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!caseId) return;

    const fetchGraph = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/api/cases/graph/${caseId}`);
        
        const radiallyScatteredNodes = applyRadialLayout(data.nodes, caseId);
        const { nodes: styledNodes, edges: styledEdges } = applyStylesToNodesAndEdges(radiallyScatteredNodes, data.edges, caseId);
        
        setNodes(styledNodes);
        setEdges(styledEdges);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch graph from Neo4j. Ensure the case is ingested recursively.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [caseId, setNodes, setEdges]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes (e.g. user pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Node click handler — open description popup
  const onNodeClick = useCallback((_event, node) => {
    const data = node.data || {};
    setSelectedNode({
      id: node.id,
      type: node.type || 'unknown',
      label: data.label || node.id,
      case_id: data.case_id || node.id,
      title: data.title || data.label || node.id,
      description: data.description || data.modus_operandi || null,
      incident_type: data.incident_type || null,
      jurisdiction: data.jurisdiction || null,
      modus_operandi: data.modus_operandi || null,
      name: data.name || null,
    });
  }, []);
  
  // Render empty state if no case selected
  if (!caseId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-page h-[calc(100vh-48px)]">
        <div className="text-textSecondary text-sm">No case selected. Run retrieval from the Case Input tab first.</div>
      </div>
    );
  }

  // Build a human-readable summary for the node popup
  const buildNodeDescription = (node) => {
    if (!node) return '';
    const isCaseType = node.type === 'case' || node.type === 'default';
    const isEvidence = node.type === 'evidence';
    const isTag = node.type === 'tag';

    if (isTag) {
      return `This is a tag node: "${node.name || node.label}". Cases sharing this tag are linked together in the evidence graph.`;
    }
    if (isEvidence) {
      return node.description || `Evidence item linked to the case. ID: ${node.case_id}`;
    }
    // Case node (current or past)
    const parts = [];
    if (node.incident_type) parts.push(`Type: ${node.incident_type.replace(/_/g, ' ')}`);
    if (node.jurisdiction) parts.push(`Jurisdiction: ${node.jurisdiction}`);
    if (node.modus_operandi) parts.push(`MO: ${node.modus_operandi}`);
    if (node.description) parts.push(node.description);
    if (parts.length === 0) parts.push(`Case ${node.case_id} — no additional details available.`);
    return parts.join('\n');
  };

  return (
    <div ref={containerRef} className="flex-1 w-full h-full relative bg-page" style={{ height: 'calc(100vh - 48px)' }}>
      
      {/* Top Overlay */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center pointer-events-none">
        <div className="text-sm text-textSecondary font-medium bg-white/90 px-4 py-2 rounded-full shadow-sm backdrop-blur border border-border">Evidence Graph — {caseId}</div>
        <button 
          onClick={toggleFullscreen} 
          className="pointer-events-auto bg-white border border-border text-textSecondary text-sm px-4 py-2 rounded-full hover:text-textPrimary hover:bg-gray-50 transition-colors flex items-center gap-2 focus:outline-none shadow-sm"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          {isFullscreen ? 'Exit full screen' : 'Full screen'}
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-page/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-6 h-6 text-accent animate-spin mb-3" />
          <p className="text-textSecondary text-sm font-medium tracking-tight">Querying Neo4j Subgraph...</p>
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
          <div className="bg-[#2a1a1a] border border-red-900 text-red-500 text-sm px-6 py-4 rounded-sm flex items-center gap-3">
             <AlertCircle size={18} />
             {error}
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      {nodes.length > 0 ? (
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            className="bg-page"
            proOptions={{ hideAttribution: true }}
            minZoom={0.1}
          >
            <Background color="#bdc1c6" gap={20} variant="dots" />
            <Controls showInteractive={false} className="bg-white border border-border shadow-sm rounded-lg overflow-hidden [&>button]:border-b-border [&>button]:fill-textSecondary [&>button:hover]:bg-gray-50 [&>button:hover]:fill-textPrimary" position="bottom-right" />
          </ReactFlow>
        </div>
      ) : (
        !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6 bg-white shadow-sm">
              <span className="text-gray-400 text-3xl font-medium">0</span>
            </div>
            <p className="text-textPrimary font-medium text-lg mb-2">No network data linked to this case identifier.</p>
            <p className="text-textSecondary text-sm">If this is a new case, ensure historical cases are successfully ingested.</p>
          </div>
        )
      )}

      {/* Node Detail Popup */}
      {selectedNode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white border border-border rounded-xl shadow-lg w-[380px] max-h-[420px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                selectedNode.type === 'evidence' ? 'bg-blue-400' :
                selectedNode.type === 'tag' ? 'bg-gray-400' :
                'bg-brandBlue'
              }`}></div>
              <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                {selectedNode.type === 'evidence' ? 'Evidence' : selectedNode.type === 'tag' ? 'Tag' : 'Case'}
              </span>
            </div>
            <button 
              onClick={() => setSelectedNode(null)} 
              className="text-textSecondary hover:text-textPrimary transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
          <div className="px-5 py-4">
            <h3 className="text-base font-semibold text-textPrimary mb-1 leading-tight">{selectedNode.title}</h3>
            {selectedNode.case_id && selectedNode.case_id !== selectedNode.title && (
              <p className="text-xs font-mono text-textMuted mb-3">{selectedNode.case_id}</p>
            )}
            <p className="text-sm text-textSecondary leading-relaxed whitespace-pre-wrap">
              {buildNodeDescription(selectedNode)}
            </p>
            {selectedNode.incident_type && selectedNode.type !== 'tag' && selectedNode.type !== 'evidence' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                  {selectedNode.incident_type.replace(/_/g, ' ')}
                </span>
                {selectedNode.jurisdiction && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {selectedNode.jurisdiction}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click backdrop to close popup */}
      {selectedNode && (
        <div className="absolute inset-0 z-20" onClick={() => setSelectedNode(null)} />
      )}

      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-10 bg-white border border-border p-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-56">
        <h3 className="text-xs font-bold tracking-wider uppercase text-textSecondary mb-3">Legend</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-brandBlue border-2 border-blue-200"></div>
            <span className="text-sm font-medium text-textPrimary">Current case</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
            <span className="text-sm font-medium text-textPrimary">Past case</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-50 border-2 border-blue-200"></div>
            <span className="text-sm font-medium text-textPrimary">Evidence match</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-5 h-[3px] bg-brandAmber"></div>
            <span className="text-sm font-medium text-textPrimary">Shares pattern</span>
          </div>
        </div>
      </div>
      
      {/* Evidence Link Summary - Dynamic */}
      {edges.filter(e => e.label === 'HAS_EVIDENCE').length > 0 && (
        <div className="absolute bottom-4 right-16 z-10 bg-surface border border-border rounded-sm w-64 shadow-lg">
          <div className="px-3 py-2 border-b border-border">
            <h3 className="text-[10px] tracking-widest uppercase text-textSecondary font-medium">Attached Evidence</h3>
          </div>
          <div className="p-3 text-xs font-mono text-textSecondary leading-5">
             {edges.filter(e => e.label === 'HAS_EVIDENCE').map((e, idx) => (
                <div key={idx} className="flex justify-between">
                 {/* Try to resolve evidence name dynamically */}
                 <span className="truncate max-w-[150px]">{nodes.find(n => n.id === e.target)?.data?.label || e.target}</span>
                 <span className="text-emerald-400 font-medium">Linked</span>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
