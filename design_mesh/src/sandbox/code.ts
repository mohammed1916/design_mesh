import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";

// Get the document sandbox runtime.
const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    // APIs to be exposed to the UI runtime
    // i.e., to the `App.tsx` file of this add-on.
    const sandboxApi: DocumentSandboxApi = {
        createRectangle: () => {
            const rectangle = editor.createRectangle();

            // Define rectangle dimensions.
            rectangle.width = 240;
            rectangle.height = 180;

            // Define rectangle position.
            rectangle.translation = { x: 10, y: 10 };

            // Define rectangle color.
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };

            // Fill the rectangle with the color.
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;

            // Add the rectangle to the document.
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        createCircle: (radius = 50, x = 50, y = 50) => {
            const ellipse = editor.createEllipse();
            ellipse.rx = radius;
            ellipse.ry = radius;
            ellipse.translation = { x, y };
            const color = { red: 0.2, green: 0.7, blue: 0.3, alpha: 1 };
            const fill = editor.makeColorFill(color);
            ellipse.fill = fill;
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(ellipse);
        },
        createPolygon: (points = [{x:50,y:10},{x:90,y:90},{x:10,y:90}], color = {red:1,green:0.8,blue:0.5,alpha:1}) => {
            // Convert points to SVG path string
            const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
            const path = editor.createPath(pathData);
            path.translation = { x: 0, y: 0 };
            const fill = editor.makeColorFill(color);
            path.fill = fill;
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(path);
        },
        createHistoryIcon: () => {
            // SVG path for a simple clock/history icon
            const pathData = "M50,10 A40,40 0 1,1 49.9,10 M50,50 L50,30 M50,50 L70,50";
            const icon = editor.createPath(pathData);
            icon.translation = { x: 20, y: 20 };
            icon.fill = editor.makeColorFill({ red: 0, green: 0, blue: 0, alpha: 1 });
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(icon);

            // Optionally add text label
            const info = editor.createText();
            info.text = "History";
            info.translation = { x: 70, y: 30 };
            insertionParent.children.append(info);
        }

    };

    // Expose `sandboxApi` to the UI runtime.
    runtime.exposeApi(sandboxApi);
}

start();
