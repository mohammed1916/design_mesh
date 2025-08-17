import React, { useState, useEffect, useRef } from 'react';
import { SymbolType } from '../../res/CanvasSection';

interface ControlPoint {
  x: number;
  y: number;
}

interface BezierCurve {
  start: ControlPoint;
  cp1: ControlPoint;
  cp2: ControlPoint;
  end: ControlPoint;
}

interface BezierEditorProps {
  shape: SymbolType;
  onChange: (shape: SymbolType) => void;
}

const BezierEditor: React.FC<BezierEditorProps> = ({ shape, onChange }) => {
  // Initialize curve data from existing shape or use defaults
  const initialCurve = (shape as any).curveData || {
    start: { x: 100, y: 250 },
    cp1: { x: 200, y: 100 },
    cp2: { x: 400, y: 350 },
    end: { x: 500, y: 250 },
  };

  const [curve, setCurve] = useState<BezierCurve>(initialCurve);

  // Initialize curve properties from existing shape or use defaults
  const initialProps = {
    stroke: (shape as any).stroke || '#ef9a9a',
    strokeWidth: (shape as any).strokeWidth || 3,
    lineCap: (shape as any).lineCap || 'round' as const,
  };

  const [curveProps, setCurveProps] = useState(initialProps);

  // Add drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState<keyof BezierCurve | null>(null);
  
  // Add zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawBezier();
  }, [curve, curveProps, zoom, panOffset]);

  useEffect(() => {
    // Calculate curve path and update shape bounds - but keep original curve coordinates
    const allPoints = [curve.start, curve.cp1, curve.cp2, curve.end];
    const minX = Math.min(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const maxY = Math.max(...allPoints.map(p => p.y));

    // Add some padding to ensure the full curve is visible
    const padding = Math.max(curveProps.strokeWidth * 2, 10);

    const updatedShape: SymbolType = {
      ...shape,
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2),
      // Store curve data and styling as extended properties (preserve original coordinates)
      ...(shape as any),
      curveData: curve,
      stroke: curveProps.stroke,
      strokeWidth: curveProps.strokeWidth,
      lineCap: curveProps.lineCap
    };

    onChange(updatedShape);
  }, [curve, curveProps]);

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

    // Draw bezier curve
    ctx.strokeStyle = curveProps.stroke;
    ctx.lineWidth = curveProps.strokeWidth;
    ctx.lineCap = curveProps.lineCap;

    ctx.beginPath();
    ctx.moveTo(curve.start.x, curve.start.y);
    ctx.bezierCurveTo(
      curve.cp1.x, curve.cp1.y,
      curve.cp2.x, curve.cp2.y,
      curve.end.x, curve.end.y
    );
    ctx.stroke();

    // Draw control lines
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(curve.start.x, curve.start.y);
    ctx.lineTo(curve.cp1.x, curve.cp1.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(curve.cp2.x, curve.cp2.y);
    ctx.lineTo(curve.end.x, curve.end.y);
    ctx.stroke();
    
    ctx.setLineDash([]);

    // Draw control points
    const points = [
      { point: curve.start, color: '#4444ff', radius: 6 },
      { point: curve.cp1, color: '#44ff44', radius: 5 },
      { point: curve.cp2, color: '#44ff44', radius: 5 },
      { point: curve.end, color: '#4444ff', radius: 6 },
    ];

    points.forEach(({ point, color, radius }) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Restore context
    ctx.restore();
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
  const handleWheel = (e: React.WheelEvent) => {
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

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for middle button pan
    if (e.button === 1) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Check for regular mouse interactions (left button)
    if (e.button !== 0) return;

    const mousePos = getMousePos(canvas, e);
    
    // Check which point is being clicked
    const pointKeys: (keyof BezierCurve)[] = ['start', 'cp1', 'cp2', 'end'];
    
    for (const pointKey of pointKeys) {
      if (isNearPoint(mousePos, curve[pointKey])) {
        setIsDragging(true);
        setDragPoint(pointKey);
        canvas.style.cursor = 'grabbing';
        break;
      }
    }
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

    if (isDragging && dragPoint) {
      // Update the dragged point position
      setCurve(prev => ({
        ...prev,
        [dragPoint]: mousePos,
      }));
    } else {
      // Change cursor when hovering over points
      const pointKeys: (keyof BezierCurve)[] = ['start', 'cp1', 'cp2', 'end'];
      let isOverPoint = false;
      
      for (const pointKey of pointKeys) {
        if (isNearPoint(mousePos, curve[pointKey])) {
          isOverPoint = true;
          break;
        }
      }
      
      canvas.style.cursor = isOverPoint ? 'grab' : 'default';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragPoint(null);
    setIsPanning(false);
    setLastPanPoint(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragPoint(null);
    setIsPanning(false);
    setLastPanPoint(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handlePointChange = (pointType: keyof BezierCurve, newPoint: ControlPoint) => {
    setCurve(prev => ({
      ...prev,
      [pointType]: newPoint,
    }));
  };

  const handleInputChange = (pointType: keyof BezierCurve, axis: 'x' | 'y', value: number) => {
    const newPoint = { ...curve[pointType], [axis]: value };
    handlePointChange(pointType, newPoint);
  };

  const handleColorChange = (property: string, value: string) => {
    setCurveProps(prev => ({ ...prev, [property]: value }));
  };

  const resetCurve = () => {
    setCurve({
      start: { x: 100, y: 250 },
      cp1: { x: 200, y: 100 },
      cp2: { x: 400, y: 350 },
      end: { x: 500, y: 250 },
    });
  };

  const createSmoothCurve = () => {
    setCurve({
      start: { x: 100, y: 225 },
      cp1: { x: 250, y: 175 },
      cp2: { x: 350, y: 275 },
      end: { x: 500, y: 225 },
    });
  };

  const pointTypes: Array<keyof BezierCurve> = ['start', 'cp1', 'cp2', 'end'];
  const pointLabels = {
    start: 'Start',
    cp1: 'Control 1',
    cp2: 'Control 2',
    end: 'End'
  };

  return (
    <div className="bezier-editor">
      <div className="editor-section">
        <h4>Bezier Curve Properties</h4>
        
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
      </div>

      <div className="editor-section">
        <h4>Control Points</h4>
        <div className="point-controls">
          {pointTypes.map((pointType) => (
            <div key={pointType} className="point-item">
              <span>{pointLabels[pointType]}:</span>
              <label>
                X:
                <input
                  type="number"
                  value={Math.round(curve[pointType].x)}
                  onChange={(e) => handleInputChange(pointType, 'x', parseFloat(e.target.value) || 0)}
                  title={`${pointLabels[pointType]} X coordinate`}
                />
              </label>
              <label>
                Y:
                <input
                  type="number"
                  value={Math.round(curve[pointType].y)}
                  onChange={(e) => handleInputChange(pointType, 'y', parseFloat(e.target.value) || 0)}
                  title={`${pointLabels[pointType]} Y coordinate`}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <h4>Preview</h4>
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
            onWheel={handleWheel}
          />
        </div>
        <div className="editor-legend">
          <strong>Legend:</strong> Blue = Start/End points, Green = Control points<br/>
          <em>Mouse wheel to zoom, middle-click and drag to pan</em>
        </div>
      </div>
    </div>
  );
};

export default BezierEditor;
