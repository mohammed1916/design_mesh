import React, { useState, useEffect, useRef } from 'react';
import { SymbolType } from '../../res/CanvasSection';

interface CircleEditorProps {
  shape: SymbolType;
  onChange: (shape: SymbolType) => void;
}

const CircleEditor: React.FC<CircleEditorProps> = ({ shape, onChange }) => {
  const [circleProps, setCircleProps] = useState({
    x: (shape.x || 50) + (shape.width || 100) / 2,
    y: (shape.y || 50) + (shape.height || 100) / 2,
    radius: Math.min(shape.width || 100, shape.height || 100) / 2,
    fill: '#a5d6a7',
    stroke: '#333',
    strokeWidth: 2,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawCircle();
  }, [circleProps]);

  const drawCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw circle
    ctx.fillStyle = circleProps.fill;
    ctx.strokeStyle = circleProps.stroke;
    ctx.lineWidth = circleProps.strokeWidth;

    ctx.beginPath();
    ctx.arc(circleProps.x, circleProps.y, circleProps.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  };

  const handleCircleChange = (newProps: any) => {
    setCircleProps(prev => ({ ...prev, ...newProps }));
    
    const radius = newProps.radius || circleProps.radius;
    const x = (newProps.x || circleProps.x) - radius;
    const y = (newProps.y || circleProps.y) - radius;
    
    const updatedShape: SymbolType = {
      ...shape,
      x: x,
      y: y,
      width: radius * 2,
      height: radius * 2,
    };
    
    onChange(updatedShape);
  };

  const handleInputChange = (property: string, value: number) => {
    const newProps = { [property]: value };
    setCircleProps(prev => ({ ...prev, ...newProps }));
    
    if (['x', 'y', 'radius'].includes(property)) {
      handleCircleChange(newProps);
    } else {
      // For other numeric properties like strokeWidth, notify parent directly
      const updatedShape = {
        ...shape,
        [property]: value,
      } as any; // Use 'as any' to allow additional properties
      onChange(updatedShape);
    }
  };

  const handleColorChange = (property: string, value: string) => {
    setCircleProps(prev => ({ ...prev, [property]: value }));
    
    // Notify parent of color changes
    const updatedShape = {
      ...shape,
      [property]: value,
    } as any; // Use 'as any' to allow additional properties like fill, stroke
    console.log('Circle color changed:', property, value, updatedShape); // Temporary debug log
    onChange(updatedShape);
  };

  return (
    <div className="circle-editor">
      <div className="editor-section">
        <h4>Circle Properties</h4>
        
        <div className="editor-controls">
          <div className="control-group">
            <label>Center X</label>
            <input
              type="number"
              value={circleProps.x}
              onChange={(e) => handleInputChange('x', parseFloat(e.target.value) || 0)}
              title="Center X position"
            />
          </div>
          
          <div className="control-group">
            <label>Center Y</label>
            <input
              type="number"
              value={circleProps.y}
              onChange={(e) => handleInputChange('y', parseFloat(e.target.value) || 0)}
              title="Center Y position"
            />
          </div>
          
          <div className="control-group">
            <label>Radius</label>
            <input
              type="number"
              value={circleProps.radius}
              min="5"
              onChange={(e) => handleInputChange('radius', parseFloat(e.target.value) || 5)}
              title="Circle radius"
            />
          </div>
        </div>

        <div className="editor-controls">
          <div className="control-group">
            <label>Fill Color</label>
            <input
              type="color"
              value={circleProps.fill}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              title="Fill color"
            />
          </div>
          
          <div className="control-group">
            <label>Stroke Color</label>
            <input
              type="color"
              value={circleProps.stroke}
              onChange={(e) => handleColorChange('stroke', e.target.value)}
              title="Stroke color"
            />
          </div>
          
          <div className="control-group">
            <label>Stroke Width</label>
            <input
              type="number"
              value={circleProps.strokeWidth}
              min="0"
              onChange={(e) => handleInputChange('strokeWidth', parseFloat(e.target.value) || 0)}
              title="Stroke width"
            />
          </div>
        </div>
      </div>

      <div className="editor-section">
        <h4>Preview</h4>
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="editor-preview"
          />
        </div>
      </div>
    </div>
  );
};

export default CircleEditor;
