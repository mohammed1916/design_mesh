import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import { Theme } from "@swc-react/theme";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import CanvasSection, { SymbolType } from "./res/CanvasSection";
import { useSelector, useDispatch } from "react-redux";
import "./App.css";
import "../styles/themes.css";
import 'tippy.js/dist/tippy.css';
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ParticleEffect } from "./ParticleEffect";
import { RootState, store } from "../store/appStore";
import { 
  setSymbols, 
  clearSymbols, 
  setToast, 
  setSelectedIds,
  setEditInventory,
  setNewTag,
  setTagFilter
} from "../store/appStore";
import { SvgConversionParams } from "../constants/inventory";
import { useInventoryLogic } from "../hooks/useInventoryLogic";
import { useShapeAndUploadLogic } from "../hooks/useShapeAndUploadLogic";
import ShapeControls from "./ShapeControls";
import SvgConversionModal from "./SvgConversionModal";
import InventoryComponent from "./InventoryComponent";
import StableDiffusionPanel from "./StableDiffusionPanel";
import "./StableDiffusionPanel.css";

const App = ({ addOnSDKAPI, sandboxProxy }: { addOnSDKAPI: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  return (
    <ThemeProvider>
      <AppContent addOnSDKAPI={addOnSDKAPI} sandboxProxy={sandboxProxy} />
    </ThemeProvider>
  );
};

const AppContent = ({ addOnSDKAPI, sandboxProxy }: { addOnSDKAPI: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const appState = useSelector((state: RootState) => state.app);
  const symbols = Array.isArray(appState.symbols) ? appState.symbols : [];
  const {
    inventory,
    selectedIds,
    editInventory,
    newTag,
    tagFilter,
    toast,
  } = appState;

  // SVG conversion state
  const [svgConversionData, setSvgConversionData] = useState<{ file: File; reader: FileReader; params: SvgConversionParams } | null>(null);
  const [svgConverting, setSvgConverting] = useState(false);

  // Inventory state
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const prevInventoryLength = useRef(inventory.length);

  // Stable Diffusion state
  const [stableDiffusionOpen, setStableDiffusionOpen] = useState(false);

  // Custom hooks
  const {
    handleAddInventory,
    handleRemoveInventory,
    handleAddTag,
    handleInsertFromInventory,
    uniqueTags,
    tagOptions,
  } = useInventoryLogic(addOnSDKAPI);

  const {
    handleInsertShape,
    handleUpload,
    handleSvgConversion,
    insertSymbolToDocument,
  } = useShapeAndUploadLogic(addOnSDKAPI, setSvgConversionData, sandboxProxy);

  // Helper: get inventoryId from uuid
  const getInventoryIdByUuid = (uuid: string) => {
    const found = symbols.find((s) => s.uuid === uuid) || inventory.find((s) => s.uuid === uuid);
    return found?.inventoryId || uuid;
  };

  // Insert from inventory with document insertion
  const handleInsertFromInventoryWithDocument = async (inv: SymbolType) => {
    const newSymbol = await handleInsertFromInventory(inv);
    await insertSymbolToDocument(newSymbol);
  };

  // Wrapper for setSymbols to support both value and updater function (for CanvasSection compatibility)
  const setSymbolsWrapper = useCallback((updater: SymbolType[] | ((prev: SymbolType[]) => SymbolType[])) => {
    if (typeof updater === "function") {
      // Use the current state from Redux store instead of closure
      const current = (store.getState() as any).app.symbols;
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
  }, [dispatch]);

  // Wrapper for setToast to always dispatch Redux action
  const setToastWrapper = (value: string | null) => {
    dispatch(setToast(value));
  };

  const filteredInventory = useMemo(() => {
    if (!Array.isArray(tagFilter) || tagFilter.length === 0) {
      return inventory;
    }
    return inventory.filter((f) => tagFilter.includes(f.tag));
  }, [inventory, tagFilter]);

  // Helper: get tag filter value for Select
  const getTagFilterValue = () => {
    if (!Array.isArray(tagFilter) || tagFilter.length === 0) {
      return [];
    }
    return tagOptions.filter((opt) => tagFilter.includes(opt.value));
  };

  // Auto-scroll effects
  useEffect(() => {
    if (inventoryOpen && inventoryRef.current) {
      inventoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [inventoryOpen]);

  useEffect(() => {
    if (
      inventoryOpen &&
      inventoryRef.current &&
      inventory.length > prevInventoryLength.current
    ) {
      inventoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevInventoryLength.current = inventory.length;
  }, [inventory.length, inventoryOpen]);

  // SVG conversion handlers
  const handleSvgConversionComplete = async (convertToPng: boolean) => {
    if (svgConversionData && convertToPng) {
      setSvgConverting(true);
      try {
        await handleSvgConversion(true, svgConversionData);
      } catch (error) {
        console.error('SVG conversion failed:', error);
      } finally {
        setSvgConverting(false);
        setSvgConversionData(null);
      }
    } else {
      setSvgConversionData(null);
    }
  };

  const handleSvgConversionParamsChange = (params: SvgConversionParams) => {
    if (svgConversionData) {
      setSvgConversionData({ ...svgConversionData, params });
    }
  };

  return (
    <Theme system="express" scale="medium" color="light">
      {/* Acrylic animated background */}
      <div
        className="acrylic-bg-gradient fixed inset-0 -z-100 pointer-events-none select-none"
        aria-hidden="true"
      />
      {/* ParticleEffect only for acrylic theme */}
      {theme === "acrylic" && <ParticleEffect />}
      <div className="adobe-addon-container theme-transition">
          {/* Header with theme switcher */}
          <div className="header-row acrylic-card-noborderradius">
            <div className="flex items-center justify-center gap-4 flex-1">
              <h2 className="shimmer floating">Design</h2>
              <h1 className="shimmer floating">Mesh</h1>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStableDiffusionOpen(!stableDiffusionOpen)}
                  className={`ai-toggle-btn ${stableDiffusionOpen ? 'active' : ''}`}
                  title="Toggle AI Image Generation Panel"
                >
                  🤖 AI
                </button>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
          <div className="container">
            {/* SVG Conversion Modal */}
            <SvgConversionModal
              isOpen={!!svgConversionData}
              params={svgConversionData?.params || { format: 'png', maintainAspectRatio: true }}
              onParamsChange={handleSvgConversionParamsChange}
              onConvert={() => handleSvgConversionComplete(true)}
              onCancel={() => !svgConverting && setSvgConversionData(null)}
              isConverting={svgConverting}
            />

            {/* Shape Controls */}
            <ShapeControls
              onInsertShape={handleInsertShape}
              onUpload={handleUpload}
            />

            {/* Canvas section */}
            <CanvasSection
              symbols={symbols}
              setSymbols={setSymbolsWrapper}
              selectedId={selectedIds.length > 0 ? selectedIds[0] : null}
              setSelectedId={(id) => dispatch(setSelectedIds(id ? [id] : []))}
              onAddInventory={handleAddInventory}
              onInsertSymbol={handleInsertFromInventoryWithDocument}
              onInsertUpdatedShape={insertSymbolToDocument}
              inventoryList={inventory.map((i) => ({ inventoryId: i.inventoryId }))}
              toast={toast}
              setToast={setToastWrapper}
            />

            {/* Inventory Component */}
            <InventoryComponent
              isOpen={inventoryOpen}
              onToggle={() => setInventoryOpen(!inventoryOpen)}
              inventory={inventory}
              filteredInventory={filteredInventory}
              editInventory={editInventory}
              selectedIds={selectedIds}
              newTag={newTag}
              tagOptions={tagOptions}
              tagFilterValue={getTagFilterValue()}
              onSetEditInventory={(edit) => dispatch(setEditInventory(edit))}
              onSetSelectedIds={(ids) => dispatch(setSelectedIds(ids))}
              onSetNewTag={(tag) => dispatch(setNewTag(tag))}
              onSetTagFilter={(tags) => dispatch(setTagFilter(tags))}
              onAddTag={handleAddTag}
              onRemoveInventory={handleRemoveInventory}
              onInsertFromInventory={handleInsertFromInventoryWithDocument}
              inventoryRef={inventoryRef}
            />

            {/* Stable Diffusion Panel - New Component */}
            <StableDiffusionPanel
              isOpen={stableDiffusionOpen}
              onToggle={() => setStableDiffusionOpen(!stableDiffusionOpen)}
            />
          </div>
        </div>
      </Theme>
  );
};

export default App;