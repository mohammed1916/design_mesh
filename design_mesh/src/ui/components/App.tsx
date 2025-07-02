// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import Canvas, { SymbolType } from "./Canvas";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    const [symbols, setSymbols] = React.useState<SymbolType[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [selectMode, setSelectMode] = React.useState(false);
    const [favorites, setFavorites] = React.useState<SymbolType[]>([]);

    // Save current diagram (as JSON)
    const handleSave = () => {
        const data = JSON.stringify(symbols);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "diagram.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Upload symbol (image)
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setSymbols((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    x: 50,
                    y: 50,
                    width: 80,
                    height: 80,
                    type: "image",
                    src: ev.target?.result as string,
                },
            ]);
        };
        reader.readAsDataURL(file);
    };

    // Add to favorites
    const handleAddFavorite = (id: string) => {
        setSymbols((prev) =>
            prev.map((s) =>
                s.id === id ? { ...s, favorite: true } : s
            )
        );
        const fav = symbols.find((s) => s.id === id);
        if (fav && !favorites.some((f) => f.id === id)) {
            setFavorites((prev) => [...prev, { ...fav, favorite: true }]);
        }
    };

    // Insert favorite symbol
    const handleInsertFavorite = (fav: SymbolType) => {
        setSymbols((prev) => [
            ...prev,
            { ...fav, id: uuidv4(), x: fav.x + 20, y: fav.y + 20, favorite: false },
        ]);
    };

    // Add rectangle (for demo)
    function handleCreateRect() {
        setSymbols((prev) => [
            ...prev,
            {
                id: uuidv4(),
                x: 100,
                y: 100,
                width: 100,
                height: 60,
                type: "rect",
            },
        ]);
    }

    // Add a simple uuid generator
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    return (
        <Theme system="express" scale="medium" color="light">
            <div className="container">
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <Button size="m" onClick={handleCreateRect}>Add Rectangle</Button>
                    <Button size="m" onClick={handleSave}>Save</Button>
                    <label style={{ display: "inline-block" }}>
                        <span style={{ display: "inline-block" }}>
                            <Button size="m">Upload Symbol</Button>
                        </span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
                    </label>
                    <Button size="m" variant={selectMode ? "primary" : "secondary"} onClick={() => setSelectMode((m) => !m)}>
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
                    <h4>Favorites</h4>
                    <div style={{ display: "flex", gap: 8 }}>
                        {favorites.map((fav) => (
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
