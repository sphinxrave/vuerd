import { html, svg, customElement, property } from "lit-element";
import { styleMap } from "lit-html/directives/style-map";
import { repeat } from "lit-html/directives/repeat";
import { Subscription } from "rxjs";
import { EditorElement } from "./EditorElement";
import { Logger } from "@src/core/Logger";
import { defaultWidth, defaultHeight } from "./Layout";
import {
  SIZE_MINIMAP_WIDTH,
  SIZE_MINIMAP_MARGIN,
  SIZE_TOP_MENU_HEIGHT,
} from "@src/core/Layout";
import { Table } from "@src/core/store/Table";
import { Memo } from "@src/core/store/Memo";

const MARGIN_TOP = SIZE_TOP_MENU_HEIGHT + SIZE_MINIMAP_MARGIN;

@customElement("vuerd-minimap")
class Minimap extends EditorElement {
  @property({ type: Number })
  width = defaultWidth;
  @property({ type: Number })
  height = defaultHeight;

  private tables: Table[] = [];
  private memos: Memo[] = [];
  private subscriptionList: Subscription[] = [];

  get styleMap() {
    const {
      width,
      height,
      scrollLeft,
      scrollTop,
    } = this.context.store.canvasState;
    const ratio = SIZE_MINIMAP_WIDTH / width;
    const x = (-1 * width) / 2 + SIZE_MINIMAP_WIDTH / 2;
    const y = (-1 * height) / 2 + (height * ratio) / 2;
    const left =
      x - SIZE_MINIMAP_WIDTH - SIZE_MINIMAP_MARGIN + this.width + scrollLeft;
    const top = y + MARGIN_TOP + scrollTop;
    return {
      transform: `scale(${ratio}, ${ratio})`,
      width: `${width}px`,
      height: `${height}px`,
      left: `${left}px`,
      top: `${top}px`,
    };
  }

  connectedCallback() {
    super.connectedCallback();
    Logger.debug("Minimap before render");
    const { store } = this.context;
    this.tables = store.tableState.tables;
    this.memos = store.memoState.memos;
    this.subscriptionList.push.apply(this.subscriptionList, [
      store.observe(this.tables, () => this.requestUpdate()),
      store.observe(this.memos, () => this.requestUpdate()),
      store.observe(store.canvasState, name => {
        switch (name) {
          case "width":
          case "height":
          case "scrollLeft":
          case "scrollTop":
            this.requestUpdate();
            break;
        }
      }),
    ]);
  }
  disconnectedCallback() {
    Logger.debug("Minimap destroy");
    this.subscriptionList.forEach(sub => sub.unsubscribe());
    super.disconnectedCallback();
  }

  render() {
    Logger.debug("Minimap render");
    return html`
      <div class="vuerd-minimap" style=${styleMap(this.styleMap)}>
        <div class="vuerd-minimap-canvas">
          ${repeat(
            this.tables,
            table => table.id,
            table =>
              html`
                <vuerd-minimap-table
                  .context=${this.context}
                  .table=${table}
                ></vuerd-minimap-table>
              `
          )}
          ${repeat(
            this.memos,
            memo => memo.id,
            memo =>
              html`
                <vuerd-minimap-memo
                  .context=${this.context}
                  .memo=${memo}
                ></vuerd-minimap-memo>
              `
          )}
          ${svg`<svg class="vuerd-minimap-canvas-svg"></svg>`}
        </div>
      </div>
      <vuerd-minimap-handle
        .context=${this.context}
        .width=${this.width}
        .height=${this.height}
      ></vuerd-minimap-handle>
    `;
  }
}