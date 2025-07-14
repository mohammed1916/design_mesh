import React, { useState } from "react";
import { motion } from "framer-motion";
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
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-12 border border-gray-300 rounded-xl shadow-sm">
<button
  onClick={() => setOpen(!open)}
  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 p-4 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
  style={{ cursor: "pointer", userSelect: "none" }}
>
  <span className="text-xl leading-none">
    {open ? "🎯" : "🎨"}
  </span>
  <span>Symbols</span>
</button>




      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="p-4 bg-white rounded-b-xl border-t">
            <Canvas
              symbols={symbols}
              setSymbols={setSymbols}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onAddFavorite={onAddFavorite}
              selectMode={selectMode}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CanvasSection;
