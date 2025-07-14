import React, { useRef } from "react";

export type SymbolType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rect" | "circle" | "polygon" | "image";
  src?: string;
  favorite?: boolean;
};

interface CanvasProps {
  symbols: SymbolType[];
  setSymbols: React.Dispatch<React.SetStateAction<SymbolType[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onAddFavorite: (id: string) => void;
  onInsertSymbol: (symbol: SymbolType) => void;
  selectMode: boolean;
}

const CanvasSection: React.FC<CanvasProps> = ({
  symbols,
  setSymbols,
  selectedId,
  setSelectedId,
  onAddFavorite,
  onInsertSymbol,
  selectMode,
}) => {
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectMode || !selectedId || !dragOffset.current) return;
    setSymbols((prev) =>
      prev.map((s) =>
        s.id === selectedId
          ? {
              ...s,
              x: e.clientX - dragOffset.current!.x,
              y: e.clientY - dragOffset.current!.y,
            }
          : s
      )
    );
  };

  const handleMouseUp = () => {
    dragOffset.current = null;
  };

  const toggleFavorite = (id: string) => {
    setSymbols((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, favorite: !s.favorite } : s
      )
    );
    onAddFavorite(id);
  };

  const renderFavoriteStar = (symbol: SymbolType) => (
    <text
      x={symbol.x + symbol.width - 14}
      y={symbol.y + 16}
      fontSize="16"
      fill={symbol.favorite ? "gold" : "#888"}
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(symbol.id);
      }}
    >
      ★
    </text>
  );

  return (
    <svg
      width={600}
      height={400}
      style={{ border: "1px solid #ccc", background: "#fff" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {symbols.map((symbol) => {
        const isSelected = symbol.id === selectedId;
        const stroke = isSelected ? "#1976d2" : "#333";
        const strokeWidth = isSelected ? 3 : 1;

        const sharedProps = {
          key: symbol.id,
          stroke,
          strokeWidth,
          style: { cursor: selectMode ? "move" : "pointer" },
          onMouseDown: (e: React.MouseEvent) => {
            e.stopPropagation();
            handleMouseDown(e, symbol.id);
          },
        };

        return (
          <g key={symbol.id}>
            {symbol.type === "rect" && (
              <rect
                {...sharedProps}
                x={symbol.x}
                y={symbol.y}
                width={symbol.width}
                height={symbol.height}
                fill={symbol.favorite ? "gold" : "#90caf9"}
              />
            )}
            {symbol.type === "circle" && (
              <circle
                {...sharedProps}
                cx={symbol.x + symbol.width / 2}
                cy={symbol.y + symbol.height / 2}
                r={Math.min(symbol.width, symbol.height) / 2}
                fill={symbol.favorite ? "gold" : "#a5d6a7"}
              />
            )}
            {symbol.type === "polygon" && (
              <polygon
                {...sharedProps}
                points={`
                  ${symbol.x + symbol.width / 2},${symbol.y}
                  ${symbol.x + symbol.width},${symbol.y + symbol.height}
                  ${symbol.x},${symbol.y + symbol.height}
                `}
                fill={symbol.favorite ? "gold" : "#ffcc80"}
              />
            )}
            {symbol.type === "image" && symbol.src && (
              <image
                {...sharedProps}
                x={symbol.x}
                y={symbol.y}
                width={symbol.width}
                height={symbol.height}
                href={symbol.src}
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertSymbol(symbol);
                }}
              />
            )}
            {renderFavoriteStar(symbol)}
          </g>
        );
      })}
    </svg>
  );
};

export default CanvasSection;
