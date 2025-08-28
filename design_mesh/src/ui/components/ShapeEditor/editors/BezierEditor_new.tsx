import React, { useState, useEffect, useRef } from 'react';
import { SymbolType } from '../../res/CanvasSection';
import { SHAPE_COLORS } from '../../../constants/inventory';
import { svgToBlob } from '../../../utils/svgUtils';

interface ControlPoint {
  x: number;
  y: number;
}

// Legacy single curve structure for backward compatibility
interface BezierCurve {
  start: ControlPoint;
  cp1: ControlPoint;
  cp2: ControlPoint;
  end: ControlPoint;
}

// New multi-node path structure
interface BezierNode {
  point: ControlPoint;
  leftHandle?: ControlPoint;  // Control point for incoming curve
  rightHandle?: ControlPoint; // Control point for outgoing curve
  type: 'corner' | 'smooth' | 'symmetric';
  selected?: boolean;
}

interface BezierPath {
  nodes: BezierNode[];
  closed: boolean;
}

interface DragState {
  nodeIndex: number;
  handleType: 'point' | 'leftHandle' | 'rightHandle';
}

interface BezierEditorProps {
  shape: SymbolType;
  onChange: (shape: SymbolType) => void;
}

const BezierEditor: React.FC<BezierEditorProps> = ({ shape, onChange }) => {
  // Helper function to convert legacy BezierCurve to new BezierPath format
  const migrateLegacyCurve = (curve: BezierCurve): BezierPath => {
    return {
      nodes: [
        {
          point: curve.start,
          rightHandle: curve.cp1,
          type: 'corner' as const,
          selected: false
        },
        {
          point: curve.end,
          leftHandle: curve.cp2,
          type: 'corner' as const,
          selected: false
        }
      ],
      closed: false
    };
  };

  // Helper function to create default path
  const createDefaultPath = (): BezierPath => {
    return {
      nodes: [
        {
          point: { x: 100, y: 250 },
          rightHandle: { x: 200, y: 100 },
          type: 'corner' as const,
          selected: false
        },
        {
          point: { x: 500, y: 250 },
          leftHandle: { x: 400, y: 350 },
          type: 'corner' as const,
          selected: false
        }
      ],
      closed: false
    };
  };

  // Initialize path data from existing shape or use defaults
  const initializePath = (): BezierPath => {
    const shapeData = (shape as any).curveData;
    console.log('BezierEditor_new: Initializing path with shapeData:', shapeData);
    
    if (!shapeData) {
      console.log('BezierEditor_new: No curve data found, creating default path');
      return createDefaultPath();
    }
    
    // Check if it's new format (has 'nodes' property) or legacy format
    if ('nodes' in shapeData) {
      console.log('BezierEditor_new: Found multi-node path with', shapeData.nodes.length, 'nodes');
      return shapeData as BezierPath;
    } else {
      console.log('BezierEditor_new: Found legacy curve, migrating to multi-node format');
      // Legacy format - convert to new format
      return migrateLegacyCurve(shapeData as BezierCurve);
    }
  };

  const [path, setPath] = useState<BezierPath>(initializePath());

  // Initialize curve properties from existing shape or use defaults
  const initialProps = {
  stroke: (shape as any).stroke || SHAPE_COLORS.STROKE,
    strokeWidth: (shape as any).strokeWidth || 3,
    lineCap: (shape as any).lineCap || 'round' as const,
  };
  
  console.log('BezierEditor_new: Initializing with colors - existing stroke:', (shape as any).stroke, ', using:', initialProps.stroke);

  const [curveProps, setCurveProps] = useState(initialProps);

  // Add drag state for multi-node system
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  
  // Add zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Boundary preview states
  const [showBoundary, setShowBoundary] = useState(true); // Enable by default
  const [boundaryPadding, setBoundaryPadding] = useState(20);
  const [boundaryBounds, setBoundaryBounds] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  
  // Document size state
  const [documentWidth, setDocumentWidth] = useState(800);
  const [documentHeight, setDocumentHeight] = useState(600);
  
  // Ctrl key state for pan mode feedback
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  // PNG preview state
  const [showPngPreview, setShowPngPreview] = useState(false);
  const [pngPreviewUrl, setPngPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update boundary bounds whenever path changes
  useEffect(() => {
    if (showBoundary) {
      // TODO: Implement bounds calculation if needed
      setBoundaryBounds(null);
    }
  }, [path, showBoundary]);

  // Save boundary padding changes
  // TODO: Implement shape update when boundary padding changes if bounds calculation is restored

  useEffect(() => {
    drawBezier();
  }, [path, curveProps, zoom, panOffset]);

  // TODO: Implement shape update when path or curveProps change if bounds calculation is restored

  const drawBezier = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context and apply transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw bezier path with multiple segments
    if (path.nodes.length >= 2) {
      ctx.strokeStyle = curveProps.stroke;
      ctx.lineWidth = curveProps.strokeWidth;
      ctx.lineCap = curveProps.lineCap;

      ctx.beginPath();
      ctx.moveTo(path.nodes[0].point.x, path.nodes[0].point.y);
      
      // Draw segments between adjacent nodes
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const currentNode = path.nodes[i];
        const nextNode = path.nodes[i + 1];
        
        const cp1 = currentNode.rightHandle || currentNode.point;
        const cp2 = nextNode.leftHandle || nextNode.point;
        
        ctx.bezierCurveTo(
          cp1.x, cp1.y,
          cp2.x, cp2.y,
          nextNode.point.x, nextNode.point.y
        );
      }
      
      // If path is closed, connect back to start
      if (path.closed && path.nodes.length > 2) {
        const lastNode = path.nodes[path.nodes.length - 1];
        const firstNode = path.nodes[0];
        
        const cp1 = lastNode.rightHandle || lastNode.point;
        const cp2 = firstNode.leftHandle || firstNode.point;
        
        ctx.bezierCurveTo(
          cp1.x, cp1.y,
          cp2.x, cp2.y,
          firstNode.point.x, firstNode.point.y
        );
      }
      
      ctx.stroke();
    }

    // Draw control lines for selected nodes only
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    path.nodes.forEach((node, index) => {
      if (node.selected || selectedNodeIndex === index) {
        // Draw left handle line
        if (node.leftHandle) {
          ctx.beginPath();
          ctx.moveTo(node.point.x, node.point.y);
          ctx.lineTo(node.leftHandle.x, node.leftHandle.y);
          ctx.stroke();
        }
        
        // Draw right handle line
        if (node.rightHandle) {
          ctx.beginPath();
          ctx.moveTo(node.point.x, node.point.y);
          ctx.lineTo(node.rightHandle.x, node.rightHandle.y);
          ctx.stroke();
        }
      }
    });
    
    ctx.setLineDash([]);

    // Draw all node points and handles
    path.nodes.forEach((node, index) => {
      // Draw node point
      ctx.beginPath();
      ctx.arc(node.point.x, node.point.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = (node.selected || selectedNodeIndex === index) ? '#ff4444' : '#4444ff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw handles for selected nodes
      if (node.selected || selectedNodeIndex === index) {
        // Draw left handle
        if (node.leftHandle) {
          ctx.beginPath();
          ctx.arc(node.leftHandle.x, node.leftHandle.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#44ff44';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // Draw right handle
        if (node.rightHandle) {
          ctx.beginPath();
          ctx.arc(node.rightHandle.x, node.rightHandle.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#44ff44';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
    
    // Draw boundary preview if enabled - show exact document size area
    if (showBoundary) {
      // Use document size from state variables
      const docWidth = documentWidth;
      const docHeight = documentHeight;
      
      // Center the document rectangle in the canvas view
      const docX = -docWidth / 2;
      const docY = -docHeight / 2;
      
      // Draw boundary rectangle showing exact screenshot area
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2 / zoom; // Adjust line width for zoom
      ctx.setLineDash([5 / zoom, 5 / zoom]); // Adjust dash pattern for zoom
      ctx.beginPath();
      ctx.rect(docX, docY, docWidth, docHeight);
      ctx.stroke();
      
      // Draw semi-transparent fill showing screenshot area
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fillRect(docX, docY, docWidth, docHeight);
      
      // Add corner markers to make it clear this is the document boundary
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3 / zoom; // Adjust line width for zoom
      const cornerSize = 8 / zoom; // Adjust corner size for zoom
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(docX, docY + cornerSize);
      ctx.lineTo(docX, docY);
      ctx.lineTo(docX + cornerSize, docY);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(docX + docWidth - cornerSize, docY);
      ctx.lineTo(docX + docWidth, docY);
      ctx.lineTo(docX + docWidth, docY + cornerSize);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(docX + docWidth, docY + docHeight - cornerSize);
      ctx.lineTo(docX + docWidth, docY + docHeight);
      ctx.lineTo(docX + docWidth - cornerSize, docY + docHeight);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(docX + cornerSize, docY + docHeight);
      ctx.lineTo(docX, docY + docHeight);
      ctx.lineTo(docX, docY + docHeight - cornerSize);
      ctx.stroke();
    }
    
    // Show PNG preview overlay if enabled
    if (showPngPreview && pngPreviewUrl) {
      const previewImg = new Image();
      previewImg.onload = () => {
        // Draw preview image centered in document bounds
        const docX = -documentWidth / 2;
        const docY = -documentHeight / 2;
        
        // Add semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(docX - 50, docY - 50, documentWidth + 100, documentHeight + 100);
        
        // Draw the PNG preview
        ctx.drawImage(previewImg, docX, docY, documentWidth, documentHeight);
        
        // Add preview label
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('PNG Preview', docX + 10, docY - 10);
      };
      previewImg.src = pngPreviewUrl;
    }
    
    // Restore context
    ctx.restore();
  };

  // Generate PNG preview from current path
  const generatePngPreview = async () => {
    if (path.nodes.length === 0 || isGeneratingPreview) return;
    
    setIsGeneratingPreview(true);
    
    try {
      // Generate SVG from current path data
      const svg = generateSvgFromPath();
      
      // Convert to PNG using svgToBlob
      const blob = await svgToBlob(svg, documentWidth, documentHeight, 'png', 1.0, 1);
      
      // Create object URL for preview
      if (pngPreviewUrl) {
        URL.revokeObjectURL(pngPreviewUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPngPreviewUrl(url);
      
      console.log('PNG preview generated:', { width: documentWidth, height: documentHeight });
    } catch (error) {
      console.error('Failed to generate PNG preview:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Generate SVG string from current path data
  const generateSvgFromPath = (): string => {
    if (path.nodes.length === 0) {
      return `<svg width="${documentWidth}" height="${documentHeight}" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

  // TODO: Implement bounds calculation for centering if needed
  // Skipping bounds-based centering logic

    // Generate path data
    let pathData = '';
    
    if (path.nodes.length >= 2) {
      const startNode = path.nodes[0];
      pathData = `M ${startNode.point.x} ${startNode.point.y}`;
      // Draw segments between adjacent nodes
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const currentNode = path.nodes[i];
        const nextNode = path.nodes[i + 1];
        const cp1 = currentNode.rightHandle || currentNode.point;
        const cp2 = nextNode.leftHandle || nextNode.point;
        pathData += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${nextNode.point.x} ${nextNode.point.y}`;
      }
      // Close path if needed
      if (path.closed && path.nodes.length > 2) {
        const lastNode = path.nodes[path.nodes.length - 1];
        const firstNode = path.nodes[0];
        const cp1 = lastNode.rightHandle || lastNode.point;
        const cp2 = firstNode.leftHandle || firstNode.point;
        pathData += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${firstNode.point.x} ${firstNode.point.y} Z`;
      }
    }

    return `<svg width="${documentWidth}" height="${documentHeight}" xmlns="http://www.w3.org/2000/svg">
      <path d="${pathData}" 
            fill="none" 
            stroke="${curveProps.stroke}" 
            stroke-width="${curveProps.strokeWidth}" 
            stroke-linecap="${curveProps.lineCap}" />
    </svg>`;
  };

  // Helper function to get mouse position relative to canvas with zoom/pan
  const getMousePos = (canvas: HTMLCanvasElement, e: React.MouseEvent): ControlPoint => {
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // Transform coordinates to account for zoom and pan
    return {
      x: (canvasX - panOffset.x) / zoom,
      y: (canvasY - panOffset.y) / zoom,
    };
  };

  // Helper function to check if mouse is near a point (accounting for zoom)
  const isNearPoint = (mouse: ControlPoint, point: ControlPoint, threshold = 10): boolean => {
    const adjustedThreshold = threshold / zoom; // Adjust threshold based on zoom
    const dx = mouse.x - point.x;
    const dy = mouse.y - point.y;
    return Math.sqrt(dx * dx + dy * dy) < adjustedThreshold;
  };

  // Mouse wheel handler for zooming
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
    
    // Calculate new pan offset to keep mouse position stable
    const newPanOffset = {
      x: mouseX - ((mouseX - panOffset.x) * newZoom) / zoom,
      y: mouseY - ((mouseY - panOffset.y) * newZoom) / zoom,
    };
    
    setZoom(newZoom);
    setPanOffset(newPanOffset);
  };

  // Add wheel event listener for proper preventDefault support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, panOffset]); // Dependencies needed for the handleWheel closure

  // Mouse event handlers with multi-node support
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for middle button pan or Ctrl+left-click pan
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      canvas.style.cursor = 'grabbing';
      return;
    }
    
    // Check for regular mouse interactions (left button without Ctrl)
    if (e.button !== 0 || e.ctrlKey) return;

    const mousePos = getMousePos(canvas, e);
    
    // Check for double-click to add node
    if (e.detail === 2) {
      handleAddNode(mousePos);
      return;
    }
    
    // Check for interactions with existing nodes and handles
    for (let nodeIndex = 0; nodeIndex < path.nodes.length; nodeIndex++) {
      const node = path.nodes[nodeIndex];
      
      // Check node point
      if (isNearPoint(mousePos, node.point)) {
        setIsDragging(true);
        setDragState({ nodeIndex, handleType: 'point' });
        setSelectedNodeIndex(nodeIndex);
        canvas.style.cursor = 'grabbing';
        return;
      }
      
      // Check handles for selected nodes
      if (selectedNodeIndex === nodeIndex || node.selected) {
        if (node.leftHandle && isNearPoint(mousePos, node.leftHandle, 8)) {
          setIsDragging(true);
          setDragState({ nodeIndex, handleType: 'leftHandle' });
          canvas.style.cursor = 'grabbing';
          return;
        }
        
        if (node.rightHandle && isNearPoint(mousePos, node.rightHandle, 8)) {
          setIsDragging(true);
          setDragState({ nodeIndex, handleType: 'rightHandle' });
          canvas.style.cursor = 'grabbing';
          return;
        }
      }
    }
    
    // If no interaction found, deselect all nodes
    setSelectedNodeIndex(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle panning
    if (isPanning && lastPanPoint) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const mousePos = getMousePos(canvas, e);

    if (isDragging && dragState) {
      // Update the dragged element position
      setPath(prev => {
        const newPath = { ...prev };
        const nodeIndex = dragState.nodeIndex;
        
        // Create a new nodes array with the updated node
        newPath.nodes = [...prev.nodes];
        
        if (dragState.handleType === 'point') {
          newPath.nodes[nodeIndex] = {
            ...prev.nodes[nodeIndex],
            point: mousePos
          };
        } else if (dragState.handleType === 'leftHandle') {
          newPath.nodes[nodeIndex] = {
            ...prev.nodes[nodeIndex],
            leftHandle: mousePos
          };
        } else if (dragState.handleType === 'rightHandle') {
          newPath.nodes[nodeIndex] = {
            ...prev.nodes[nodeIndex],
            rightHandle: mousePos
          };
        }
        
        return newPath;
      });
    } else {
      // Change cursor when hovering over interactive elements or when Ctrl is pressed
      let isOverInteractive = false;
      
      for (let nodeIndex = 0; nodeIndex < path.nodes.length; nodeIndex++) {
        const node = path.nodes[nodeIndex];
        
        // Check node point
        if (isNearPoint(mousePos, node.point)) {
          isOverInteractive = true;
          break;
        }
        
        // Check handles for selected nodes
        if (selectedNodeIndex === nodeIndex || node.selected) {
          if ((node.leftHandle && isNearPoint(mousePos, node.leftHandle, 8)) ||
              (node.rightHandle && isNearPoint(mousePos, node.rightHandle, 8))) {
            isOverInteractive = true;
            break;
          }
        }
      }
      
      // Set cursor based on state: pan mode (Ctrl pressed), interactive hover, or default
      if (isCtrlPressed && !isOverInteractive) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = isOverInteractive ? 'grab' : 'default';
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragState(null);
    setIsPanning(false);
    setLastPanPoint(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragState(null);
    setIsPanning(false);
    setLastPanPoint(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  // Node management functions
  const handleAddNode = (mousePos: ControlPoint) => {
    // Find the closest curve segment to add node
    let closestSegment = -1;
    let closestDistance = Infinity;
    let closestT = 0;
    
    for (let i = 0; i < path.nodes.length - 1; i++) {
      const currentNode = path.nodes[i];
      const nextNode = path.nodes[i + 1];
      
      const cp1 = currentNode.rightHandle || currentNode.point;
      const cp2 = nextNode.leftHandle || nextNode.point;
      
      // Sample points along the curve to find closest
      for (let t = 0; t <= 1; t += 0.05) {
        const point = calculateBezierPoint(
          currentNode.point, cp1, cp2, nextNode.point, t
        );
        const distance = Math.sqrt(
          (point.x - mousePos.x) ** 2 + (point.y - mousePos.y) ** 2
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSegment = i;
          closestT = t;
        }
      }
    }
    
    if (closestSegment >= 0 && closestDistance < 20 / zoom) {
      // Split the curve at the closest point
      const currentNode = path.nodes[closestSegment];
      const nextNode = path.nodes[closestSegment + 1];
      
      const cp1 = currentNode.rightHandle || currentNode.point;
      const cp2 = nextNode.leftHandle || nextNode.point;
      
      const newPoint = calculateBezierPoint(
        currentNode.point, cp1, cp2, nextNode.point, closestT
      );
      
      // Calculate new handles for smooth transition
      const newLeftHandle = {
        x: newPoint.x - (cp1.x - newPoint.x) * 0.3,
        y: newPoint.y - (cp1.y - newPoint.y) * 0.3,
      };
      
      const newRightHandle = {
        x: newPoint.x + (cp2.x - newPoint.x) * 0.3,
        y: newPoint.y + (cp2.y - newPoint.y) * 0.3,
      };
      
      const newNode: BezierNode = {
        point: newPoint,
        leftHandle: newLeftHandle,
        rightHandle: newRightHandle,
        type: 'smooth',
        selected: false,
      };
      
      setPath(prev => {
        const newNodes = [...prev.nodes];
        newNodes.splice(closestSegment + 1, 0, newNode);
        return { ...prev, nodes: newNodes };
      });
      
      setSelectedNodeIndex(closestSegment + 1);
    }
  };

  const handleDeleteSelectedNode = () => {
    if (selectedNodeIndex !== null && path.nodes.length > 2) {
      setPath(prev => {
        const newNodes = prev.nodes.filter((_, index) => index !== selectedNodeIndex);
        return { ...prev, nodes: newNodes };
      });
      setSelectedNodeIndex(null);
    }
  };

  // Bezier curve calculation helper
  const calculateBezierPoint = (
    p0: ControlPoint, p1: ControlPoint, p2: ControlPoint, p3: ControlPoint, t: number
  ): ControlPoint => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    };
  };

  // Keyboard event handler
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Control') {
      setIsCtrlPressed(true);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDeleteSelectedNode();
    } else if (e.key === 'Escape') {
      setSelectedNodeIndex(null);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Control') {
      setIsCtrlPressed(false);
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodeIndex, path]);

  // Cleanup PNG preview URL on unmount
  useEffect(() => {
    return () => {
      if (pngPreviewUrl) {
        URL.revokeObjectURL(pngPreviewUrl);
      }
    };
  }, [pngPreviewUrl]);

  const handleColorChange = (property: string, value: string) => {
    setCurveProps(prev => ({ ...prev, [property]: value }));
  };

  const resetCurve = () => {
    setPath(createDefaultPath());
    setSelectedNodeIndex(null);
  };

  const createSmoothCurve = () => {
    setPath({
      nodes: [
        {
          point: { x: 150, y: 225 },
          rightHandle: { x: 250, y: 175 },
          type: 'smooth' as const,
          selected: false
        },
        {
          point: { x: 350, y: 275 },
          leftHandle: { x: 250, y: 225 },
          rightHandle: { x: 450, y: 325 },
          type: 'smooth' as const,
          selected: false
        },
        {
          point: { x: 450, y: 225 },
          leftHandle: { x: 400, y: 175 },
          type: 'smooth' as const,
          selected: false
        }
      ],
      closed: false
    });
    setSelectedNodeIndex(null);
  };

  return (
    <div className="bezier-editor">
      <div className="editor-section">
        <h4>Bezier Path Properties</h4>
        
        <div className="editor-controls">
          <div className="control-group">
            <label>Stroke Color</label>
            <input
              type="color"
              value={curveProps.stroke}
              onChange={(e) => handleColorChange('stroke', e.target.value)}
              title="Stroke color"
            />
          </div>
          
          <div className="control-group">
            <label>Stroke Width</label>
            <input
              type="number"
              value={curveProps.strokeWidth}
              min="1"
              onChange={(e) => setCurveProps(prev => ({ ...prev, strokeWidth: parseFloat(e.target.value) || 1 }))}
              title="Stroke width"
            />
          </div>
          
          <div className="control-group">
            <label>Line Cap</label>
            <select
              value={curveProps.lineCap}
              onChange={(e) => setCurveProps(prev => ({ ...prev, lineCap: e.target.value as any }))}
              title="Line cap style"
            >
              <option value="round">Round</option>
              <option value="butt">Butt</option>
              <option value="square">Square</option>
            </select>
          </div>
        </div>

        <div className="editor-controls">
          <div className="control-group">
            <label>Document Size</label>
            <div className="document-size-controls">
              <input
                type="number"
                value={documentWidth}
                min="50"
                step="10"
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value) || 100;
                  setDocumentWidth(newWidth);
                }}
                title="Document width"
              />
              <span>×</span>
              <input
                type="number"
                value={documentHeight}
                min="50"
                step="10"
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value) || 100;
                  setDocumentHeight(newHeight);
                }}
                title="Document height"
              />
              <span>px</span>
            </div>
            <small>Final export size including padding</small>
          </div>
        </div>

        <div className="editor-controls">
          <div className="control-group">
            <label>Quick Presets</label>
            <div className="quick-buttons">
              <button type="button" onClick={resetCurve} title="Reset curve">
                Reset
              </button>
              <button type="button" onClick={createSmoothCurve} title="Smooth S-curve">
                Smooth S-Curve
              </button>
            </div>
          </div>
        </div>

        <div className="editor-controls">
          <div className="control-group">
            <label>PNG Preview</label>
            <div className="quick-buttons">
              <button 
                type="button" 
                onClick={generatePngPreview} 
                disabled={isGeneratingPreview || path.nodes.length === 0}
                title="Generate PNG preview"
              >
                {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowPngPreview(!showPngPreview)} 
                disabled={!pngPreviewUrl}
                title={showPngPreview ? 'Hide preview overlay' : 'Show preview overlay'}
              >
                {showPngPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
            <small>Preview the final PNG output</small>
          </div>
        </div>
      </div>

      <div className="editor-section">
        <h4>Nodes</h4>
        <div className="node-info">
          <p>Path has {path.nodes.length} nodes</p>
          {selectedNodeIndex !== null && (
            <div>
              <p>Selected: Node {selectedNodeIndex + 1}</p>
              <div className="node-controls">
                <button 
                  type="button" 
                  onClick={handleDeleteSelectedNode}
                  disabled={path.nodes.length <= 2}
                  title="Delete selected node"
                >
                  Delete Node
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="node-instructions">
          <strong>Instructions:</strong><br/>
          • Click to select nodes<br/>
          • Double-click on path to add nodes<br/>
          • Drag nodes and handles to reshape<br/>
          • Press Delete to remove selected node
        </div>
      </div>

      <div className="editor-section">
        <h4>Preview</h4>
        
        {/* Boundary Controls */}
        <div className="boundary-controls">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showBoundary}
                onChange={(e) => setShowBoundary(e.target.checked)}
              />
              Show Export Boundary
            </label>
          </div>
          
          {showBoundary && (
            <div className="boundary-settings">
              <div className="control-group">
                <label>Boundary Padding: {boundaryPadding}px</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={boundaryPadding}
                  onChange={(e) => setBoundaryPadding(parseInt(e.target.value))}
                  title="Adjust boundary padding"
                />
              </div>
              
              {boundaryBounds && (
                <div className="boundary-info">
                  <small>
                    Export size: {Math.round((boundaryBounds.maxX - boundaryBounds.minX) + (2 * boundaryPadding))} × {Math.round((boundaryBounds.maxY - boundaryBounds.minY) + (2 * boundaryPadding))}px<br/>
                    Content bounds: ({Math.round(boundaryBounds.minX)}, {Math.round(boundaryBounds.minY)}) to ({Math.round(boundaryBounds.maxX)}, {Math.round(boundaryBounds.maxY)})
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="zoom-controls">
          <button 
            type="button" 
            onClick={() => setZoom(prev => Math.max(0.1, prev * 0.8))}
            title="Zoom out"
          >
            Zoom Out
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button 
            type="button" 
            onClick={() => setZoom(prev => Math.min(5, prev * 1.25))}
            title="Zoom in"
          >
            Zoom In
          </button>
          <button 
            type="button" 
            onClick={() => {
              setZoom(1);
              setPanOffset({x: 0, y: 0});
            }}
            title="Reset zoom and pan"
          >
            Reset View
          </button>
        </div>
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={600}
            height={450}
            className="canvas-preview"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        <div className="editor-legend">
          <strong>Legend:</strong> Blue = Start/End points, Green = Control points<br/>
          {showBoundary && <span><strong>Red dashed box</strong> = Export boundary with corner handles<br/></span>}
          <em>Mouse wheel to zoom, middle-click and drag to pan</em>
        </div>
      </div>
    </div>
  );
};

export default BezierEditor;
