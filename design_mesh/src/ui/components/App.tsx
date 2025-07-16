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
            "uuid": "884d68cc-e4c7-452e-bdf6-335a254201d9",
            "inventoryId": "default-polygon",
            "x": 50,
            "y": 50,
            "width": 100,
            "height": 100,
            "type": "polygon"
        }
    ] as SymbolType[],
  inventory: DEFAULT_INVENTORY as (SymbolType & { tag?: string; isDefault?: boolean })[],
  selectedId: null as string | null,
  selectMode: false,
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
    setSelectedId(state, action) {
      state.selectedId = action.payload;
    },
    setSelectMode(state, action) {
      state.selectMode = action.payload;
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
            "uuid": "884d68cc-e4c7-452e-bdf6-335a254201d9",
            "inventoryId": "default-polygon",
            "x": 50,
            "y": 50,
            "width": 100,
            "height": 100,
            "type": "polygon"
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
  setSelectedId,
  setSelectMode,
  setEditInventory,
  setNewTag,
  setTagFilter,
  setToast,
  clearSymbols,
  refreshInventory,
} = appSlice.actions;

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  const dispatch = useDispatch();
  const appState = useSelector((state: any) => state.app);
  const symbols = Array.isArray(appState.symbols) ? appState.symbols : [];
  const {
    inventory,
    selectedId,
    selectMode,
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
      await addOnUISdk.app.document.addImage(blob);
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
      await addOnUISdk.app.document.addImage(blob);
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
      console.log("Symbols before upload:", symbols);
      console.log("Checking:", symbols.some((s) => s.uuid));
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
    await addOnUISdk.instance.clientStorage.setItem("inventory", updatedInventory);
    dispatch(setNewTag(""));
  };

  // Remove from inventory by inventoryId
  const handleRemoveInventory = async (inventoryId: string) => {
    if (DEFAULT_INVENTORY.some((d) => d.inventoryId === inventoryId)) return;
    const updated = inventory.filter((f) => f.inventoryId !== inventoryId);
    dispatch(setInventory(updated));
    dispatch(
      setSymbols((prev) =>
        prev.map((s) => (s.inventoryId === inventoryId ? { ...s, inventory: false } : s))
      )
    );
    await addOnUISdk.instance.clientStorage.setItem("inventory", updated);
  };

  // Load inventory: ensure default shapes always present
  const loadInventory = async () => {
    const stored = (await addOnUISdk.instance.clientStorage.getItem("inventory")) as
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

  const filteredInventory = tagFilter === "All" ? inventory : inventory.filter((f) => f.tag === tagFilter);
  const uniqueTags = useMemo(() => Array.from(new Set(inventory.map((f) => String(f.tag ?? "Untagged")))), [inventory]);

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

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        <div className="flex p-4 mb-12">
          <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
            <div onClick={() => handleInsertShape("rect")}>
              <svg width={40} height={40}>
                <rect x={5} y={10} width={30} height={20} fill="#90caf9" stroke="#333" strokeWidth={2} />
              </svg>
            </div>
            <div onClick={() => handleInsertShape("circle")}>
              <svg width={40} height={40}>
                <circle cx={20} cy={20} r={12} fill="#a5d6a7" stroke="#333" strokeWidth={2} />
              </svg>
            </div>
            <div onClick={() => handleInsertShape("polygon")}>
              <svg width={40} height={40}>
                <polygon points="20,5 35,35 5,35" fill="#ffcc80" stroke="#333" strokeWidth={2} />
              </svg>
            </div>
            <label>
              <Button size="m">Upload</Button>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
            </label>
          </div>
        </div>

        <CanvasSection
          symbols={symbols}
          setSymbols={setSymbolsWrapper}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onAddInventory={handleAddInventory}
          onInsertSymbol={handleInsertFromInventory}
          selectMode={selectMode}
          setSelectMode={setSelectMode}
          inventoryList={inventory.map((i) => ({ inventoryId: i.inventoryId }))}
          toast={toast}
          setToast={setToast}
        />

        {selectMode && selectedId && (
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <input
              placeholder="Enter tag for selected symbol"
              value={newTag}
              onChange={(e) => dispatch(setNewTag(e.target.value))}
              style={{
                padding: "6px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
                minWidth: "200px",
              }}
            />
            <Button variant="primary" onClick={() => handleAddInventory(selectedId!)}>
              📦 Add to Inventory
            </Button>
          </div>
        )}

        <div className="mt-12">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "#f8f9fa",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              padding: "18px 24px 12px 24px",
              marginBottom: 12,
            }}
          >
            <h4
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                color: "#222",
                letterSpacing: 0.2,
              }}
            >
              Inventory
            </h4>
            <Button
              size="s"
              variant={editInventory ? "primary" : "secondary"}
              onClick={() => dispatch(setEditInventory(!editInventory))}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                minWidth: 64,
                marginLeft: 8,
              }}
            >
              {editInventory ? "Done" : "Edit"}
            </Button>
            <Button
              size="s"
              variant="secondary"
              onClick={async () => {
                await loadInventory();
                dispatch(setToast("Canvas refreshed."));
              }}
              style={{ borderRadius: 8, fontWeight: 600, minWidth: 64, marginLeft: 8 }}
            >
              Refresh Canvas
            </Button>
            <Button
              size="s"
              variant="secondary"
              onClick={() => {
                dispatch(clearSymbols());
                dispatch(setToast("Canvas cleared."));
              }}
              style={{ borderRadius: 8, fontWeight: 600, minWidth: 64, marginLeft: 8 }}
            >
              Clear Canvas
            </Button>
            <select
              title="Filter Inventory"
              value={tagFilter}
              onChange={(e) => dispatch(setTagFilter(e.target.value))}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 15,
                background: "#fff",
                color: "#333",
                marginLeft: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                outline: "none",
                transition: "border 0.2s",
              }}
            >
              <option value="All">All</option>
              {uniqueTags.map((tag: string) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            {filteredInventory.map((inv) => (
              <div
                key={inv.inventoryId}
                className="border border-gray-300 p-1 relative"
                onClick={() => handleInsertFromInventory(inv)}
              >
                <div className="cursor-pointer">
                  {inv.type === "rect" ? (
                    <svg width={30} height={20}>
                      <rect x={2} y={2} width={26} height={16} fill="gold" stroke="#333" />
                    </svg>
                  ) : inv.type === "circle" ? (
                    <svg width={30} height={30}>
                      <circle cx={15} cy={15} r={13} fill="gold" stroke="#333" />
                    </svg>
                  ) : inv.type === "polygon" ? (
                    <svg width={30} height={30}>
                      <polygon points="15,2 28,28 2,28" fill="gold" stroke="#333" />
                    </svg>
                  ) : inv.type === "image" && inv.src ? (
                    <img src={inv.src} width={30} height={30} alt="Inventory" />
                  ) : null}
                </div>
                {editInventory && !inv.isDefault && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveInventory(inv.inventoryId);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    aria-label="Remove from inventory"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Theme>
  );
};

export { store };
export default App;

// App.tsx now exports store and default App
// In index.tsx, wrap <App /> with <Provider store={store}>
// Example for index.tsx:
// import React from "react";
// import ReactDOM from "react-dom";
// import App, { store } from "./components/App";
// import { Provider } from "react-redux";
// ReactDOM.render(
//   <Provider store={store}>
//     <App addOnUISdk={addOnUISdk} sandboxProxy={sandboxProxy} />
//   </Provider>,
//   document.getElementById("root")
// );
