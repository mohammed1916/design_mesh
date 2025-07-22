import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useEffect, useMemo } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import CanvasSection, { SymbolType } from "./res/CanvasSection";
import { v4 as uuidv4 } from "uuid";
import { createSlice, configureStore } from "@reduxjs/toolkit";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import "./App.css";

// Default inventory shapes (rect, circle, polygon)
const DEFAULT_INVENTORY: (SymbolType & { tag?: string; isDefault?: boolean })[] = [
  {
    uuid: "default-rect-uuid",
    inventoryId: "default-rect",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    type: "rect",
    inventory: true,
    tag: "Basic",
    isDefault: true,
  },
  {
    uuid: "default-circle-uuid",
    inventoryId: "default-circle",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    type: "circle",
    inventory: true,
    tag: "Basic",
    isDefault: true,
  },
  {
    uuid: "default-polygon-uuid",
    inventoryId: "default-polygon",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    type: "polygon",
    inventory: true,
    tag: "Basic",
    isDefault: true,
  },
];

// Redux slice for symbols, inventory, tags, toast, selection
const initialState = {
  symbols: [
      {
          "uuid":  uuidv4(),
          "inventoryId": "default-history-icon",
          "x": 50,
          "y": 50,
          "width": 100,
          "height": 100,
          "type": "historyIcon"
      }
  ] as SymbolType[],
  inventory: DEFAULT_INVENTORY as (SymbolType & { tag?: string; isDefault?: boolean })[],
  selectedIds: [] as string[], // <-- changed from selectedId
  editInventory: false,
  newTag: "",
  tagFilter: "All",
  toast: null as string | null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSymbols(state, action) {
      state.symbols = action.payload;
    },
    addSymbol(state, action) {
      if (!Array.isArray(state.symbols)) {
        state.symbols = [];
      }
      state.symbols.push(action.payload);
    },
    setInventory(state, action) {
      state.inventory = action.payload;
    },
    addInventory(state, action) {
      state.inventory.push(action.payload);
    },
    removeInventory(state, action) {
      state.inventory = state.inventory.filter((i) => i.inventoryId !== action.payload);
      state.symbols = state.symbols.map((s) =>
        s.inventoryId === action.payload ? { ...s, inventory: false } : s
      );
    },
    setSelectedIds(state, action) {
      state.selectedIds = action.payload;
    },
    setEditInventory(state, action) {
      state.editInventory = action.payload;
    },
    setNewTag(state, action) {
      state.newTag = action.payload;
    },
    setTagFilter(state, action) {
      state.tagFilter = action.payload;
    },
    setToast(state, action) {
      state.toast = action.payload;
    },
    clearSymbols(state) {
      state.symbols = [
        {
            "uuid":  uuidv4(),
            "inventoryId": "default-history-icon",
            "x": 50,
            "y": 50,
            "width": 100,
            "height": 100,
            "type": "historyIcon"
        }
    ];
    },
    refreshInventory(state, action) {
      state.inventory = action.payload;
    },
  },
});

const store = configureStore({ reducer: { app: appSlice.reducer } });
const {
  setSymbols,
  addSymbol,
  setInventory,
  addInventory,
  removeInventory,
  setSelectedIds,
  setEditInventory,
  setNewTag,
  setTagFilter,
  setToast,
  clearSymbols,
  refreshInventory,
} = appSlice.actions;

