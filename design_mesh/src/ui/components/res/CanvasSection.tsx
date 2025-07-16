import React, { useState } from "react";
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
  toast?: string | null;
  setToast?: React.Dispatch<React.SetStateAction<string | null>>;
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

const GRID_COLS = 4;
const GRID_CELL_WIDTH = 120;
const GRID_CELL_HEIGHT = 120;
const GRID_GAP = 24;

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
  toast,
  setToast,
}) => {
  const [open, setOpen] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    <span
      style={{
        position: "relative",
        display: "inline-block",
        cursor: "pointer",
        userSelect: "none",
        fontSize: 20,
        color: isInInventory(symbol.inventoryId) ? "gold" : "#888",
        transition: "color 0.2s",
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Add to inventory if not already present
        if (!isInInventory(symbol.inventoryId)) {
          // Find the symbol in symbols array
          const sym = symbols.find((s) => s.uuid === symbol.uuid);
          if (sym) {
            onAddInventory(sym.uuid);
          }
        }
      }}
      title={isInInventory(symbol.inventoryId) ? "In Inventory" : "Add to Inventory"}
    >
      ★
    </span>
  );

  return (
    <div className="mt-12" style={{ position: "relative" }}>
      {toast && (
        <div style={{
          position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", background: "#fffbe6", color: "#222", border: "1.5px solid #d6c585", borderRadius: 10, padding: "10px 32px", fontWeight: 600, fontSize: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", zIndex: 20,
        }}>
          {toast}
        </div>
      )}
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${GRID_COLS}, ${GRID_CELL_WIDTH}px)`,
                  gap: `${GRID_GAP}px`,
                  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                  borderRadius: 16,
                  padding: 32,
                  justifyContent: "center",
                  minHeight: 400,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                  border: "1.5px solid #e0e7ef",
                }}
              >
                {symbols.map((symbol) => {
                  const inInventory = isInInventory(symbol.inventoryId);
                  const cellStyle = {
                    width: GRID_CELL_WIDTH,
                    height: GRID_CELL_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    position: "relative" as const,
                    transition: "box-shadow 0.2s",
                    border: inInventory ? "0.5px solid #f7e9b0" : "0.5px solid #e3e8f0",
                    outline: inInventory ? "0.1px solid #d6c585" : "none",
                  };
                  const handleInsert = () => onInsertSymbol(symbol);
                  const handleRemove = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSymbols((prev) => prev.filter((s) => s.uuid !== symbol.uuid));
                  };
                  return (
                    <div key={symbol.uuid} style={cellStyle} onClick={handleInsert}>
                      {symbol.type === "rect" && (
                        <svg width={80} height={80}>
                          <rect x={10} y={20} width={60} height={40} fill={symbol.inventory ? "gold" : "#90caf9"} stroke="#333" strokeWidth={2} rx={12} />
                        </svg>
                      )}
                      {symbol.type === "circle" && (
                        <svg width={80} height={80}>
                          <circle cx={40} cy={40} r={28} fill={symbol.inventory ? "gold" : "#a5d6a7"} stroke="#333" strokeWidth={2} />
                        </svg>
                      )}
                      {symbol.type === "polygon" && (
                        <svg width={80} height={80}>
                          <polygon points="40,10 70,70 10,70" fill={symbol.inventory ? "gold" : "#ffcc80"} stroke="#333" strokeWidth={2} />
                        </svg>
                      )}
                      {symbol.type === "image" && symbol.src && (
                        <img src={symbol.src} alt="img" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "1.5px solid #bbb", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }} />
                      )}
                      {!inInventory && (
                        <div style={{ position: "absolute", top: 8, right: 12 }}>{renderInventoryStar(symbol)}</div>
                      )}
                      <button
                        style={{ position: "absolute", bottom: 8, right: 12, background: "#fffbe6", color: "#d32f2f", border: "1px solid #d6c585", borderRadius: 8, padding: "2px 10px", fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                        onClick={handleRemove}
                        title="Remove from canvas"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CanvasSection;
