import { useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/appStore";
import { 
  setInventory, 
  setSymbols, 
  setNewTag, 
  setToast,
  addSymbol
} from "../store/appStore";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DEFAULT_INVENTORY } from "../constants/inventory";
import { SymbolType } from "../components/res/CanvasSection";
import { v4 as uuidv4 } from "uuid";

export const useInventoryLogic = (addOnSDKAPI: AddOnSDKAPI) => {
  const dispatch = useDispatch();
  const { inventory, symbols, newTag } = useSelector((state: RootState) => state.app);

  // Load inventory: ensure default shapes always present
  const loadInventory = useCallback(async () => {
    const stored = (await addOnSDKAPI.instance.clientStorage.getItem("inventory")) as
      | (SymbolType & { tag?: string; isDefault?: boolean })[]
      | undefined;
    let merged: (SymbolType & { tag?: string; isDefault?: boolean })[] = DEFAULT_INVENTORY;
    if (stored) {
      const nonDefault = stored.filter((i) => !DEFAULT_INVENTORY.some((d) => d.inventoryId === i.inventoryId));
      merged = [...DEFAULT_INVENTORY, ...nonDefault];
    }
    dispatch(setInventory(merged));
    // Note: We'll handle symbol inventory flags separately to avoid circular dependencies
  }, [addOnSDKAPI, dispatch]);

  // Add to inventory by inventoryId
  const handleAddInventory = useCallback(async (uuid: string) => {
    const item = symbols.find((s) => s.uuid === uuid);
    if (!item || inventory.some((f) => f.inventoryId === item.inventoryId)) return;
    const inv = { ...item, inventory: true, tag: newTag.trim() || "Untagged" };
    const updatedInventory = [...inventory, inv];
    dispatch(setInventory(updatedInventory));
    
    // Update symbols with inventory flag
    dispatch(setSymbols(symbols.map((s) =>
      s.inventoryId === item.inventoryId ? { ...s, inventory: true } : s
    )));
    
    await addOnSDKAPI.instance.clientStorage.setItem("inventory", updatedInventory);
    dispatch(setNewTag(""));
  }, [symbols, inventory, newTag, dispatch, addOnSDKAPI]);

  // Remove from inventory by inventoryId
  const handleRemoveInventory = useCallback(async (inventoryId: string) => {
    if (DEFAULT_INVENTORY.some((d) => d.inventoryId === inventoryId)) return;
    const updated = inventory.filter((f) => f.inventoryId !== inventoryId);
    dispatch(setInventory(updated));
    
    // Update symbols with inventory flag
    dispatch(setSymbols(symbols.map((s) =>
      s.inventoryId === inventoryId ? { ...s, inventory: false } : s
    )));
    
    await addOnSDKAPI.instance.clientStorage.setItem("inventory", updated);
  }, [inventory, symbols, dispatch, addOnSDKAPI]);

  // Add new handler for tagging inventory
  const handleAddTag = useCallback(async (uuids: string[], tag: string) => {
    if (!tag.trim()) return;
    const updatedInventory = inventory.map((item) =>
      uuids.includes(item.uuid) ? { ...item, tag: tag.trim() } : item
    );
    dispatch(setInventory(updatedInventory));
    dispatch(setNewTag(""));
    await addOnSDKAPI.instance.clientStorage.setItem("inventory", updatedInventory);
    dispatch(setToast(`Tag '${tag.trim()}' added to selected item(s).`));
    setTimeout(() => dispatch(setToast(null)), 2000);
  }, [inventory, dispatch, addOnSDKAPI]);

  // Insert from inventory: always add a new symbol to the grid (canvas)
  const handleInsertFromInventory = useCallback(async (inv: SymbolType) => {
    const newSymbol = {
      ...inv,
      uuid: uuidv4(),
      // Optionally reset position if you want
    };
    dispatch(addSymbol(newSymbol));
    // Return the symbol so parent can handle document insertion
    return newSymbol;
  }, [dispatch]);

  useEffect(() => {
    loadInventory();
  }, []); // Only run once on mount to prevent infinite loops

  const uniqueTags = useMemo(() => 
    Array.from(new Set(inventory.map((f) => String(f.tag ?? "Untagged")))), 
    [inventory]
  );
  
  const tagOptions = useMemo(() => 
    uniqueTags.map((tag) => ({ value: tag, label: tag })), 
    [uniqueTags]
  );

  return {
    handleAddInventory,
    handleRemoveInventory,
    handleAddTag,
    handleInsertFromInventory,
    uniqueTags,
    tagOptions,
  };
};
