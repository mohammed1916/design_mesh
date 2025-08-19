import { createSlice, configureStore } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { SymbolType } from "../components/res/CanvasSection";
import { DEFAULT_INVENTORY } from "../constants/inventory";

// Re-export SymbolType for convenience
export type { SymbolType } from "../components/res/CanvasSection";

// Redux slice for symbols, inventory, tags, toast, selection
const initialState = {
  symbols: [
    {
      uuid: uuidv4(),
      inventoryId: "default-history-icon",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      type: "historyIcon"
    }
  ] as SymbolType[],
  inventory: DEFAULT_INVENTORY as (SymbolType & { tag?: string; isDefault?: boolean })[],
  selectedIds: [] as string[],
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
    updateSymbol(state, action) {
      const index = state.symbols.findIndex(symbol => symbol.uuid === action.payload.uuid);
      if (index !== -1) {
        state.symbols[index] = action.payload;
      }
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
    setSelectedIds(state, action) {
      state.selectedIds = action.payload;
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
          uuid: uuidv4(),
          inventoryId: "default-history-icon",
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          type: "historyIcon"
        }
      ];
    },
    refreshInventory(state, action) {
      state.inventory = action.payload;
    },
  },
});

export const store = configureStore({ reducer: { app: appSlice.reducer } });

export const {
  setSymbols,
  addSymbol,
  updateSymbol,
  setInventory,
  addInventory,
  removeInventory,
  setSelectedIds,
  setEditInventory,
  setNewTag,
  setTagFilter,
  setToast,
  clearSymbols,
  refreshInventory,
} = appSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
