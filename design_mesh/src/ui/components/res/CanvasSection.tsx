import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./CanvasSection.css";
import { RectIcon, CircleIcon, PolygonIcon, CurveIcon, ClockIcon } from "../ShapeIcons";
import { Button } from "@swc-react/button";
import ShapeEditor from "../ShapeEditor";

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
  onInsertUpdatedShape?: (symbol: SymbolType) => Promise<void>; // New prop for direct shape insertion
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
  onInsertUpdatedShape,
  inventoryList = [],
  toast,
  setToast,
}) => {
  const [open, setOpen] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [enableScroll, setEnableScroll] = useState(false); // <-- scroll toggle
  const [editingShape, setEditingShape] = useState<SymbolType | null>(null);
  const [showShapeEditor, setShowShapeEditor] = useState(false);

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

  // Shape editor handlers
  const handleShapeEdit = (shape: SymbolType) => {
    setEditingShape(shape);
    setShowShapeEditor(true);
  };

  const handleShapeUpdate = async (updatedShape: SymbolType) => {
    // Instead of updating the existing shape, add the edited version as a new history entry
    // The original shape remains in history, and the new edited version is added
    
    console.log('CanvasSection: Updating shape, curveData:', (updatedShape as any).curveData);
    
    // Create a new symbol with updated properties and a new UUID for both history and document
    // Use Object.assign to ensure ALL properties (including extended ones) are copied
    const newHistorySymbol = Object.assign({}, updatedShape as any, {
      uuid: `${updatedShape.inventoryId}-${Date.now()}`, // New unique ID for history
    });
    
    console.log('CanvasSection: New history symbol curveData:', (newHistorySymbol as any).curveData);
    
    // Add the edited shape to symbols array (history) with all extended properties
    setSymbols((prev) => [...prev, newHistorySymbol]);
    
    setShowShapeEditor(false);
    setEditingShape(null);
    
    // Use direct shape insertion if available, otherwise fall back to inventory method
    if (onInsertUpdatedShape) {
      try {
        await onInsertUpdatedShape(newHistorySymbol);
      } catch (error) {
        console.error('Failed to insert updated shape:', error);
      }
    } else {
      // Fallback to the original method
      onInsertSymbol(newHistorySymbol);
    }
  };

  const handleCloseShapeEditor = () => {
    setShowShapeEditor(false);
    setEditingShape(null);
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
            background: "var(--adobe-background)",
            color: "var(--adobe-text)",
            border: "1.5px solid var(--adobe-border)",
            borderRadius: 10,
            padding: "10px 32px",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 2px 12px var(--adobe-shadow)",
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
          <div style={{ background: "var(--adobe-background)", borderRadius: 12, boxShadow: "0 2px 16px var(--adobe-shadow)", padding: 32, minWidth: 200, textAlign: "center", marginLeft: 8, marginRight: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--adobe-text)" }}>Clear all symbols?</div>
            <div style={{ marginBottom: 24, color: "var(--adobe-text-secondary)" }}>Are you sure you want to remove all symbols from the canvas?</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button style={{ padding: "8px 24px", borderRadius: 6, background: "#d32f2f", color: "#fff", border: 0, fontWeight: 600, cursor: "pointer" }} onClick={() => { setSymbols([]); setShowClearConfirm(false); }}>Yes, clear</button>
              <button style={{ padding: "8px 24px", borderRadius: 6, background: "#eee", color: "#333", border: 0, fontWeight: 500, cursor: "pointer" }} onClick={() => setShowClearConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="border border-gray-300 rounded-xl shadow-sm">
        <Button
          onClick={() => setOpen(!open)}
          className="inventory-toggle-btn"
        >
          {/* <span className="text-xl leading-none">{open ? "🎯" : "🎨"}</span> */}
          <span className="text-xl leading-none">{open ? "▼ " : "▶ "}</span>
          <span>Symbols</span>
        </Button>
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
                  background: "var(--adobe-surface)",
                  borderRadius: 16,
                  padding: 12,
                  justifyContent: "start",
                  boxShadow: "0 4px 24px var(--adobe-shadow)",
                  border: "1.5px solid var(--adobe-border)",
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
                    background: "var(--adobe-background)",
                    borderRadius: 16,
                    boxShadow: "0 2px 8px var(--adobe-shadow)",
                    position: "relative" as const,
                    transition: "box-shadow 0.2s",
                    border: inInventory ? "0.5px solid var(--adobe-accent)" : "0.5px solid var(--adobe-border)",
                    outline: inInventory ? "0.1px solid var(--adobe-accent-hover)" : "none",
                  };
                  const handleInsert = () => {
                    if (symbol.type === "historyIcon") return;
                    
                    // If it's a shape that can be edited, show the editor
                    if (['rect', 'circle', 'polygon', 'curve'].includes(symbol.type)) {
                      handleShapeEdit(symbol);
                    } else {
                      // For other types (like images), insert directly
                      onInsertSymbol(symbol);
                    }
                  };
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
                        <RectIcon 
                          size="large" 
                          fill={(symbol as any).fill}
                          stroke={(symbol as any).stroke}
                          strokeWidth={(symbol as any).strokeWidth}
                          cornerRadius={(symbol as any).cornerRadius}
                        />
                      )}
                      {symbol.type === "circle" && (
                        <CircleIcon 
                          size="large" 
                          fill={(symbol as any).fill}
                          stroke={(symbol as any).stroke}
                          strokeWidth={(symbol as any).strokeWidth}
                        />
                      )}
                      {symbol.type === "polygon" && (
                        <PolygonIcon 
                          size="large" 
                          fill={(symbol as any).fill}
                          stroke={(symbol as any).stroke}
                          strokeWidth={(symbol as any).strokeWidth}
                        />
                      )}
                      {symbol.type === "curve" && (
                        <CurveIcon 
                          size="large" 
                          stroke={(symbol as any).stroke}
                          strokeWidth={(symbol as any).strokeWidth}
                          curveData={(symbol as any).curveData}
                        />
                      )}
                      {symbol.type === "historyIcon" && (
                        <div className="history-icon-container">
                          <ClockIcon size="large" />
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
      
      {/* Shape Editor */}
      {editingShape && (
        <ShapeEditor
          shape={editingShape}
          onShapeUpdate={handleShapeUpdate}
          onClose={handleCloseShapeEditor}
          isVisible={showShapeEditor}
        />
      )}
    </div>
  );
};

export default CanvasSection;
