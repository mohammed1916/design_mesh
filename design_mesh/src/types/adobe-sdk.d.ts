// Adobe Creative Cloud Web Add-on SDK type declarations
// These modules are provided by the Adobe environment at runtime

declare module "add-on-sdk-document-sandbox" {
    export interface Runtime {
        // Add specific runtime properties as needed
        [key: string]: any;
    }

    export interface AddOnSandboxSdk {
        instance: {
            runtime: Runtime;
        };
    }

    const addOnSandboxSdk: AddOnSandboxSdk;
    export default addOnSandboxSdk;
}

declare module "express-document-sdk" {
    export namespace editor {
        export function createRectangle(): any;
        export function createEllipse(): any;
        export function createPath(pathData: string): any;
        export function createText(): any;
        export function createImageContainer(bitmapImage: any, options: any): any;
        export function makeColorFill(color: any): any;
        export function loadBitmapImage(blob: Blob): Promise<any>;
        export function queueAsyncEdit(callback: () => void): Promise<void>;

        export const context: {
            insertionParent: {
                children: {
                    append: (element: any) => void;
                };
            };
        };

        export const documentRoot: {
            pages: any[];
        };
    }
}

// DOM types that might not be available in the sandbox environment
declare global {
    interface Blob {
        readonly size: number;
        readonly type: string;
        arrayBuffer(): Promise<ArrayBuffer>;
        slice(start?: number, end?: number, contentType?: string): Blob;
        stream(): ReadableStream<Uint8Array>;
        text(): Promise<string>;
    }

    const Blob: {
        prototype: Blob;
        new(blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
    };
}
