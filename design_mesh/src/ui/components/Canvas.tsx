// src/ui/components/Canvas.tsx
import React, { useRef, useState } from "react";

// Types for symbols
export type SymbolType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rect" | "image";
  src?: string; // for images
  favorite?: boolean;
};

interface CanvasProps {
  symbols: SymbolType[];
  setSymbols: React.Dispatch<React.SetStateAction<SymbolType[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onAddFavorite: (id: string) => void;
  selectMode: boolean;
}

const Canvas: React.FC<CanvasProps> = ({
  symbols,
  setSymbols,
  selectedId,
  setSelectedId,
  onAddFavorite,
  selectMode,
}) => {
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  // Handle mouse down for selection and drag
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (!selectMode) return;
    setSelectedId(id);
    const symbol = symbols.find((s) => s.id === id);
    if (symbol) {
      dragOffset.current = {
        x: e.clientX - symbol.x,
        y: e.clientY - symbol.y,
      };
    }
  };

  // Handle mouse move for drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectMode || !selectedId || !dragOffset.current) return;
    setSymbols((prev) =>
      prev.map((s) =>
        s.id === selectedId
          ? { ...s, x: e.clientX - dragOffset.current!.x, y: e.clientY - dragOffset.current!.y }
          : s
      )
    );
  };

  // Handle mouse up to stop drag
  const handleMouseUp = () => {
    dragOffset.current = null;
  };

  // Render symbols as SVG
  return (
    <svg
      width={600}
      height={400}
      style={{ border: "1px solid #ccc", background: "#fff" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {symbols.map((symbol) =>
        symbol.type === "rect" ? (
          <rect
            key={symbol.id}
            x={symbol.x}
            y={symbol.y}
            width={symbol.width}
            height={symbol.height}
            fill={symbol.favorite ? "gold" : "#90caf9"}
            stroke={selectedId === symbol.id ? "#1976d2" : "#333"}
            strokeWidth={selectedId === symbol.id ? 3 : 1}
            onMouseDown={(e) => handleMouseDown(e, symbol.id)}
            style={{ cursor: selectMode ? "move" : "pointer" }}
            onDoubleClick={() => onAddFavorite(symbol.id)}
          />
        ) : symbol.type === "image" && symbol.src ? (
          <image
            key={symbol.id}
            x={symbol.x}
            y={symbol.y}
            width={symbol.width}
            height={symbol.height}
            href={symbol.src}
            style={{ cursor: selectMode ? "move" : "pointer" }}
            onMouseDown={(e) => handleMouseDown(e, symbol.id)}
            onDoubleClick={() => onAddFavorite(symbol.id)}
          />
        ) : null
      )}
    </svg>
  );
};

export default Canvas; 