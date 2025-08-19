// SVG utility functions

/** options for parsing source as svg/image */
export type SourceOptions = {
  type?: DOMParserSupportedType;
  trim?: boolean;
  color?: string;
};

/** convert string of absolute css units to pixels */
export const unitsToPixels = (string: string) => {
  /** unit constants https://www.w3.org/TR/css-values-3/#absolute-lengths */
  const units: Record<string, number> = {
    px: 1,
    in: 96,
    pc: 96 / 6,
    pt: 96 / 72,
    cm: 96 / 2.54,
    mm: 96 / 2.54 / 10,
    q: 96 / 2.54 / 40,
  };

  /** extract number and unit */
  const [, stringValue, unit] = string.match(/(\d+\.?\d*)\s*(\w*)/) || [];

  /** parse value as number */
  let value = Number(stringValue || 0);

  /** multiply value by unit constant */
  value *= units[(unit || "px").toLowerCase()] || 0;

  return value;
};

// Utility function to encode SVG data with UTF-8 support
export const encodeSvgToBase64 = (svgData: string): string => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(svgData);
  return btoa(String.fromCharCode(...new Uint8Array(encoded.buffer)));
};

/** convert svg source code to svg dom object */
export const sourceToSvg = async (
  source: string,
  { type = "image/svg+xml", trim = false, color = "" }: SourceOptions = {},
) => {
  /** parse source as document */
  const doc = new DOMParser().parseFromString(source, type);
  /** get svg element */
  const svg = doc.querySelector("svg");

  /** element for displaying xml parsing error */
  let error = doc.querySelector("parsererror")?.textContent || "";
  if (error) throw Error(error);

  if (!svg) throw Error("No root SVG element");

  /** trim viewBox to contents */
  if (trim) {
    /** attach svg to document to get defined bbox */
    window.document.body.append(svg);

    /** get rough bbox */
    let { x, y, width, height } = svg.getBBox();

    /** get stroke widths of all children */
    const strokeWidths = Array.from(svg.querySelectorAll("*")).map((element) =>
      parseFloat(window.getComputedStyle(element).strokeWidth || "0"),
    );

    /** expand viewBox to avoid cutting off strokes */
    const margin = Math.max(...strokeWidths) / 2;
    x -= margin;
    y -= margin;
    width += 2 * margin;
    height += 2 * margin;

    /** remove svg from document */
    window.document.body.removeChild(svg);

    /** trim svg to rough bbox */
    svg.setAttribute("viewBox", [x, y, width, height].join(" "));
  }

  /** set color */
  if (color.startsWith("~")) {
    svg.setAttribute("color", color.replace(/^~/, ""));
  }

  return svg;
};

export async function svgToBlob(
  svg: string, 
  width: number, 
  height: number, 
  format: 'png' | 'jpeg' = 'png', 
  quality: number = 1.0,
  scaleFactor: number = 1
): Promise<Blob> {
  try {
    const svgElement = await sourceToSvg(svg);
    
    // Apply scaling if specified
    const scaledWidth = width / scaleFactor;
    const scaledHeight = height / scaleFactor;
    
    // Use the scaled dimensions
    svgElement.setAttribute('width', scaledWidth.toString());
    svgElement.setAttribute('height', scaledHeight.toString());
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = scaledWidth;
          canvas.height = scaledHeight;
          const ctx = canvas.getContext("2d")!;
          
          // Fill with white background for JPEG (doesn't support transparency)
          if (format === 'jpeg') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          // Draw the image at the scaled size
          ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, `image/${format}`, quality);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load SVG image'));
      };
      
      // Create a properly formatted SVG data URL
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const encodedSvg = encodeSvgToBase64(svgString);
      img.src = "data:image/svg+xml;base64," + encodedSvg;
    });
  } catch (error) {
    console.error(`SVG to ${format.toUpperCase()} conversion error:`, error);
    throw error;
  }
}

