import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';
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
    tension: 0,
    lineCap: 'round' as const,
  });

  const [selectedPoint, setSelectedPoint] = useState<keyof BezierCurve | null>(null);
  const stageRef = useRef<any>(null);

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

  const generateCurvePoints = (curve: BezierCurve, steps: number = 50): number[] => {
    const points: number[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.pow(1 - t, 3) * curve.start.x +
                3 * Math.pow(1 - t, 2) * t * curve.cp1.x +
                3 * (1 - t) * Math.pow(t, 2) * curve.cp2.x +
                Math.pow(t, 3) * curve.end.x;
      
      const y = Math.pow(1 - t, 3) * curve.start.y +
                3 * Math.pow(1 - t, 2) * t * curve.cp1.y +
                3 * (1 - t) * Math.pow(t, 2) * curve.cp2.y +
                Math.pow(t, 3) * curve.end.y;
      
      points.push(x, y);
    }
    
    return points;
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

  const curvePoints = generateCurvePoints(curve);

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
        <h4>Visual Editor</h4>
        <div className="canvas-container">
          <Stage
            width={400}
            height={300}
            ref={stageRef}
            onClick={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedPoint(null);
              }
            }}
          >
            <Layer>
              {/* Bezier curve */}
              <Line
                points={curvePoints}
                stroke={curveProps.stroke}
                strokeWidth={curveProps.strokeWidth}
                lineCap={curveProps.lineCap}
                tension={0}
              />
              
              {/* Control lines */}
              <Line
                points={[curve.start.x, curve.start.y, curve.cp1.x, curve.cp1.y]}
                stroke="#ccc"
                strokeWidth={1}
                dash={[5, 5]}
              />
              <Line
                points={[curve.cp2.x, curve.cp2.y, curve.end.x, curve.end.y]}
                stroke="#ccc"
                strokeWidth={1}
                dash={[5, 5]}
              />
              
              {/* Control points */}
              {pointTypes.map((pointType) => {
                const point = curve[pointType];
                const isControlPoint = pointType === 'cp1' || pointType === 'cp2';
                
                return (
                  <Circle
                    key={pointType}
                    x={point.x}
                    y={point.y}
                    radius={isControlPoint ? 5 : 7}
                    fill={selectedPoint === pointType ? '#ff4444' : 
                          isControlPoint ? '#44ff44' : '#4444ff'}
                    stroke="#fff"
                    strokeWidth={2}
                    draggable
                    onDragMove={(e) => {
                      handlePointChange(pointType, {
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedPoint(pointType);
                    }}
                    onMouseEnter={(e) => {
                      e.target.getStage()!.container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      e.target.getStage()!.container().style.cursor = 'default';
                    }}
                  />
                );
              })}
            </Layer>
          </Stage>
        </div>
        <div className="editor-legend">
          <strong>Legend:</strong> Blue = Start/End points, Green = Control points, Red = Selected
        </div>
      </div>
    </div>
  );
};

export default BezierEditor;
