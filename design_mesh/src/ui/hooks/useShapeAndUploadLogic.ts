import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { addSymbol, setToast } from "../store/appStore";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { SymbolType } from "../components/res/CanvasSection";
import { SvgConversionParams, defaultConversionParams } from "../constants/inventory";
import { sourceToSvg, unitsToPixels, encodeSvgToBase64, svgToBlob } from "../utils/svgUtils";
import { v4 as uuidv4 } from "uuid";

export const useShapeAndUploadLogic = (
  addOnSDKAPI: AddOnSDKAPI,
  onSvgConversionRequested: (data: { file: File; reader: FileReader; params: SvgConversionParams }) => void,
  sandboxProxy?: any // Add optional sandboxProxy parameter
) => {
  const dispatch = useDispatch();

  // Insert symbol to document (no uuid change needed)
  const insertSymbolToDocument = useCallback(async (symbol: SymbolType) => {
    if (symbol.type === "image" && symbol.src) {
      try {
        const response = await fetch(symbol.src);
        const originalBlob = await response.blob();
        let blob = originalBlob;

        // Convert JPEG/JPG to PNG if needed
        if (originalBlob.type === 'image/jpeg' || originalBlob.type === 'image/jpg') {
          const img = await createImageBitmap(originalBlob);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
        }

        // Check if the file is an animated format (GIF)
        if (originalBlob.type === 'image/gif') {
          if (sandboxProxy && sandboxProxy.createPositionedImage) {
            try {
              await sandboxProxy.createPositionedImage(blob, { position: 'center', isAnimated: true });
            } catch (error) {
              console.error('Failed to insert animated image with positioning:', error);
              await addOnSDKAPI.app.document.addAnimatedImage(blob);
            }
          } else {
            await addOnSDKAPI.app.document.addAnimatedImage(blob);
          }
        } else {
          if (sandboxProxy && sandboxProxy.createPositionedImage) {
            try {
              await sandboxProxy.createPositionedImage(blob, { position: 'center' });
            } catch (error) {
              console.error('Failed to insert image with positioning:', error);
              await addOnSDKAPI.app.document.addImage(blob);
            }
          } else {
            await addOnSDKAPI.app.document.addImage(blob);
          }
        }
      } catch (error: any) {
        // Handle maxSupportedSize error from Adobe Express API
        if (error.code === 'maxSupportedSize') {
          dispatch(setToast("Image exceeds Adobe Express's maximum supported size. Please try a smaller image."));
        } else {
          // Max 65000000 = close to 8062*8062
          dispatch(setToast("Error adding image: " + (error.message || "Unknown error")));
        }
        console.error("Image insertion error:", error);
        return;
      }
    } else {
      // Get extended properties from symbol (with fallbacks to default values)
      const symbolWithExtended = symbol as any;
      const fill = symbolWithExtended.fill || (symbol.type === "rect" ? "#90caf9" : symbol.type === "circle" ? "#a5d6a7" : symbol.type === "polygon" ? "#ffcc80" : "#ef9a9a");
      const stroke = symbolWithExtended.stroke || "#333";
      const strokeWidth = symbolWithExtended.strokeWidth || 2;
      const cornerRadius = symbolWithExtended.cornerRadius || 0;
      
      let svg = "";
      if (symbol.type === "rect") {
        if (cornerRadius > 0) {
          svg = `<rect width="${symbol.width}" height="${symbol.height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
        } else {
          svg = `<rect width="${symbol.width}" height="${symbol.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
        }
      } else if (symbol.type === "circle") {
        svg = `<circle cx="${symbol.width / 2}" cy="${symbol.height / 2}" r="${(symbol.width / 2) - (strokeWidth / 2)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      } else if (symbol.type === "polygon") {
        svg = `<polygon points="50,10 90,90 10,90" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      } else if (symbol.type === "curve") {
        svg = `<path d="M10,50 Q50,10 90,50" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      }

      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${symbol.width}" height="${symbol.height}">${svg}</svg>`;
      
      const blob = await svgToBlob(fullSvg, symbol.width, symbol.height, 'png');
      
      if (sandboxProxy && sandboxProxy.createPositionedImage) {
        try {
          await sandboxProxy.createPositionedImage(blob, { position: 'center' });
        } catch (error) {
          console.error('Failed to insert shape with positioning:', error);
          await addOnSDKAPI.app.document.addImage(blob);
        }
      } else {
        await addOnSDKAPI.app.document.addImage(blob);
      }
    }
  }, [addOnSDKAPI, dispatch, sandboxProxy]);

  // Insert new shape (rect/circle/polygon) with unique uuid and inventoryId
  const handleInsertShape = useCallback(async (type: "rect" | "circle" | "polygon" | "curve") => {
    const newSymbol: SymbolType = {
      uuid: uuidv4(),
      inventoryId: uuidv4(),
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      type,
    };
    dispatch(addSymbol(newSymbol));
    await insertSymbolToDocument(newSymbol);
  }, [dispatch, insertSymbolToDocument]);

  // Upload image: new uuid and inventoryId, reset file input after upload
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      dispatch(setToast(`Invalid file type. Supported formats: SVG, JPEG, JPG, PNG, GIF. Got: ${file.type}`));
      if (e.target) e.target.value = "";
      return;
    }

    // Handle SVG files separately with improved parsing
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const svgSource = event.target?.result as string;
          const svgElement = await sourceToSvg(svgSource, { trim: true });
          
          // Get SVG dimensions
          const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(parseFloat);
          const width = unitsToPixels(svgElement.getAttribute('width') || '') || (viewBox ? viewBox[2] : 512);
          const height = unitsToPixels(svgElement.getAttribute('height') || '') || (viewBox ? viewBox[3] : 512);
          
          onSvgConversionRequested({ 
            file, 
            reader,
            params: defaultConversionParams
          });
        } catch (error: any) {
          console.error('SVG parsing error:', error);
          dispatch(setToast(`Error processing SVG: ${error.message}`));
        }
      };
      reader.readAsText(file);
      if (e.target) e.target.value = ""; // Clear the file input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      
      // Create image element to get dimensions
      const img = new Image();
      img.onload = async () => {
        const symbol: SymbolType = {
          uuid: uuidv4(),
          inventoryId: uuidv4(),
          x: 0,
          y: 0,
          // Maintain aspect ratio while fitting within 80x80
          width: img.width > img.height ? 80 : Math.floor((img.width / img.height) * 80),
          height: img.height > img.width ? 80 : Math.floor((img.height / img.width) * 80),
          type: "image",
          src,
        };
        
        dispatch(addSymbol(symbol));
        await insertSymbolToDocument(symbol);
        if (e.target) e.target.value = "";
      };

      img.onerror = () => {
        dispatch(setToast("Error loading image. Please try another file."));
        if (e.target) e.target.value = "";
      };

      img.src = src;
    };

    reader.onerror = () => {
      dispatch(setToast("Error reading file. Please try again."));
      if (e.target) e.target.value = "";
    };

    reader.readAsDataURL(file);
  }, [dispatch, insertSymbolToDocument, onSvgConversionRequested]);

  const handleSvgConversion = useCallback(async (
    convertToPng: boolean,
    svgConversionData: { file: File; reader: FileReader; params: SvgConversionParams }
  ) => {
    if (!convertToPng) return;

    const { file, reader, params } = svgConversionData;

    return new Promise<void>((resolve, reject) => {
      reader.onload = async (ev) => {
        try {
          let svgData = ev.target?.result as string;
          if (svgData.startsWith('data:image/svg+xml;base64,')) {
            svgData = atob(svgData.replace('data:image/svg+xml;base64,', ''));
          }

          // Use our enhanced SVG parsing utility
          const svgElement = await sourceToSvg(svgData, { 
            trim: true,
            type: 'image/svg+xml'
          });

          // Use fixed max dimensions
          const MAX_DIMENSION = 8062;
          const originalWidth = parseFloat(svgElement.getAttribute('width') || '0') || 
                              parseFloat((svgElement.getAttribute('viewBox')?.split(' ')[2] || '0')) || 500;
          const originalHeight = parseFloat(svgElement.getAttribute('height') || '0') || 
                               parseFloat((svgElement.getAttribute('viewBox')?.split(' ')[3] || '0')) || 500;

          // Calculate dimensions maintaining aspect ratio
          let targetWidth = MAX_DIMENSION;
          let targetHeight = MAX_DIMENSION;
          
          if (params.maintainAspectRatio) {
            const ratio = originalWidth / originalHeight;
            if (ratio > 1) {
              targetHeight = MAX_DIMENSION / ratio;
            } else {
              targetWidth = MAX_DIMENSION * ratio;
            }
          }

          // Use the utility function to convert SVG to the desired format
          const blob = await svgToBlob(
            new XMLSerializer().serializeToString(svgElement),
            targetWidth,
            targetHeight,
            params.format,
            1.0 // Maximum quality (100%)
          );

          // Convert blob to base64 data URL for persistent storage
          const convertedUrl = await new Promise<string>((resolveUrl) => {
            const urlReader = new FileReader();
            urlReader.onload = () => resolveUrl(urlReader.result as string);
            urlReader.readAsDataURL(blob);
          });

          // Create the symbol
          const symbol: SymbolType = {
            uuid: uuidv4(),
            inventoryId: uuidv4(),
            x: 0,
            y: 0,
            width: 80,
            height: 80,
            type: "image",
            src: convertedUrl,
          };
          
          // First insert to document, then add to symbols
          await insertSymbolToDocument(symbol);
          dispatch(addSymbol(symbol));
          
          resolve();
        } catch (error: any) {
          dispatch(setToast(`Error converting SVG: ${error.message}`));
          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read SVG file');
        dispatch(setToast('Failed to read SVG file'));
        reject(error);
      };

      reader.readAsText(file);
    });
  }, [dispatch, insertSymbolToDocument]);

  return {
    handleInsertShape,
    handleUpload,
    handleSvgConversion,
    insertSymbolToDocument,
  };
};
