import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useEffect, useState, useMemo } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import CanvasSection, { SymbolType } from "./res/CanvasSection";
import { v4 as uuidv4 } from 'uuid';

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  const [symbols, setSymbols] = useState<SymbolType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [inventory, setInventory] = useState<(SymbolType & { tag?: string })[]>([]);
  const [editInventory, setEditInventory] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagFilter, setTagFilter] = useState("All");

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

  const insertSymbolToCanvas = (symbol: SymbolType) => {
    setSymbols((prev) => [...prev, symbol]);
  };

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

  const insertSymbolToCanvasAndDocument = async (symbol: SymbolType) => {
    insertSymbolToCanvas(symbol);
    await insertSymbolToDocument(symbol);
  };

  const handleInsertShape = async (type: "rect" | "circle" | "polygon") => {
    const newSymbol: SymbolType = {
      id: uuidv4(),
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      type,
    };
    await insertSymbolToCanvasAndDocument(newSymbol);
  };

  const handleInsertInventory = async (inv: SymbolType) => {
    const newSymbol: SymbolType = { ...inv, id: uuidv4(), x: inv.x + 20, y: inv.y + 20, inventory: false };
    await insertSymbolToCanvasAndDocument(newSymbol);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const symbol: SymbolType = {
        id: uuidv4(),
        x: 50,
        y: 50,
        width: 80,
        height: 80,
        type: "image",
        src,
      };
      await insertSymbolToCanvasAndDocument(symbol);
    };
    reader.readAsDataURL(file);
  };

  const handleAddInventory = async (id: string) => {
    const item = symbols.find((s) => s.id === id);
    if (!item || inventory.some((f) => f.id === id)) return;
    const inv = { ...item, inventory: true, tag: newTag.trim() || "Untagged" };
    const updated = [...inventory, inv];
    setInventory(updated);
    await addOnUISdk.instance.clientStorage.setItem("inventory", updated);
    setNewTag("");
  };

  const handleRemoveInventory = async (id: string) => {
    const updated = inventory.filter((f) => f.id !== id);
    setInventory(updated);
    await addOnUISdk.instance.clientStorage.setItem("inventory", updated);
  };

  const loadInventory = async () => {
    const stored = (await addOnUISdk.instance.clientStorage.getItem("inventory")) as SymbolType[] | undefined;
    if (stored) setInventory(stored);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = tagFilter === "All" ? inventory : inventory.filter((f) => f.tag === tagFilter);
  const uniqueTags = useMemo(() => Array.from(new Set(inventory.map((f) => f.tag ?? "Untagged"))), [inventory]);

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
            <Button size="s" variant={selectMode ? "primary" : "secondary"} onClick={() => setSelectMode(!selectMode)}>
              {selectMode ? "Done" : "Edit"}
            </Button>
          </div>
          <div className="mb-3">
            <Button size="s" variant="secondary" onClick={() => setSymbols([])}>
              Clear
            </Button>
          </div>
        </div>

        <CanvasSection
          symbols={symbols}
          setSymbols={setSymbols}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onAddInventory={handleAddInventory}
          selectMode={selectMode}
          onInsertSymbol={insertSymbolToDocument}
        />

        {selectMode && selectedId && (
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <input
              placeholder="Enter tag for selected symbol"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
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
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold">Inventory</h4>
            <Button size="s" variant={editInventory ? "primary" : "secondary"} onClick={() => setEditInventory(!editInventory)}>
              {editInventory ? "Done" : "Edit"}
            </Button>
            <select
              title="Filter Inventory"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="All">All</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            {filteredInventory.map((inv) => (
              <div key={inv.id} className="border border-gray-300 p-1 relative">
                <div onClick={() => handleInsertInventory(inv)} className="cursor-pointer">
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
                {editInventory && (
                  <button onClick={() => handleRemoveInventory(inv.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
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

export default App;
