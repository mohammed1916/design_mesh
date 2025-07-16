// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(): void;
    createCircle?(radius: number, x: number, y: number): void;
    createPolygon?(points: Array<{x: number, y: number}>, color?: {red: number, green: number, blue: number, alpha: number}): void;
    // Add more shape/image/document APIs here
}
