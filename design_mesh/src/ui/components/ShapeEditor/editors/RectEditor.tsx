import React, { useState, useEffect, useRef } from 'react';
import { SymbolType } from '../../res/CanvasSection';

interface RectEditorProps {
  shape: SymbolType;
  onChange: (shape: SymbolType) => void;
}

const RectEditor: React.FC<RectEditorProps> = ({ shape, onChange }) => {
  const [rectProps, setRectProps] = useState({
    x: shape.x || 50,
    y: shape.y || 50,
    width: shape.width || 100,
    height: shape.height || 100,
    fill: '#90caf9',
    stroke: '#333',
    strokeWidth: 2,
    cornerRadius: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawRect();
  }, [rectProps]);

  const drawRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw rectangle
    ctx.fillStyle = rectProps.fill;
    ctx.strokeStyle = rectProps.stroke;
    ctx.lineWidth = rectProps.strokeWidth;

    if (rectProps.cornerRadius > 0) {
      // Draw rounded rectangle
      ctx.beginPath();
      ctx.roundRect(rectProps.x, rectProps.y, rectProps.width, rectProps.height, rectProps.cornerRadius);
      ctx.fill();
      ctx.stroke();
    } else {
      // Draw regular rectangle
      ctx.fillRect(rectProps.x, rectProps.y, rectProps.width, rectProps.height);
      ctx.strokeRect(rectProps.x, rectProps.y, rectProps.width, rectProps.height);
    }
  };

  const handleRectChange = (newProps: any) => {
    setRectProps(prev => ({ ...prev, ...newProps }));
    
    const updatedShape: SymbolType = {
      ...shape,
      x: newProps.x !== undefined ? newProps.x : rectProps.x,
      y: newProps.y !== undefined ? newProps.y : rectProps.y,
      width: newProps.width !== undefined ? newProps.width : rectProps.width,
      height: newProps.height !== undefined ? newProps.height : rectProps.height,
    };
    
    onChange(updatedShape);
  };

  const handleInputChange = (property: string, value: number) => {
    const newProps = { [property]: value };
    setRectProps(prev => ({ ...prev, ...newProps }));
    
    // Always notify parent of changes for any numeric property
    const updatedShape = {
      ...shape,
      [property]: value,
    } as any; // Use 'as any' to allow additional properties like strokeWidth, cornerRadius
    onChange(updatedShape);
  };

  const handleColorChange = (property: string, value: string) => {
    setRectProps(prev => ({ ...prev, [property]: value }));
    
    // Notify parent of color changes
    const updatedShape = {
      ...shape,
      [property]: value,
    } as any; // Use 'as any' to allow additional properties like fill, stroke
    onChange(updatedShape);
  };

  return (
    <div className="rect-editor">
      <div className="editor-section">
        <h4>Rectangle Properties</h4>
        
        <div className="editor-controls">
          <div className="control-group">
            <label>X Position</label>
            <input
              type="number"
              value={rectProps.x}
              onChange={(e) => handleInputChange('x', parseFloat(e.target.value) || 0)}
              title="X position"
            />
          </div>
          
          <div className="control-group">
            <label>Y Position</label>
            <input
              type="number"
              value={rectProps.y}
              onChange={(e) => handleInputChange('y', parseFloat(e.target.value) || 0)}
              title="Y position"
            />
          </div>
          
          <div className="control-group">
            <label>Width</label>
            <input
              type="number"
              value={rectProps.width}
              min="5"
              onChange={(e) => handleInputChange('width', parseFloat(e.target.value) || 5)}
              title="Width"
            />
          </div>
          
          <div className="control-group">
            <label>Height</label>
            <input
              type="number"
              value={rectProps.height}
              min="5"
              onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || 5)}
              title="Height"
            />
          </div>
          
          <div className="control-group">
            <label>Corner Radius</label>
            <input
              type="number"
              value={rectProps.cornerRadius}
              min="0"
              onChange={(e) => handleInputChange('cornerRadius', parseFloat(e.target.value) || 0)}
              title="Corner radius"
            />
          </div>
        </div>

        <div className="editor-controls">
          <div className="control-group">
            <label>Fill Color</label>
            <input
              type="color"
              value={rectProps.fill}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              title="Fill color"
            />
          </div>
          
          <div className="control-group">
            <label>Stroke Color</label>
            <input
              type="color"
              value={rectProps.stroke}
              onChange={(e) => handleColorChange('stroke', e.target.value)}
              title="Stroke color"
            />
          </div>
          
          <div className="control-group">
            <label>Stroke Width</label>
            <input
              type="number"
              value={rectProps.strokeWidth}
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
            className="canvas-preview"
          />
        </div>
      </div>
    </div>
  );
};

export default RectEditor;
