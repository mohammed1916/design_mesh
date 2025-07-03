import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useEffect, useRef } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import Canvas, { SymbolType } from "./Canvas";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  const [symbols, setSymbols] = React.useState<SymbolType[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectMode, setSelectMode] = React.useState(false);
  const [favorites, setFavorites] = React.useState<SymbolType[]>([]);
  const dragRef = useRef<HTMLDivElement>(null);

  // 🔄 Load favorites on start
  useEffect(() => {
    (async () => {
      const stored = await addOnUISdk.instance.clientStorage.getItem("favorites");
      if (stored) setFavorites(stored as SymbolType[]);
    })();
  }, []);

  // 🔒 Save favorites when updated
  useEffect(() => {
    addOnUISdk.instance.clientStorage.setItem("favorites", favorites);
  }, [favorites]);

  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => resolve(blob!), "image/png");
      };
      img.src = "data:image/svg+xml;base64," + btoa(svg);
    });
  }

  async function handleInsertRect() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60">
      <rect width="100" height="60" fill="#90caf9" stroke="#333" stroke-width="2"/>
    </svg>`;
    const blob = await svgToPngBlob(svg, 100, 60);
    await addOnUISdk.app.document.addImage(blob);
  }

  async function handleInsertCircle() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <circle cx="40" cy="40" r="38" fill="#a5d6a7" stroke="#333" stroke-width="2"/>
    </svg>`;
    const blob = await svgToPngBlob(svg, 80, 80);
    await addOnUISdk.app.document.addImage(blob);
  }

  async function handleInsertPolygon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polygon points="50,10 90,90 10,90" fill="#ffcc80" stroke="#333" stroke-width="2"/>
    </svg>`;
    const blob = await svgToPngBlob(svg, 100, 100);
    await addOnUISdk.app.document.addImage(blob);
  }

  useEffect(() => {
    if (!dragRef.current) return;

    addOnUISdk.app.enableDragToDocument(dragRef.current, {
      previewCallback: () => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60">
          <rect width="100" height="60" fill="#90caf9" stroke="#333" stroke-width="2"/>
        </svg>`;
        return new URL("data:image/svg+xml;base64," + btoa(svg));
      },
      completionCallback: async () => {
        const blob = await svgToPngBlob(
          `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60">
            <rect width="100" height="60" fill="#90caf9" stroke="#333" stroke-width="2"/>
          </svg>`,
          100,
          60
        );
        return [{ blob }];
      }
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const src = ev.target?.result as string;
      const symbol: SymbolType = {
        id: uuidv4(), x: 50, y: 50, width: 80, height: 80, type: "image", src
      };
      setSymbols(prev => [...prev, symbol]);
      const blob = await (await fetch(src)).blob();
      await addOnUISdk.app.document.addImage(blob);
    };
    reader.readAsDataURL(file);
  };

    const handleAddFavorite = (id: string) => {
    const updatedSymbol = symbols.find((s) => s.id === id);
    if (!updatedSymbol) return;

    const isAlreadyFavorite = updatedSymbol.favorite;
    const updatedFavorites = isAlreadyFavorite
        ? favorites.filter((f) => f.id !== id)
        : [...favorites, { ...updatedSymbol, favorite: true }];

    setFavorites(updatedFavorites);
    };


  const handleInsertFavorite = async (fav: SymbolType) => {
    const newSym = { ...fav, id: uuidv4(), x: fav.x + 20, y: fav.y + 20, favorite: false };
    setSymbols(prev => [...prev, newSym]);

    if (fav.type === "rect") {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${fav.width}" height="${fav.height}">
        <rect width="${fav.width}" height="${fav.height}" fill="#90caf9" stroke="#333" stroke-width="2"/>
      </svg>`;
      const blob = await svgToPngBlob(svg, fav.width, fav.height);
      await addOnUISdk.app.document.addImage(blob);
    } else if (fav.type === "image" && fav.src) {
      const blob = await (await fetch(fav.src)).blob();
      await addOnUISdk.app.document.addImage(blob);
    }
  };

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div onClick={handleInsertRect} title="Insert Rectangle" style={{ cursor: "pointer" }}>
              <svg width={40} height={40}><rect x={5} y={10} width={30} height={20} fill="#90caf9" stroke="#333" /></svg>
            </div>
            <div onClick={handleInsertCircle} title="Insert Circle" style={{ cursor: "pointer" }}>
              <svg width={40} height={40}><circle cx={20} cy={20} r={12} fill="#a5d6a7" stroke="#333" /></svg>
            </div>
            <div onClick={handleInsertPolygon} title="Insert Polygon" style={{ cursor: "pointer" }}>
              <svg width={40} height={40}><polygon points="20,5 35,35 5,35" fill="#ffcc80" stroke="#333" /></svg>
            </div>
          </div>

          <label>
            <Button size="m">Upload Symbol</Button>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
          </label>

          <Button size="m" variant={selectMode ? "primary" : "secondary"} onClick={() => setSelectMode(m => !m)}>
            {selectMode ? "Select Mode: ON" : "Select Mode: OFF"}
          </Button>
        </div>

        <Canvas
          symbols={symbols}
          setSymbols={setSymbols}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onAddFavorite={handleAddFavorite}
          selectMode={selectMode}
        />

        <div style={{ marginTop: 16 }}>
          <h4>Favorites (saved across sessions)</h4>
          <div style={{ display: "flex", gap: 8 }}>
            {favorites.map(fav => (
              <div key={fav.id} style={{ border: "1px solid #ccc", padding: 4, cursor: "pointer" }} onClick={() => handleInsertFavorite(fav)}>
                {fav.type === "rect" ? (
                  <svg width={30} height={20}><rect x={2} y={2} width={26} height={16} fill="gold" stroke="#333" /></svg>
                ) : fav.type === "image" && fav.src ? (
                  <img src={fav.src} alt="fav" width={30} height={20} style={{ objectFit: "cover" }} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Theme>
  );
};

export default App;
