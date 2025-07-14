import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SymbolType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rect" | "circle" | "polygon" | "image";
  src?: string;
  inventory?: boolean;
};

interface CanvasProps {
  symbols: SymbolType[];
  setSymbols: React.Dispatch<React.SetStateAction<SymbolType[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onAddInventory: (id: string) => void;
  onInsertSymbol: (symbol: SymbolType) => void;
  selectMode: boolean;
}

const CanvasSection: React.FC<CanvasProps> = ({
  symbols,
  setSymbols,
  selectedId,
  setSelectedId,
  onAddInventory,
  onInsertSymbol,
  selectMode,
}) => {
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(true);

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

  const toggleInventory = (id: string) => {
    setSymbols((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, inventory: !s.inventory } : s
      )
    );
    onAddInventory(id);
  };

  const renderInventoryStar = (symbol: SymbolType) => (
    <text
      x={symbol.x + symbol.width - 14}
      y={symbol.y + 16}
      fontSize="16"
      fill={symbol.inventory ? "gold" : "#888"}
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={(e) => {
        e.stopPropagation();
        toggleInventory(symbol.id);
      }}
    >
      ★
    </text>
  );

  return (
    <div className="mt-12">
      <div className="border border-gray-300 rounded-xl shadow-sm">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-100 p-4 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <span className="text-xl leading-none">{open ? "🎯" : "🎨"}</span>
          <span>Symbols</span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="canvas"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-white rounded-b-xl border-t">
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
                            fill={symbol.inventory ? "gold" : "#90caf9"}
                          />
                        )}
                        {symbol.type === "circle" && (
                          <circle
                            {...sharedProps}
                            cx={symbol.x + symbol.width / 2}
                            cy={symbol.y + symbol.height / 2}
                            r={Math.min(symbol.width, symbol.height) / 2}
                            fill={symbol.inventory ? "gold" : "#a5d6a7"}
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
                            fill={symbol.inventory ? "gold" : "#ffcc80"}
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
                        {renderInventoryStar(symbol)}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CanvasSection;
