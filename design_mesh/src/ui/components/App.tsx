// imports
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useEffect, useState, useMemo } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import Canvas, { SymbolType } from "./Canvas";

// component
const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  const [symbols, setSymbols] = useState<SymbolType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [favorites, setFavorites] = useState<(SymbolType & { tag?: string })[]>([]);
  const [editFavorites, setEditFavorites] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagFilter, setTagFilter] = useState("All");

  const uuidv4 = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

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

  const handleInsertShape = async (type: "rect" | "circle" | "polygon") => {
    const width = 100, height = 100;
    let svg = "";

    if (type === "rect") {
      svg = `<rect width="100" height="60" fill="#90caf9" stroke="#333" stroke-width="2"/>`;
    } else if (type === "circle") {
      svg = `<circle cx="50" cy="50" r="45" fill="#a5d6a7" stroke="#333" stroke-width="2"/>`;
    } else {
      svg = `<polygon points="50,10 90,90 10,90" fill="#ffcc80" stroke="#333" stroke-width="2"/>`;
    }

    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svg}</svg>`;
    const blob = await svgToPngBlob(fullSvg, width, height);
    await addOnUISdk.app.document.addImage(blob);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const symbol = {
        id: uuidv4(),
        x: 50,
        y: 50,
        width: 80,
        height: 80,
        type: "image" as const,
        src,
      };
      setSymbols((prev) => [...prev, symbol]);
      const blob = await (await fetch(src)).blob();
      await addOnUISdk.app.document.addImage(blob);
    };
    reader.readAsDataURL(file);
  };

  const handleAddFavorite = async (id: string) => {
    const item = symbols.find((s) => s.id === id);
    if (!item || favorites.some((f) => f.id === id)) return;
    const fav = { ...item, favorite: true, tag: newTag.trim() || "Untagged" };
    const updated = [...favorites, fav];
    setFavorites(updated);
    await addOnUISdk.instance.clientStorage.setItem("favorites", updated);
    setNewTag(""); // clear input
  };

  const handleRemoveFavorite = async (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    await addOnUISdk.instance.clientStorage.setItem("favorites", updated);
  };

  const handleInsertFavorite = async (fav: SymbolType) => {
    const newSymbol = { ...fav, id: uuidv4(), x: fav.x + 20, y: fav.y + 20, favorite: false };
    setSymbols((prev) => [...prev, newSymbol]);

    if (fav.type === "image" && fav.src) {
      const blob = await (await fetch(fav.src)).blob();
      await addOnUISdk.app.document.addImage(blob);
    } else {
      let svg = "";
      if (fav.type === "rect")
        svg = `<rect width="${fav.width}" height="${fav.height}" fill="#90caf9" stroke="#333" stroke-width="2" />`;
      else if (fav.type === "circle")
        svg = `<circle cx="${fav.width / 2}" cy="${fav.height / 2}" r="${fav.width / 2 - 2}" fill="#a5d6a7" stroke="#333" stroke-width="2" />`;
      else if (fav.type === "polygon")
        svg = `<polygon points="50,10 90,90 10,90" fill="#ffcc80" stroke="#333" stroke-width="2" />`;

      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${fav.width}" height="${fav.height}">${svg}</svg>`;
      const blob = await svgToPngBlob(fullSvg, fav.width, fav.height);
      await addOnUISdk.app.document.addImage(blob);
    }
  };

  const loadFavorites = async () => {
    const stored = (await addOnUISdk.instance.clientStorage.getItem("favorites")) as SymbolType[] | undefined;
    if (stored) setFavorites(stored);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const filteredFavorites = tagFilter === "All" ? favorites : favorites.filter((f) => f.tag === tagFilter);
  const uniqueTags = useMemo(() => Array.from(new Set(favorites.map((f) => f.tag ?? "Untagged"))), [favorites]);

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        {/* Toolbar */}
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

        {/* Canvas */}
        <Canvas
          symbols={symbols}
          setSymbols={setSymbols}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onAddFavorite={handleAddFavorite}
          selectMode={selectMode}
        />

        {/* Tag input and Add to Favorites */}
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
            <Button variant="primary" onClick={() => handleAddFavorite(selectedId!)}>
              ⭐ Add to Favorites
            </Button>
          </div>
        )}

        {/* Favorites */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h4>Favorites</h4>
            <Button size="s" variant={editFavorites ? "primary" : "secondary"} onClick={() => setEditFavorites(!editFavorites)}>
              {editFavorites ? "Done" : "Edit"}
            </Button>
            <select title="Filter Favorites" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
              <option value="All">All</option>
              {uniqueTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {filteredFavorites.map((fav) => (
              <div key={fav.id} style={{ border: "1px solid #ccc", padding: 4, position: "relative" }}>
                <div onClick={() => handleInsertFavorite(fav)} style={{ cursor: "pointer" }}>
                  {fav.type === "rect" ? (
                    <svg width={30} height={20}><rect x={2} y={2} width={26} height={16} fill="gold" stroke="#333" /></svg>
                  ) : fav.type === "circle" ? (
                    <svg width={30} height={30}><circle cx={15} cy={15} r={13} fill="gold" stroke="#333" /></svg>
                  ) : fav.type === "polygon" ? (
                    <svg width={30} height={30}><polygon points="15,2 28,28 2,28" fill="gold" stroke="#333" /></svg>
                  ) : fav.type === "image" && fav.src ? (
                    <img src={fav.src} alt="fav" width={30} height={20} style={{ objectFit: "cover" }} />
                  ) : null}
                </div>
                {editFavorites && (
                  <div style={{ position: "absolute", top: -8, right: -8 }}>
                    <Button variant="secondary" size="s" onClick={() => handleRemoveFavorite(fav.id)}>−</Button>
                  </div>
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