const App = ({ addOnSDKAPI, sandboxProxy }: { addOnSDKAPI: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  const dispatch = useDispatch();
  const appState = useSelector((state: any) => state.app);
  const symbols = Array.isArray(appState.symbols) ? appState.symbols : [];
  const {
    inventory,
    selectedIds,
    editInventory,
    newTag,
    tagFilter,
    toast,
  } = appState;

  async function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      };
      img.src = "data:image/svg+xml;base64," + btoa(svg);
    });
  }

  // Helper: get inventoryId from uuid
  const getInventoryIdByUuid = (uuid: string) => {
    const found = symbols.find((s) => s.uuid === uuid) || inventory.find((s) => s.uuid === uuid);
    return found?.inventoryId || uuid;
  };

  // Insert symbol to canvas (with new uuid, same inventoryId)
  const insertSymbolToCanvas = (symbol: SymbolType) => {
    dispatch(addSymbol({ ...symbol, uuid: uuidv4() }));
  };

  // Insert symbol to document (no uuid change needed)
  const insertSymbolToDocument = async (symbol: SymbolType) => {
    if (symbol.type === "image" && symbol.src) {
      const blob = await (await fetch(symbol.src)).blob();
      await addOnSDKAPI.app.document.addImage(blob);
    } else {
      let svg = "";
      if (symbol.type === "rect")
        svg = `<rect width="${symbol.width}" height="${symbol.height}" fill="#90caf9" stroke="#333" stroke-width="2" />`;
      else if (symbol.type === "circle")
        svg = `<circle cx="${symbol.width / 2}" cy="${symbol.height / 2}" r="${symbol.width / 2 - 2}" fill="#a5d6a7" stroke="#333" stroke-width="2" />`;
      else if (symbol.type === "polygon")
        svg = `<polygon points="50,10 90,90 10,90" fill="#ffcc80" stroke="#333" stroke-width="2" />`;

      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${symbol.width}" height="${symbol.height}">${svg}</svg>`;
      const blob = await svgToPngBlob(fullSvg, symbol.width, symbol.height);
      await addOnSDKAPI.app.document.addImage(blob);
    }
  };

  // Insert from inventory: always add a new symbol to the grid (canvas)
  const handleInsertFromInventory = async (inv: SymbolType) => {
    const newSymbol = {
      ...inv,
      uuid: uuidv4(),
      // Optionally reset position if you want
    };
    dispatch(addSymbol(newSymbol));
    await insertSymbolToDocument(newSymbol);
  };

  // Insert new shape (rect/circle/polygon) with unique uuid and inventoryId
  const handleInsertShape = async (type: "rect" | "circle" | "polygon") => {
    // Use inventoryId of default if exists, else new
    const defaultInv = DEFAULT_INVENTORY.find((d) => d.type === type);
    const inventoryId = defaultInv ? defaultInv.inventoryId : uuidv4();
    const newSymbol: SymbolType = {
      uuid: uuidv4(),
      inventoryId,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      type,
    };
    await insertSymbolToCanvas(newSymbol);
    await insertSymbolToDocument(newSymbol);
  };

  // Upload image: new uuid and inventoryId, reset file input after upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      // Check for duplicate src in symbols
      // console.log("Symbols before upload:", symbols);
      // console.log("Checking:", symbols.some((s) => s.uuid));
      if (symbols.some((s) => s.uuid) && symbols.some((s) => s.src === src && s.type !== "image")) {
        dispatch(setToast("Something went wrong: plese enter a valid image. (png, jpg, svg etc.)"));
        if (e.target) e.target.value = "";
        return;
      }
      const symbol: SymbolType = {
        uuid: uuidv4(),
        inventoryId: uuidv4(),
        x: 0,
        y: 0,
        width: 80,
        height: 80,
        type: "image",
        src,
      };
      
      dispatch(addSymbol(symbol));
      await insertSymbolToDocument(symbol);
      if (e.target) e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  // Add to inventory by inventoryId
  const handleAddInventory = async (uuid: string) => {
    const item = symbols.find((s) => s.uuid === uuid);
    if (!item || inventory.some((f) => f.inventoryId === item.inventoryId)) return;
    const inv = { ...item, inventory: true, tag: newTag.trim() || "Untagged" };
    const updatedInventory = [...inventory, inv];
    dispatch(setInventory(updatedInventory));
    // Fix: get current symbols, compute new array, then dispatch
    const currentSymbols = store.getState().app.symbols;
    const updatedSymbols = currentSymbols.map((s) =>
      s.inventoryId === item.inventoryId ? { ...s, inventory: true } : s
    );
    dispatch(setSymbols(updatedSymbols));
    await addOnSDKAPI.instance.clientStorage.setItem("inventory", updatedInventory);
    dispatch(setNewTag(""));
    console.log("Inventory after add:", inventory);
  };

  // Remove from inventory by inventoryId
  const handleRemoveInventory = async (inventoryId: string) => {
    if (DEFAULT_INVENTORY.some((d) => d.inventoryId === inventoryId)) return;
    const updated = inventory.filter((f) => f.inventoryId !== inventoryId);
    dispatch(setInventory(updated));
    const currentSymbols = store.getState().app.symbols;
    const updatedSymbols = currentSymbols.map((s) =>
      s.inventoryId === inventoryId ? { ...s, inventory: false } : s
    );
    dispatch(setSymbols(updatedSymbols));
    await addOnSDKAPI.instance.clientStorage.setItem("inventory", updated);
  };

  // Add new handler for tagging inventory
  const handleAddTag = async (uuids: string[], tag: string) => {
    if (!tag.trim()) return;
    const updatedInventory = inventory.map((item) =>
      uuids.includes(item.uuid) ? { ...item, tag: tag.trim() } : item
    );
    dispatch(setInventory(updatedInventory));
    dispatch(setNewTag(""));
    await addOnSDKAPI.instance.clientStorage.setItem("inventory", updatedInventory);
    dispatch(setToast(`Tag '${tag.trim()}' added to selected item(s).`));
    setTimeout(() => dispatch(setToast(null)), 2000);
  };

  // Load inventory: ensure default shapes always present
  const loadInventory = async () => {
    const stored = (await addOnSDKAPI.instance.clientStorage.getItem("inventory")) as
      | (SymbolType & { tag?: string; isDefault?: boolean })[]
      | undefined;
    let merged: (SymbolType & { tag?: string; isDefault?: boolean })[] = DEFAULT_INVENTORY;
    if (stored) {
      const nonDefault = stored.filter((i) => !DEFAULT_INVENTORY.some((d) => d.inventoryId === i.inventoryId));
      merged = [...DEFAULT_INVENTORY, ...nonDefault];
    }
    dispatch(setInventory(merged));
    // Fix: get current symbols, compute new array, then dispatch
    const currentSymbols = store.getState().app.symbols;
    const updatedSymbols = currentSymbols.map((s) =>
      merged.some((i) => i.inventoryId === s.inventoryId) ? { ...s, inventory: true } : s
    );
    dispatch(setSymbols(updatedSymbols));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = !Array.isArray(tagFilter) || tagFilter.length === 0
    ? inventory
    : inventory.filter((f) => tagFilter.includes(f.tag));
  const uniqueTags = useMemo(() => Array.from(new Set(inventory.map((f) => String(f.tag ?? "Untagged")))), [inventory]);
  const tagOptions = uniqueTags.map((tag) => ({ value: tag, label: tag }));

  // Helper: get tag filter value for Select
  const getTagFilterValue = () => {
    if (!Array.isArray(tagFilter) || tagFilter.length === 0) {
      return [];
    }
    return tagOptions.filter((opt) => tagFilter.includes(opt.value));
  };

  // Wrapper for setSymbols to support both value and updater function (for CanvasSection compatibility)
  const setSymbolsWrapper = (updater: SymbolType[] | ((prev: SymbolType[]) => SymbolType[])) => {
    if (typeof updater === "function") {
      const current = store.getState().app.symbols;
      const result = (updater as (prev: SymbolType[]) => SymbolType[])(current);
      if (Array.isArray(result) && result.length === 0) {
        dispatch(clearSymbols());
      } else {
        dispatch(setSymbols(result));
      }
    } else {
      if (Array.isArray(updater) && updater.length === 0) {
        dispatch(clearSymbols());
      } else {
        dispatch(setSymbols(updater));
      }
    }
  };

  // Wrapper for setToast to always dispatch Redux action
  const setToastWrapper = (value: string | null) => {
    dispatch(setToast(value));
  };

  const [inventoryOpen, setInventoryOpen] = React.useState(true);
  const inventoryRef = React.useRef<HTMLDivElement>(null);
  const prevInventoryLength = React.useRef(inventory.length);

  React.useEffect(() => {
    if (inventoryOpen && inventoryRef.current) {
      inventoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [inventoryOpen]);

  React.useEffect(() => {
    if (
      inventoryOpen &&
      inventoryRef.current &&
      inventory.length > prevInventoryLength.current
    ) {
      inventoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevInventoryLength.current = inventory.length;
  }, [inventory.length, inventoryOpen]);

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        {/* Top shape/upload controls - modern flex card */}
        <div className="top-controls">
          <div className="shape-row">
            <div onClick={() => handleInsertShape("rect")}> <svg width={40} height={40}><rect x={5} y={10} width={30} height={20} fill="#90caf9" stroke="#333" strokeWidth={2} /></svg> </div>
            <div onClick={() => handleInsertShape("circle")}> <svg width={40} height={40}><circle cx={20} cy={20} r={12} fill="#a5d6a7" stroke="#333" strokeWidth={2} /></svg> </div>
            <div onClick={() => handleInsertShape("polygon")}> <svg width={40} height={40}><polygon points="20,5 35,35 5,35" fill="#ffcc80" stroke="#333" strokeWidth={2} /></svg> </div>
            <label>
              <Button size="m">Upload</Button>
              <input type="file" accept="image/*" className="file-input-hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>

        {/* Canvas section remains unchanged */}
        <CanvasSection
          symbols={symbols}
          setSymbols={setSymbolsWrapper}
          selectedId={selectedIds}
          setSelectedId={setSelectedIds}
          onAddInventory={handleAddInventory}
          onInsertSymbol={handleInsertFromInventory}
          inventoryList={inventory.map((i) => ({ inventoryId: i.inventoryId }))}
          toast={toast}
          setToast={setToastWrapper}
        />

        {/* Inventory controls and grid - modern card design */}
        <div className="border border-gray-300 rounded-xl shadow-sm mt-24">
          <button
            onClick={() => setInventoryOpen(!inventoryOpen)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 p-4 font-medium text-gray-700 hover:bg-gray-200 transition-colors w-full"
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            {/* <span className="text-xl leading-none">{inventoryOpen ? "📦" : "🗃️"}</span> */}
            <span className="text-xl leading-none">{inventoryOpen ? "▼ " : "▶ "}</span>
            <span>Inventory</span>
          </button>
          <AnimatePresence initial={false}>
            {inventoryOpen && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white rounded-b-xl border-t">
                  {/* <h4 className="inventory-title">Inventory</h4> */}
                  
                    <div className="inventory-controls-panel">
                      <div className="flex flex-wrap gap-2 items-center justify-center">
                        {inventory.length >= 3 && (
                        <Button
                          size="s"
                          variant={editInventory ? "primary" : "secondary"}
                          onClick={() => dispatch(setEditInventory(!editInventory))}
                          className={`inventory-edit-btn${editInventory ? " editing" : ""}`}
                        >
                          {editInventory ? "Done" : "Edit"}
                        </Button>
                        )}
                      </div>
                    </div>
                  
                  
                  {editInventory && selectedIds.length > 0 && (
                    <div className="inventory-edit-row" style={{ display: "flex", gap: 10, alignItems: "center", margin: "16px 0" }}>
                      <input
                        placeholder="Enter tag for selected symbol(s)"
                        value={newTag}
                        onChange={(e) => dispatch(setNewTag(e.target.value))}
                        className="inventory-input"
                        style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px", minWidth: "200px" }}
                      />
                      <Button variant="primary" onClick={() => handleAddTag(selectedIds, newTag)}>
                        Add Tag
                      </Button>
                    </div>
                  )}
                  {inventory.length === 3 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-center text-gray-500 p-5 border border-dashed border-gray-300 rounded-lg">
                        No items in inventory. Start adding shapes or images!
                      </p>
                    </div>
                  ) : null}
                  <div className="inventory-grid mb-4">
                    {filteredInventory.map((inv: SymbolType & { tag?: string; isDefault?: boolean }) => (
                      <div key={inv.inventoryId} className="inventory-card">
                        {/* Icon rendering */}
                        {inv.type === "rect" ? (
                          <svg width={30} height={20}><rect x={2} y={2} width={26} height={16} fill="gold" stroke="#333" /></svg>
                        ) : inv.type === "circle" ? (
                          <svg width={30} height={30}><circle cx={15} cy={15} r={13} fill="gold" stroke="#333" /></svg>
                        ) : inv.type === "polygon" ? (
                          <svg width={30} height={30}><polygon points="15,2 28,28 2,28" fill="gold" stroke="#333" /></svg>
                        ) : inv.type === "image" && inv.src ? (
                          <img src={inv.src} width={30} height={30} alt="Inventory" />
                        ) : null}
                        {/* Select button in edit mode */}
                        {editInventory && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = selectedIds.indexOf(inv.uuid);
                              let updated;
                              if (idx === -1) updated = [...selectedIds, inv.uuid];
                              else updated = selectedIds.filter((id) => id !== inv.uuid);
                              dispatch(setSelectedIds(updated));
                            }}
                            className={`select-inventory-btn-modern${selectedIds.includes(inv.uuid) ? " selected" : ""}`}
                            aria-label="Select inventory item"
                            style={{ position: "absolute", top: 2, left: 6, background: selectedIds.includes(inv.uuid) ? "#1976d2" : "#eee", color: selectedIds.includes(inv.uuid) ? "#fff" : "#333", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                          >
                            ✓
                          </button>
                        )}
                        {/* Remove button in edit mode */}
                        {editInventory && !inv.isDefault && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveInventory(inv.inventoryId); }} className="remove-inventory-btn-modern" aria-label="Remove from inventory">×</button>
                        )}
                        {/* Only allow add to document when not in edit mode */}
                        {!editInventory && (
                          <div
                            className="inventory-card-overlay"
                            onClick={() => handleInsertFromInventory(inv)}
                            style={{ position: "absolute", inset: 0, cursor: "pointer", borderRadius: 14, zIndex: 1, background: "rgba(0,0,0,0)" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Tag filter */}
                  {uniqueTags.length > 0 && (
                    <div>
                      <div className="mt-4">
                        &nbsp;
                      </div>
                      <div className="tag-filter">
                        <Select
                          isMulti
                          options={tagOptions}
                          value={getTagFilterValue()}
                          onChange={(selected) => {
                            const values = selected.map((s) => s.value);
                            dispatch(setTagFilter(values));
                          }}
                          placeholder="Filter by tag..."
                          className="tag-select"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={inventoryRef} style={{ height: 0, overflow: "hidden" }} />
        </div>
      </div>
    </Theme>
  );
};

export { store };
export default App;