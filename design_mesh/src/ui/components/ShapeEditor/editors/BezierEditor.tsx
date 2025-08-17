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
  const [curve, setCurve] = useState<BezierCurve>({
    start: { x: 50, y: 150 },
    cp1: { x: 100, y: 50 },
    cp2: { x: 200, y: 250 },
    end: { x: 250, y: 150 },
  });

  const [curveProps, setCurveProps] = useState({
    stroke: '#ef9a9a',
    strokeWidth: 3,
    lineCap: 'round' as const,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawBezier();
  }, [curve, curveProps]);

  useEffect(() => {
    // Calculate curve path and update shape bounds
    const allPoints = [curve.start, curve.cp1, curve.cp2, curve.end];
    const minX = Math.min(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const updatedShape: SymbolType = {
      ...shape,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    onChange(updatedShape);
  }, [curve]);

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
    
    // Notify parent of color changes
    const updatedShape = {
      ...shape,
      [property]: value,
    } as any; // Use 'as any' to allow additional properties
    onChange(updatedShape);
  };

  const handleStrokeWidthChange = (value: number) => {
    setCurveProps(prev => ({ ...prev, strokeWidth: value }));
    
    // Notify parent of stroke width changes
    const updatedShape = {
      ...shape,
      strokeWidth: value,
    } as any; // Use 'as any' to allow additional properties
    onChange(updatedShape);
  };

  const resetCurve = () => {
    setCurve({
      start: { x: 50, y: 150 },
      cp1: { x: 100, y: 50 },
      cp2: { x: 200, y: 250 },
      end: { x: 250, y: 150 },
    });
  };

  const createSmoothCurve = () => {
    setCurve({
      start: { x: 50, y: 150 },
      cp1: { x: 120, y: 120 },
      cp2: { x: 180, y: 180 },
      end: { x: 250, y: 150 },
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
              onChange={(e) => handleStrokeWidthChange(parseFloat(e.target.value) || 1)}
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
            width={400}
            height={300}
            className="canvas-preview"
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
