import { SymbolType } from "../components/res/CanvasSection";

// Default inventory shapes (rect, circle, polygon)
export const DEFAULT_INVENTORY: (SymbolType & { tag?: string; isDefault?: boolean })[] = [
  {
    uuid: "default-rect-uuid",
    inventoryId: "default-rect",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    type: "rect",
    inventory: true,
    tag: "Basic",
    isDefault: true,
  },
  {
    uuid: "default-circle-uuid",
    inventoryId: "default-circle",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    type: "circle",
    inventory: true,
    tag: "Basic",
    isDefault: true,
  },
  {
    uuid: "default-polygon-uuid",
    inventoryId: "default-polygon",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    type: "polygon",
    inventory: true,
    tag: "Basic",
    isDefault: true,
  },
  {
    uuid: "default-curve-uuid",
    inventoryId: "default-curve",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    type: "curve",
    inventory: true,
    tag: "Basic",
    isDefault: true,
  },
];

export interface SvgConversionParams {
  format: 'png' | 'jpeg';
  maintainAspectRatio: boolean;
}

// Default conversion parameters
export const defaultConversionParams: SvgConversionParams = {
  maintainAspectRatio: true,
  format: 'png'
};
