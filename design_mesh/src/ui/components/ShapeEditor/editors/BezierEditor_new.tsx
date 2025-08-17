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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawBezier();
  }, [curve, curveProps]);

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
  };

  // Helper function to get mouse position relative to canvas
  const getMousePos = (canvas: HTMLCanvasElement, e: React.MouseEvent): ControlPoint => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Helper function to check if mouse is near a point
  const isNearPoint = (mouse: ControlPoint, point: ControlPoint, threshold = 10): boolean => {
    const dx = mouse.x - point.x;
    const dy = mouse.y - point.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragPoint(null);
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
          <strong>Legend:</strong> Blue = Start/End points, Green = Control points
        </div>
      </div>
    </div>
  );
};

export default BezierEditor;
