import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./CanvasSection.css";

export type SymbolType = {
  uuid: string; // unique per instance on canvas/document
  inventoryId: string; // shared between inventory and canvas for linkage
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rect" | "circle" | "polygon" | "image" | "historyIcon" | "curve";
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
  inventoryList?: { inventoryId: string }[]; // Pass inventory list for star logic
  toast?: string | null;
  setToast?: React.Dispatch<React.SetStateAction<string | null>>;
}

// CanvasControls component for Edit/Done and Clear buttons
const CanvasControls: React.FC<{
  setSymbols: React.Dispatch<React.SetStateAction<SymbolType[]>>;
  onRequestClear: () => void;
}> = ({ setSymbols, onRequestClear }) => (

  <div className="inventory-controls-panel">
    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 16 }}>
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
  </div>
);

const GRID_COLS = 2;
const GRID_CELL_WIDTH = 100;
const GRID_CELL_HEIGHT = 100;
const GRID_GAP = 16;

const CanvasSection: React.FC<CanvasProps> = ({
  symbols,
  setSymbols,
  selectedId,
  setSelectedId,
  onAddInventory,
  onInsertSymbol,
  inventoryList = [],
  toast,
  setToast,
}) => {
  const [open, setOpen] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [enableScroll, setEnableScroll] = useState(false); // <-- scroll toggle

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
    symbol.type !== "historyIcon" ? (
      <span
        style={{
          position: "relative",
          display: "inline-block",
          cursor: "pointer",
          userSelect: "none",
          fontSize: 20,
          color: isInInventory(symbol.inventoryId) ? "gold" : "#888",
          transition: "color 0.9s",
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
    ) : null
  );

  // Debug logging removed to prevent console spam

  return (
    <div className="mt-12" style={{ position: "relative" }}>

      {toast && (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        pointerEvents: "none"
      }}>
        <div
          style={{
            transformOrigin: "top center",
            background: "#fffbe6",
            color: "#222",
            border: "1.5px solid #d6c585",
            borderRadius: 10,
            padding: "10px 32px",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            zIndex: 1001,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            minWidth: 220,
            maxWidth: 400,
            pointerEvents: "auto",
            position: "relative"
          }}
        >
          <span style={{ flex: 1 }}>{toast}</span>
          <button
            type="button"
            style={{
              position: "absolute",
              top: 6,
              right: 10,
              background: "none",
                border: "none",
                color: "#d32f2f",
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer"
              }}
              onClick={() => setToast && setToast(null)}
              title="Close"
              aria-label="Close toast"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {showClearConfirm && (
        <div style={{
          position: "absolute", zIndex: 10, left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.15)", padding: 32, minWidth: 200, textAlign: "center", marginLeft: 8, marginRight: 8 }}>
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
          className="inline-flex items-center gap-2 rounded-xl bg-gray-100 p-4 font-medium text-gray-700 hover:bg-gray-200 transition-colors w-full"
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          {/* <span className="text-xl leading-none">{open ? "🎯" : "🎨"}</span> */}
          <span className="text-xl leading-none">{open ? "▼ " : "▶ "}</span>
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
            <CanvasControls setSymbols={setSymbols} onRequestClear={() => setShowClearConfirm(true)} />
              {/* Scroll toggle switch */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <label style={{ fontWeight: 500, fontSize: 15 }}>
                  <input
                    type="checkbox"
                    checked={enableScroll}
                    onChange={e => setEnableScroll(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Enable Scroll
                </label>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${GRID_COLS}, ${GRID_CELL_WIDTH}px)`,
                  gap: `${GRID_GAP}px`,
                  rowGap: `${GRID_GAP/2}px`, 
                  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                  borderRadius: 16,
                  padding: 12,
                  justifyContent: "start",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                  border: "1.5px solid #e0e7ef",
                  overflow: enableScroll ? "auto" : "visible",
                  maxHeight: enableScroll ? 500 : "none",
                  minHeight: 300,
                  alignContent: "start",
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
                    <div
                      key={symbol.uuid}
                      style={cellStyle}
                      onClick={symbol.type !== "historyIcon" ? handleInsert : undefined}
                    >
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
                      {symbol.type === "curve" && (
                        <svg width={80} height={80}>
                          <path d="M 10 40 Q 40,10 70,40" fill="none" stroke={symbol.inventory ? "gold" : "#ef9a9a"} strokeWidth={3} />
                        </svg>
                      )}
                      {symbol.type === "historyIcon" && (
                        <div className="history-icon-container">
                          <svg width={80} height={80} viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="28" fill={symbol.inventory ? "gold" : "#ffe082"} stroke="#333" strokeWidth={2} />
                            <path d="M40 22 v18 l14 14" stroke="#333" strokeWidth="3" fill="none" />
                          </svg>
                          <div className="history-icon-text">
                            Your history appears here
                          </div>
                        </div>
                      )}
                      {symbol.type === "image" && symbol.src && (
                        <img src={symbol.src} alt="img" className="symbol-image" />
                      )}

                      {symbol.type !== "historyIcon" && (
                        <button
                          type="button"
                          onClick={handleRemove}
                          title="Remove from canvas"
                          className="remove-inventory-btn-modern"
                        >
                          ×
                        </button>
                      )}
                      {!inInventory && symbol.type !== "historyIcon" && (
                        <div className="inventory-star-container">{renderInventoryStar(symbol)}</div>
                      )}
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
