import { storiesOf } from "@storybook/html";
import { Editor } from "../src/ts/types";
import "../dist/vuerd.min.js";

const stories = storiesOf("Theme", module);

function init(editor: Editor) {
  document.body.setAttribute("style", "padding: 0; margin: 0;");
  window.addEventListener("resize", () => {
    editor.width = window.innerWidth;
    editor.height = window.innerHeight;
  });
  window.dispatchEvent(new Event("resize"));
}

stories.add(
  "css",
  () => {
    const container = document.createElement("div");
    const editor = document.createElement("erd-editor") as Editor;
    const style = document.createElement("style");
    container.appendChild(editor);
    container.appendChild(style);
    init(editor);

    style.innerText = `
      :root {
        --vuerd-theme-canvas: #2f4e44;
      }
    `;

    return container;
  },
  { options: { showPanel: true, panelPosition: "right" } }
);

stories.add(
  "javascript",
  () => {
    const editor = document.createElement("erd-editor") as Editor;
    init(editor);

    editor.setTheme({
      canvas: "#2f444e",
    });

    return editor;
  },
  { options: { showPanel: true, panelPosition: "right" } }
);
