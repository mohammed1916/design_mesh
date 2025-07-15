import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SymbolType = {
  uuid: string; // unique per instance on canvas/document
  inventoryId: string; // shared between inventory and canvas for linkage
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
  onAddInventory: (inventoryId: string) => void;
  onInsertSymbol: (symbol: SymbolType) => void;
  selectMode: boolean;
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>;
  inventoryList?: { inventoryId: string }[]; // Pass inventory list for star logic
}

// CanvasControls component for Edit/Done and Clear buttons
const CanvasControls: React.FC<{
  selectMode: boolean;
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSymbols: React.Dispatch<React.SetStateAction<SymbolType[]>>;
  onRequestClear: () => void;
}> = ({ selectMode, setSelectMode, onRequestClear }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 16 }}>
    <button
      style={{
        padding: "6px 16px",
        borderRadius: 4,
        border: 0,
        background: selectMode ? "#1976d2" : "#eee",
        color: selectMode ? "#fff" : "#333",
        fontWeight: 500,
        cursor: "pointer",
      }}
      onClick={() => setSelectMode((prev) => !prev)}
    >
      {selectMode ? "Done" : "Edit"}
    </button>
    <button
      style={{
        padding: "6px 16px",
        borderRadius: 4,
        border: 0,
        background: "#eee",
        color: "#333",
        fontWeight: 500,
        cursor: "pointer",
      }}
      onClick={onRequestClear}
    >
      Clear
    </button>
  </div>
);

const CanvasSection: React.FC<CanvasProps> = ({
  symbols,
  setSymbols,
  selectedId,
  setSelectedId,
  onAddInventory,
  onInsertSymbol,
  selectMode,
  setSelectMode,
  inventoryList = [],
}) => {
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (!selectMode) return;
    setSelectedId(id);
    const symbol = symbols.find((s) => s.uuid === id);
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
        s.uuid === selectedId
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

  // Helper to check if a symbol is in inventory by inventoryId
  const isInInventory = (inventoryId: string) =>
    inventoryList.some((item) => item.inventoryId === inventoryId);

  const toggleInventory = (inventoryId: string) => {
    setSymbols((prev) =>
      prev.map((s) =>
        s.inventoryId === inventoryId ? { ...s, inventory: !s.inventory } : s
      )
    );
    onAddInventory(inventoryId);
  };

  const renderInventoryStar = (symbol: SymbolType) => (
    <text
      x={symbol.x + symbol.width - 14}
      y={symbol.y + 16}
      fontSize="16"
      fill={isInInventory(symbol.inventoryId) ? "gold" : "#888"}
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={(e) => {
        e.stopPropagation();
        toggleInventory(symbol.inventoryId);
      }}
    >
      ★
    </text>
  );

  return (
    <div className="mt-12" style={{ position: "relative"}}>
      {showClearConfirm && (
        <div style={{
          position: "absolute", zIndex: 10, left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.15)", padding: 32, minWidth: 320, textAlign: "center", marginLeft: 40 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Clear all symbols?</div>
            <div style={{ marginBottom: 24, color: "#555" }}>Are you sure you want to remove all symbols from the canvas?</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button style={{ padding: "8px 24px", borderRadius: 6, background: "#d32f2f", color: "#fff", border: 0, fontWeight: 600, cursor: "pointer" }} onClick={() => { setSymbols([]); setShowClearConfirm(false); }}>Yes, clear</button>
              <button style={{ padding: "8px 24px", borderRadius: 6, background: "#eee", color: "#333", border: 0, fontWeight: 500, cursor: "pointer" }} onClick={() => setShowClearConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
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
            <CanvasControls selectMode={selectMode} setSelectMode={setSelectMode} setSymbols={setSymbols} onRequestClear={() => setShowClearConfirm(true)} />
                <svg
                  width={600}
                  height={400}
                  style={{ border: "1px solid #ccc", background: "#fff" }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {symbols.map((symbol) => {
                    const isSelected = symbol.uuid === selectedId;
                    const stroke = isSelected ? "#1976d2" : "#333";
                    const strokeWidth = isSelected ? 3 : 1;

                    const sharedProps = {
                      key: symbol.uuid,
                      stroke,
                      strokeWidth,
                      style: { cursor: selectMode ? "move" : "pointer" },
                      onMouseDown: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleMouseDown(e, symbol.uuid);
                      },
                    };

                    return (
                      <g key={symbol.uuid}>
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
