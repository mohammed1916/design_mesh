import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Circle, Transformer } from 'react-konva';
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
    { x: 50, y: 20 },
    { x: 80, y: 70 },
    { x: 20, y: 70 },
  ]);
  
  const [polygonProps, setPolygonProps] = useState({
    fill: '#ffcc80',
    stroke: '#333',
    strokeWidth: 2,
    closed: true,
  });

  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const stageRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);

  useEffect(() => {
    // Convert points to flat array for Konva
    const flatPoints: number[] = [];
    points.forEach(p => {
      flatPoints.push(p.x, p.y);
    });
    
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
      setSelectedPointIndex(null);
    }
  };

  const handleInputChange = (index: number, axis: 'x' | 'y', value: number) => {
    const newPoint = { ...points[index], [axis]: value };
    handlePointChange(index, newPoint);
  };

  const handleColorChange = (property: string, value: string) => {
    setPolygonProps(prev => ({ ...prev, [property]: value }));
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

  const flatPoints: number[] = [];
  points.forEach(p => {
    flatPoints.push(p.x, p.y);
  });

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
              onChange={(e) => setPolygonProps(prev => ({ ...prev, strokeWidth: parseFloat(e.target.value) || 0 }))}
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
        <h4>Visual Editor</h4>
        <div className="canvas-container">
          <Stage
            width={400}
            height={300}
            ref={stageRef}
            onClick={(e) => {
              // Deselect point when clicking on empty space
              if (e.target === e.target.getStage()) {
                setSelectedPointIndex(null);
              }
            }}
          >
            <Layer>
              {/* Polygon */}
              <Line
                ref={polygonRef}
                points={flatPoints}
                fill={polygonProps.fill}
                stroke={polygonProps.stroke}
                strokeWidth={polygonProps.strokeWidth}
                closed={polygonProps.closed}
              />
              
              {/* Control points */}
              {points.map((point, index) => (
                <Circle
                  key={index}
                  x={point.x}
                  y={point.y}
                  radius={6}
                  fill={selectedPointIndex === index ? '#ff4444' : '#4444ff'}
                  stroke="#fff"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => {
                    handlePointChange(index, {
                      x: e.target.x(),
                      y: e.target.y(),
                    });
                  }}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setSelectedPointIndex(index);
                  }}
                  onMouseEnter={(e) => {
                    e.target.getStage()!.container().style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage()!.container().style.cursor = 'default';
                  }}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default PolygonEditor;
