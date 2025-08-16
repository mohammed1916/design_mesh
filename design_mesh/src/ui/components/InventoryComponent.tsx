import React from "react";
import { Button } from "@swc-react/button";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { SymbolType } from "./res/CanvasSection";

interface InventoryProps {
  isOpen: boolean;
  onToggle: () => void;
  inventory: (SymbolType & { tag?: string; isDefault?: boolean })[];
  filteredInventory: (SymbolType & { tag?: string; isDefault?: boolean })[];
  editInventory: boolean;
  selectedIds: string[];
  newTag: string;
  tagOptions: { value: string; label: string }[];
  tagFilterValue: { value: string; label: string }[];
  onSetEditInventory: (edit: boolean) => void;
  onSetSelectedIds: (ids: string[]) => void;
  onSetNewTag: (tag: string) => void;
  onSetTagFilter: (tags: string[]) => void;
  onAddTag: (uuids: string[], tag: string) => void;
  onRemoveInventory: (inventoryId: string) => void;
  onInsertFromInventory: (inv: SymbolType) => void;
  inventoryRef: React.RefObject<HTMLDivElement>;
}

const InventoryComponent: React.FC<InventoryProps> = ({
  isOpen,
  onToggle,
  inventory,
  filteredInventory,
  editInventory,
  selectedIds,
  newTag,
  tagOptions,
  tagFilterValue,
  onSetEditInventory,
  onSetSelectedIds,
  onSetNewTag,
  onSetTagFilter,
  onAddTag,
  onRemoveInventory,
  onInsertFromInventory,
  inventoryRef,
}) => {
  const uniqueTags = tagOptions.length > 0;

  return (
    <div className="border border-gray-300 rounded-xl shadow-sm mt-24">
      <Button
        size="m"
        variant="secondary"
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-xl bg-gray-100 p-4 font-medium text-gray-700 hover:bg-gray-200 transition-colors w-full !justify-start"
      >
        <span className="text-xl leading-none">{isOpen ? "▼ " : "▶ "}</span>
        <span>Inventory</span>
      </Button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white rounded-b-xl border-t">
              <div className="inventory-controls-panel">
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  {inventory.length >= 3 && (
                    <Button
                      size="s"
                      variant={editInventory ? "primary" : "secondary"}
                      onClick={() => onSetEditInventory(!editInventory)}
                      className={`inventory-edit-btn${editInventory ? " editing" : ""}`}
                    >
                      {editInventory ? "Done" : "Edit"}
                    </Button>
                  )}
                </div>
              </div>
              
              {editInventory && selectedIds.length > 0 && (
                <div className="inventory-edit-row">
                  <input
                    placeholder="Enter tag for selected symbol(s)"
                    value={newTag}
                    onChange={(e) => onSetNewTag(e.target.value)}
                    className="inventory-input"
                  />
                  <Button variant="primary" onClick={() => onAddTag(selectedIds, newTag)}>
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
                    ) : inv.type === "curve" ? (
                      <svg width={30} height={30}>
                        <path d="M2,15 Q15,2 28,15" fill="none" stroke="#ef9a9a" strokeWidth={2} />
                      </svg>
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
                          onSetSelectedIds(updated);
                        }}
                        className={`select-inventory-btn-modern${selectedIds.includes(inv.uuid) ? " selected" : ""}`}
                        aria-label="Select inventory item"
                      >
                        ✓
                      </button>
                    )}
                    
                    {/* Remove button in edit mode */}
                    {editInventory && !inv.isDefault && (
                      <button 
                        type="button" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onRemoveInventory(inv.inventoryId); 
                        }} 
                        className="remove-inventory-btn-modern" 
                        aria-label="Remove from inventory"
                      >
                        ×
                      </button>
                    )}
                    
                    {/* Only allow add to document when not in edit mode */}
                    {!editInventory && (
                      <div
                        className="inventory-card-overlay"
                        onClick={() => onInsertFromInventory(inv)}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Tag filter */}
              {uniqueTags && (
                <div>
                  <div className="mt-4">
                    &nbsp;
                  </div>
                  <div className="tag-filter">
                    <Select
                      isMulti
                      options={tagOptions}
                      value={tagFilterValue}
                      onChange={(selected) => {
                        const values = selected.map((s) => s.value);
                        onSetTagFilter(values);
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
      <div ref={inventoryRef} className="inventory-hidden" />
    </div>
  );
};

export default InventoryComponent;
