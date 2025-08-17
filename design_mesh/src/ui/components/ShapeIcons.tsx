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
  // Curve-specific properties
  curveData?: any; // BezierPath or BezierCurve data
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
  strokeWidth,
  curveData
}) => {
  const config = SIZE_CONFIG[size];
  const svgSize = width || height || config.svg.width;
  
  // Use provided colors or fallback to defaults (curves don't have fill)
  const curveStroke = stroke || SHAPE_COLORS.CURVE;
  const curveStrokeWidth = strokeWidth || config.curve.strokeWidth;
  
  // If we have actual curve data, use it; otherwise use the default icon path
  let pathData = config.curve.d; // Default fallback
  
  if (curveData) {
    // Check if it's new multi-node format or legacy format
    if ('nodes' in curveData && Array.isArray(curveData.nodes)) {
      // New multi-node BezierPath format - generate path data
      const path = curveData;
      if (path.nodes.length >= 2) {
        // Calculate bounds of the curve to scale it properly
        const allPoints: any[] = [];
        path.nodes.forEach((node: any) => {
          allPoints.push(node.point);
          if (node.leftHandle) allPoints.push(node.leftHandle);
          if (node.rightHandle) allPoints.push(node.rightHandle);
        });
        
        const minX = Math.min(...allPoints.map(p => p.x));
        const maxX = Math.max(...allPoints.map(p => p.x));
        const minY = Math.min(...allPoints.map(p => p.y));
        const maxY = Math.max(...allPoints.map(p => p.y));
        
        const width = maxX - minX;
        const height = maxY - minY;
        const scaleX = (svgSize * 0.8) / width; // Use 80% of available space
        const scaleY = (svgSize * 0.8) / height;
        const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
        
        const offsetX = (svgSize - width * scale) / 2 - minX * scale;
        const offsetY = (svgSize - height * scale) / 2 - minY * scale;
        
        const firstNode = path.nodes[0];
        const scaledFirstX = firstNode.point.x * scale + offsetX;
        const scaledFirstY = firstNode.point.y * scale + offsetY;
        pathData = `M ${scaledFirstX},${scaledFirstY}`;
        
        // Add curve segments
        for (let i = 0; i < path.nodes.length - 1; i++) {
          const currentNode = path.nodes[i];
          const nextNode = path.nodes[i + 1];
          
          const cp1 = currentNode.rightHandle || currentNode.point;
          const cp2 = nextNode.leftHandle || nextNode.point;
          
          const scaledCp1X = cp1.x * scale + offsetX;
          const scaledCp1Y = cp1.y * scale + offsetY;
          const scaledCp2X = cp2.x * scale + offsetX;
          const scaledCp2Y = cp2.y * scale + offsetY;
          const scaledNextX = nextNode.point.x * scale + offsetX;
          const scaledNextY = nextNode.point.y * scale + offsetY;
          
          pathData += ` C ${scaledCp1X},${scaledCp1Y} ${scaledCp2X},${scaledCp2Y} ${scaledNextX},${scaledNextY}`;
        }
      }
    } else {
      // Legacy single curve format
      const curve = curveData;
      if (curve.start && curve.end && curve.cp1 && curve.cp2) {
        const allPoints = [curve.start, curve.cp1, curve.cp2, curve.end];
        const minX = Math.min(...allPoints.map(p => p.x));
        const maxX = Math.max(...allPoints.map(p => p.x));
        const minY = Math.min(...allPoints.map(p => p.y));
        const maxY = Math.max(...allPoints.map(p => p.y));
        
        const width = maxX - minX;
        const height = maxY - minY;
        const scaleX = (svgSize * 0.8) / width;
        const scaleY = (svgSize * 0.8) / height;
        const scale = Math.min(scaleX, scaleY);
        
        const offsetX = (svgSize - width * scale) / 2 - minX * scale;
        const offsetY = (svgSize - height * scale) / 2 - minY * scale;
        
        pathData = `M ${curve.start.x * scale + offsetX},${curve.start.y * scale + offsetY} C ${curve.cp1.x * scale + offsetX},${curve.cp1.y * scale + offsetY} ${curve.cp2.x * scale + offsetX},${curve.cp2.y * scale + offsetY} ${curve.end.x * scale + offsetX},${curve.end.y * scale + offsetY}`;
      }
    }
  }
  
  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
      <path 
        d={pathData} 
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
