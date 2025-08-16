import React from "react";
import { Button } from "@swc-react/button";
import Tippy from '@tippyjs/react';

interface ShapeControlsProps {
  onInsertShape: (type: "rect" | "circle" | "polygon" | "curve") => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ShapeControls: React.FC<ShapeControlsProps> = ({ onInsertShape, onUpload }) => {
  return (
    <div className="top-controls">
      <div className="shape-row">
        <div onClick={() => onInsertShape("rect")}> 
          <svg width={40} height={40}>
            <rect x={5} y={10} width={30} height={20} fill="#90caf9" stroke="#333" strokeWidth={2} />
          </svg> 
        </div>
        <div onClick={() => onInsertShape("circle")}> 
          <svg width={40} height={40}>
            <circle cx={20} cy={20} r={12} fill="#a5d6a7" stroke="#333" strokeWidth={2} />
          </svg> 
        </div>
        <div onClick={() => onInsertShape("polygon")}> 
          <svg width={40} height={40}>
            <polygon points="20,5 35,35 5,35" fill="#ffcc80" stroke="#333" strokeWidth={2} />
          </svg> 
        </div>
        <div onClick={() => onInsertShape("curve")}> 
          <svg width={40} height={40}>
            <path d="M 10 30 Q 20,5 30,30" fill="transparent" stroke="#ef9a9a" strokeWidth={2} />
          </svg> 
        </div>
        <div className="shape-upload">
          <label>
            <Button size="m">Upload</Button>
            <input 
              type="file" 
              accept=".svg,.jpg,.jpeg,.png,.gif,image/svg+xml,image/jpeg,image/png,image/gif" 
              className="file-input-hidden" 
              onChange={onUpload} 
            />
          </label>
          <Tippy content="Supports SVG/JPEG/JPG/PNG">
            <div className="ml-5 info-icon">
              i
            </div>
          </Tippy>
        </div>
      </div>
    </div>
  );
};

export default ShapeControls;
