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

/** Convert SVG to blob using direct canvas rendering (screenshot-like approach) */
export async function svgToImageBlob(
  svgString: string,
  width: number,
  height: number,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const zoomedWidth = width * 0.8;
    const zoomedHeight = height * 0.8;
    
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.innerHTML = svgString;
    
    document.body.appendChild(container);
    
    try {
      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        throw new Error('No SVG element found');
      }
      
      // Ensure SVG has proper dimensions
      svgElement.setAttribute('width', width.toString());
      svgElement.setAttribute('height', height.toString());
      
      // Create canvas for screenshot at 50% size
      const canvas = document.createElement('canvas');
      canvas.width = zoomedWidth;
      canvas.height = zoomedHeight;
      const ctx = canvas.getContext('2d')!;
      
      // Create data URL from SVG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        try {
          // Fill background for JPEG
          if (format === 'jpeg') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, zoomedWidth, zoomedHeight);
          }
          
          // Draw the SVG image at 50% zoom (screenshot approach)
          ctx.drawImage(img, 0, 0, zoomedWidth, zoomedHeight);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            document.body.removeChild(container);
            
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, `image/${format}`, quality);
        } catch (error) {
          URL.revokeObjectURL(url);
          document.body.removeChild(container);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        document.body.removeChild(container);
        reject(new Error('Failed to load SVG image'));
      };
      
      img.src = url;
      
    } catch (error) {
      document.body.removeChild(container);
      reject(error);
    }
  });
}