/** Convert SVG to blob with user-defined document size (simplified approach) */
export async function svgToImageBlob(
  svgString: string,
  width: number,
  height: number,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0,
  showBoundary: boolean = false,
  expandPadding: number = 0
): Promise<{ blob: Blob; boundaryInfo: { width: number; height: number; method: string; bounds?: { minX: number; minY: number; maxX: number; maxY: number } } }> {
  try {
    const svgElement = await sourceToSvg(svgString);
    
    // Use the provided width/height as the final document size - user controls this via document size controls
    const finalWidth = width;
    const finalHeight = height;
    
    // Set SVG dimensions to match document size
    svgElement.setAttribute('width', finalWidth.toString());
    svgElement.setAttribute('height', finalHeight.toString());
    
    // Set viewBox to match document size (content should already be positioned correctly)
    svgElement.setAttribute('viewBox', `0 0 ${finalWidth} ${finalHeight}`);
    
    // Add boundary visualization if requested (for debugging)
    if (showBoundary) {
      const boundaryRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      boundaryRect.setAttribute('x', '2');
      boundaryRect.setAttribute('y', '2');
      boundaryRect.setAttribute('width', (finalWidth - 4).toString());
      boundaryRect.setAttribute('height', (finalHeight - 4).toString());
      boundaryRect.setAttribute('fill', 'none');
      boundaryRect.setAttribute('stroke', '#ff0000');
      boundaryRect.setAttribute('stroke-width', '2');
      boundaryRect.setAttribute('stroke-dasharray', '5,5');
      svgElement.appendChild(boundaryRect);
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = finalWidth;
          canvas.height = finalHeight;
          const ctx = canvas.getContext("2d")!;
          
          // Fill background for JPEG
          if (format === 'jpeg') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, finalWidth, finalHeight);
          }
          
          // Draw the SVG image
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                blob,
                boundaryInfo: {
                  width: finalWidth,
                  height: finalHeight,
                  method: 'user-defined',
                  bounds: { minX: 0, minY: 0, maxX: finalWidth, maxY: finalHeight }
                }
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, `image/${format}`, quality);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load SVG image'));
      };
      
      // Create SVG data URL
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const encodedSvg = encodeSvgToBase64(svgString);
      img.src = "data:image/svg+xml;base64," + encodedSvg;
    });
  } catch (error) {
    console.error(`SVG to ${format.toUpperCase()} conversion error:`, error);
    throw error;
  }
}

/** Preview SVG boundaries for user adjustment */
export async function previewSvgBoundary(
  svgString: string,
  width: number,
  height: number,
  expandPadding: number = 0
): Promise<{ previewSvg: string; boundaryInfo: { width: number; height: number; method: string; bounds?: { minX: number; minY: number; maxX: number; maxY: number } } }> {
  const result = await svgToImageBlob(svgString, width, height, 'png', 1.0, true, expandPadding);
  
  // Create a preview SVG with boundary visualization
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.innerHTML = svgString;
  document.body.appendChild(container);
  
  try {
    const svgElement = container.querySelector('svg');
    if (svgElement && result.boundaryInfo.bounds) {
      // Add boundary rectangle for preview
      const boundaryRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const bounds = result.boundaryInfo.bounds;
      const padding = 20 + expandPadding;
      
      boundaryRect.setAttribute('x', (bounds.minX - padding).toString());
      boundaryRect.setAttribute('y', (bounds.minY - padding).toString());
      boundaryRect.setAttribute('width', (bounds.maxX - bounds.minX + 2 * padding).toString());
      boundaryRect.setAttribute('height', (bounds.maxY - bounds.minY + 2 * padding).toString());
      boundaryRect.setAttribute('fill', 'rgba(255, 0, 0, 0.1)');
      boundaryRect.setAttribute('stroke', '#ff0000');
      boundaryRect.setAttribute('stroke-width', '2');
      boundaryRect.setAttribute('stroke-dasharray', '5,5');
      
      svgElement.insertBefore(boundaryRect, svgElement.firstChild);
      
      // Add corner handles for resizing
      const corners = [
        { x: bounds.minX - padding, y: bounds.minY - padding },
        { x: bounds.maxX + padding, y: bounds.minY - padding },
        { x: bounds.maxX + padding, y: bounds.maxY + padding },
        { x: bounds.minX - padding, y: bounds.maxY + padding }
      ];
      
      corners.forEach((corner, index) => {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        handle.setAttribute('x', (corner.x - 4).toString());
        handle.setAttribute('y', (corner.y - 4).toString());
        handle.setAttribute('width', '8');
        handle.setAttribute('height', '8');
        handle.setAttribute('fill', '#ff0000');
        handle.setAttribute('stroke', '#ffffff');
        handle.setAttribute('stroke-width', '1');
        handle.setAttribute('data-corner', index.toString());
        handle.style.cursor = 'pointer';
        svgElement.appendChild(handle);
      });
      
      const previewSvg = new XMLSerializer().serializeToString(svgElement);
      document.body.removeChild(container);
      
      return {
        previewSvg,
        boundaryInfo: result.boundaryInfo
      };
    }
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
  
  document.body.removeChild(container);
  return {
    previewSvg: svgString,
    boundaryInfo: result.boundaryInfo
  };
}
