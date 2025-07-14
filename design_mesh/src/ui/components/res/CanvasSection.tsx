import React from "react";
import Canvas, { SymbolType } from "../Canvas";

type CanvasSectionProps = {
  symbols: SymbolType[];
  setSymbols: React.Dispatch<React.SetStateAction<SymbolType[]>>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  onAddFavorite: (id: string) => void;
  selectMode: boolean;
};

const CanvasSection: React.FC<CanvasSectionProps> = ({
  symbols,
  setSymbols,
  selectedId,
  setSelectedId,
  onAddFavorite,
  selectMode,
}) => (
  <details className="mt-12 border border-gray-300 rounded-lg shadow-sm">
    <summary className="cursor-pointer p-2 bg-gray-100 rounded-t-lg">Canvas</summary>
    <div className="p-4">
      <Canvas
        symbols={symbols}
        setSymbols={setSymbols}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        onAddFavorite={onAddFavorite}
        selectMode={selectMode}
      />
    </div>
  </details>
);

export default CanvasSection;