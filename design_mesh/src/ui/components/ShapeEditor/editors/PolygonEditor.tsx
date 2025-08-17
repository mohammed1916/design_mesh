import React, { useState, useEffect, useRef } from 'react';
import { SymbolType } from '../../res/CanvasSection';

interface Point {
  x: number;
  y: number;
}

interface PolygonEditorProps {
  shape: SymbolType;
  onChange: (shape: SymbolType) => void;
}

const PolygonEditor: React.FC<PolygonEditorProps> = ({ shape, onChange }) => {
  const [points, setPoints] = useState<Point[]>([
    { x: 200, y: 80 },
    { x: 320, y: 220 },
    { x: 80, y: 220 },
  ]);
  
  const [polygonProps, setPolygonProps] = useState({
    fill: '#ffcc80',
    stroke: '#333',
    strokeWidth: 2,
    closed: true,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawPolygon();
  }, [points, polygonProps]);

  useEffect(() => {
    // Calculate bounding box
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));
    
    const updatedShape: SymbolType = {
      ...shape,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
    
    onChange(updatedShape);
  }, [points]);

  const drawPolygon = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length === 0) return;

    // Draw polygon
    ctx.fillStyle = polygonProps.fill;
    ctx.strokeStyle = polygonProps.stroke;
    ctx.lineWidth = polygonProps.strokeWidth;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (polygonProps.closed) {
      ctx.closePath();
    }
    
    ctx.fill();
    ctx.stroke();

    // Draw control points
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#4444ff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const handlePointChange = (index: number, newPoint: Point) => {
    const newPoints = [...points];
    newPoints[index] = newPoint;
    setPoints(newPoints);
  };

  const addPoint = () => {
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
    const newPoints = [...points, { x: centerX, y: centerY }];
    setPoints(newPoints);
  };

  const removePoint = (index: number) => {
    if (points.length > 3) {
      const newPoints = points.filter((_, i) => i !== index);
      setPoints(newPoints);
    }
  };

  const handleInputChange = (index: number, axis: 'x' | 'y', value: number) => {
    const newPoint = { ...points[index], [axis]: value };
    handlePointChange(index, newPoint);
  };

  const handleColorChange = (property: string, value: string) => {
    setPolygonProps(prev => ({ ...prev, [property]: value }));
    
    // Notify parent of color changes by creating an extended shape object
    const updatedShape = {
      ...shape,
      [property]: value,
    } as any; // Use 'as any' to allow additional properties
    onChange(updatedShape);
  };

  const handleStrokeWidthChange = (value: number) => {
    setPolygonProps(prev => ({ ...prev, strokeWidth: value }));
    
    // Notify parent of stroke width changes
    const updatedShape = {
      ...shape,
      strokeWidth: value,
    } as any; // Use 'as any' to allow additional properties
    onChange(updatedShape);
  };

  const createRegularPolygon = (sides: number) => {
    const centerX = 200;
    const centerY = 150;
    const radius = 60;
    
    const newPoints: Point[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; // Start from top
      newPoints.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    
    setPoints(newPoints);
  };

  return (
    <div className="polygon-editor">
      <div className="editor-section">
        <h4>Polygon Properties</h4>
        
        <div className="editor-controls">
          <div className="control-group">
            <label>Fill Color</label>
            <input
              type="color"
              value={polygonProps.fill}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              title="Fill color"
            />
          </div>
          
          <div className="control-group">
            <label>Stroke Color</label>
            <input
              type="color"
              value={polygonProps.stroke}
              onChange={(e) => handleColorChange('stroke', e.target.value)}
              title="Stroke color"
            />
          </div>
          
          <div className="control-group">
            <label>Stroke Width</label>
            <input
              type="number"
              value={polygonProps.strokeWidth}
              min="0"
              onChange={(e) => handleStrokeWidthChange(parseFloat(e.target.value) || 0)}
              title="Stroke width"
            />
          </div>
          
          <div className="control-group">
            <label>Closed</label>
            <input
              type="checkbox"
              checked={polygonProps.closed}
              onChange={(e) => setPolygonProps(prev => ({ ...prev, closed: e.target.checked }))}
              title="Close polygon"
            />
          </div>
        </div>

        <div className="editor-controls">
          <div className="control-group">
            <label>Quick Shapes</label>
            <div className="quick-buttons">
              <button type="button" onClick={() => createRegularPolygon(3)} title="Triangle">
                Triangle
              </button>
              <button type="button" onClick={() => createRegularPolygon(4)} title="Square">
                Square
              </button>
              <button type="button" onClick={() => createRegularPolygon(5)} title="Pentagon">
                Pentagon
              </button>
              <button type="button" onClick={() => createRegularPolygon(6)} title="Hexagon">
                Hexagon
              </button>
              <button type="button" onClick={() => createRegularPolygon(8)} title="Octagon">
                Octagon
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="editor-section">
        <h4>Point Controls</h4>
        <div className="point-controls">
          {points.map((point, index) => (
            <div key={index} className="point-item">
              <span>Point {index + 1}:</span>
              <label>
                X:
                <input
                  type="number"
                  value={Math.round(point.x)}
                  onChange={(e) => handleInputChange(index, 'x', parseFloat(e.target.value) || 0)}
                  title={`Point ${index + 1} X coordinate`}
                />
              </label>
              <label>
                Y:
                <input
                  type="number"
                  value={Math.round(point.y)}
                  onChange={(e) => handleInputChange(index, 'y', parseFloat(e.target.value) || 0)}
                  title={`Point ${index + 1} Y coordinate`}
                />
              </label>
              {points.length > 3 && (
                <button 
                  type="button" 
                  onClick={() => removePoint(index)}
                  title={`Remove point ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            className="add-point-btn" 
            onClick={addPoint}
            title="Add new point"
          >
            Add Point
          </button>
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
      </div>
    </div>
  );
};

export default PolygonEditor;
