import React, { useState, useEffect } from 'react';
import { SymbolType } from '../res/CanvasSection';
import { RectEditor, CircleEditor, PolygonEditor, BezierEditor } from './editors';
import './ShapeEditor.css';

interface ShapeEditorProps {
  shape: SymbolType;
  onShapeUpdate: (updatedShape: SymbolType) => void;
  onClose: () => void;
  isVisible: boolean;
}

const ShapeEditor: React.FC<ShapeEditorProps> = ({
  shape,
  onShapeUpdate,
  onClose,
  isVisible
}) => {
  const [currentShape, setCurrentShape] = useState<SymbolType>(shape);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setCurrentShape(shape);
    setHasUnsavedChanges(false);
  }, [shape]);

  const handleShapeChange = (updatedShape: SymbolType) => {
    // Ensure we preserve all properties, including extended ones
    setCurrentShape(prev => ({ ...prev, ...updatedShape }));
    setHasUnsavedChanges(true);
    console.log('Shape changed:', updatedShape); // Temporary debug log
  };

  const handleSave = () => {
    onShapeUpdate(currentShape);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    setCurrentShape(shape);
    setHasUnsavedChanges(false);
    onClose();
  };

  const renderEditor = () => {
    switch (currentShape.type) {
      case 'rect':
        return (
          <RectEditor
            shape={currentShape}
            onChange={handleShapeChange}
          />
        );
      case 'circle':
        return (
          <CircleEditor
            shape={currentShape}
            onChange={handleShapeChange}
          />
        );
      case 'polygon':
        return (
          <PolygonEditor
            shape={currentShape}
            onChange={handleShapeChange}
          />
        );
      case 'curve':
        return (
          <BezierEditor
            shape={currentShape}
            onChange={handleShapeChange}
          />
        );
      default:
        return <div>Unsupported shape type: {currentShape.type}</div>;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="shape-editor-overlay">
      <div className="shape-editor-container">
        <div className="shape-editor-header">
          <h3>Edit {currentShape.type.charAt(0).toUpperCase() + currentShape.type.slice(1)}</h3>
          <button className="close-btn" onClick={handleCancel} title="Close">
            ×
          </button>
        </div>
        
        <div className="shape-editor-content">
          {renderEditor()}
        </div>
        
        <div className="shape-editor-footer">
          <button 
            className="cancel-btn" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShapeEditor;
