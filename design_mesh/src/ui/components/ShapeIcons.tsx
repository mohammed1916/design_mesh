import React from 'react';
import { SHAPE_COLORS } from '../constants/inventory';

interface ShapeIconProps {
  size?: 'small' | 'large';
  width?: number;
  height?: number;
  // Extended properties for dynamic styling
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    rect: { width: 26, height: 16, x: 2, y: 2, rx: 0 },
    circle: { cx: 15, cy: 15, r: 13 },
    polygon: { points: "15,2 28,28 2,28" },
    curve: { d: "M2,15 Q15,2 28,15", strokeWidth: 2 },
    clock: { cx: 15, cy: 15, r: 13 },
    svg: { width: 30, height: 30 }
  },
  large: {
    rect: { width: 60, height: 40, x: 10, y: 20, rx: 12 },
    circle: { cx: 40, cy: 40, r: 28 },
    polygon: { points: "40,10 70,70 10,70" },
    curve: { d: "M 10 40 Q 40,10 70,40", strokeWidth: 3 },
    clock: { cx: 40, cy: 40, r: 28 },
    svg: { width: 80, height: 80 }
  }
};

// Single source of truth - unified shape components with built-in SVG wrapper
export const RectIcon: React.FC<ShapeIconProps> = ({ 
  size = 'large',
  width,
  height,
  fill,
  stroke,
  strokeWidth,
  cornerRadius
}) => {
  const config = SIZE_CONFIG[size];
  const svgWidth = width || (size === 'small' ? 30 : 80);
  const svgHeight = height || (size === 'small' ? 20 : 80);
  
  // Use provided colors or fallback to defaults
  const rectFill = fill || SHAPE_COLORS.RECT;
  const rectStroke = stroke || SHAPE_COLORS.STROKE;
  const rectStrokeWidth = strokeWidth || 2;
  const rectCornerRadius = cornerRadius !== undefined ? cornerRadius : config.rect.rx;
  
  return (
    <svg width={svgWidth} height={svgHeight}>
      <rect 
        x={config.rect.x} 
        y={config.rect.y} 
        width={config.rect.width} 
        height={config.rect.height} 
        fill={rectFill} 
        stroke={rectStroke} 
        strokeWidth={rectStrokeWidth} 
        rx={rectCornerRadius} 
      />
    </svg>
  );
};

export const CircleIcon: React.FC<ShapeIconProps> = ({ 
  size = 'large',
  width,
  height,
  fill,
  stroke,
  strokeWidth
}) => {
  const config = SIZE_CONFIG[size];
  const svgSize = width || height || config.svg.width;
  
  // Use provided colors or fallback to defaults
  const circleFill = fill || SHAPE_COLORS.CIRCLE;
  const circleStroke = stroke || SHAPE_COLORS.STROKE;
  const circleStrokeWidth = strokeWidth || 2;
  
  return (
    <svg width={svgSize} height={svgSize}>
      <circle 
        cx={config.circle.cx} 
        cy={config.circle.cy} 
        r={config.circle.r} 
        fill={circleFill} 
        stroke={circleStroke} 
        strokeWidth={circleStrokeWidth} 
      />
    </svg>
  );
};

export const PolygonIcon: React.FC<ShapeIconProps> = ({ 
  size = 'large',
  width,
  height,
  fill,
  stroke,
  strokeWidth
}) => {
  const config = SIZE_CONFIG[size];
  const svgSize = width || height || config.svg.width;
  
  // Use provided colors or fallback to defaults
  const polygonFill = fill || SHAPE_COLORS.POLYGON;
  const polygonStroke = stroke || SHAPE_COLORS.STROKE;
  const polygonStrokeWidth = strokeWidth || 2;
  
  return (
    <svg width={svgSize} height={svgSize}>
      <polygon 
        points={config.polygon.points} 
        fill={polygonFill} 
        stroke={polygonStroke} 
        strokeWidth={polygonStrokeWidth} 
      />
    </svg>
  );
};

export const CurveIcon: React.FC<ShapeIconProps> = ({ 
  size = 'large',
  width,
  height,
  stroke,
  strokeWidth
}) => {
  const config = SIZE_CONFIG[size];
  const svgSize = width || height || config.svg.width;
  
  // Use provided colors or fallback to defaults (curves don't have fill)
  const curveStroke = stroke || SHAPE_COLORS.CURVE;
  const curveStrokeWidth = strokeWidth || config.curve.strokeWidth;
  
  return (
    <svg width={svgSize} height={svgSize}>
      <path 
        d={config.curve.d} 
        fill="none" 
        stroke={curveStroke} 
        strokeWidth={curveStrokeWidth} 
      />
    </svg>
  );
};

export const ClockIcon: React.FC<ShapeIconProps> = ({ 
  size = 'large',
  width,
  height
}) => {
  const config = SIZE_CONFIG[size];
  const svgSize = width || height || config.svg.width;
  const finalCx = config.clock.cx;
  const finalCy = config.clock.cy;
  const finalR = config.clock.r;
  
  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${config.svg.width} ${config.svg.height}`}>
      <circle 
        cx={finalCx} 
        cy={finalCy} 
        r={finalR} 
        fill={SHAPE_COLORS.CLOCK} 
        stroke={SHAPE_COLORS.STROKE} 
        strokeWidth={2} 
      />
      <path 
        d={`M${finalCx} ${finalCy - (finalR - 6)} v${finalR - 6} l${Math.round(finalR * 0.5)} ${Math.round(finalR * 0.5)}`} 
        stroke={SHAPE_COLORS.STROKE} 
        strokeWidth="3" 
        fill="none" 
      />
    </svg>
  );
};
