import { html, customElement, property } from "lit-element";
import { styleMap } from "lit-html/directives/style-map";
import { classMap } from "lit-html/directives/class-map";
import { fromEvent } from "rxjs";
import { EditorElement } from "./EditorElement";
import { Logger } from "@src/core/Logger";
import { defaultWidth } from "./Layout";
import { AnimationFrame } from "@src/core/Animation";
import { Bus } from "@src/core/Event";
import { keymapOptionToString } from "@src/core/Keymap";
import { getData } from "@src/core/Helper";
import { Table } from "@src/core/store/Table";
import { selectEndTable, selectTable } from "@src/core/command/table";
import { selectEndMemo } from "@src/core/command/memo";
import "./tableProperties/Indexes";
import "./tableProperties/indexes/IndexAddColumn";
import "./tableProperties/indexes/IndexColumn";
import "./tableProperties/SQL";
import "./tableProperties/GeneratorCode";

const MAX_WIDTH = 800;

type TabType = "indexes" | "SQL" | "GeneratorCode";
interface Tab {
  name: string;
  type: TabType;
}

@customElement("vuerd-table-properties")
class TableProperties extends EditorElement {
  @property({ type: Number })
  width = defaultWidth;
  @property({ type: Boolean })
  animation = true;
  @property({ type: Number })
  animationRight = defaultWidth;
  @property({ type: String })
  tableId = "";
  @property({ type: String })
  tab: TabType = "indexes";

  private tabs: Tab[] = [
    {
      name: "Indexes",
      type: "indexes",
    },
    {
      name: "SQL DDL",
      type: "SQL",
    },
    {
      name: "Generator Code",
      type: "GeneratorCode",
    },
  ];
  private table: Table | null = null;
  private animationFrame = new AnimationFrame<{ right: number }>(200);

  get drawerWidth() {
    let width = this.width / 2;
    if (width > MAX_WIDTH) {
      width = MAX_WIDTH;
    }
    return width;
  }

  get right() {
    return this.animation ? this.animationRight : 0;
  }

  connectedCallback() {
    super.connectedCallback();
    const { eventBus, store } = this.context;
    const root = this.getRootNode() as ShadowRoot;
    const editor = root.querySelector(".vuerd-editor") as Element;
    this.subscriptionList.push(
      fromEvent<MouseEvent>(editor, "mousedown").subscribe(this.onMousedown),
      eventBus.on(Bus.TableProperties.close).subscribe(this.onClose),
      eventBus.on(Bus.TableProperties.closeOnly).subscribe(this.onCloseOnly)
    );
    this.animationRight = -1 * this.drawerWidth;
    this.table = getData(store.tableState.tables, this.tableId);
    store.dispatch(selectEndTable(), selectEndMemo());
  }
  firstUpdated() {
    this.animationFrame
      .play({ right: -1 * this.drawerWidth }, { right: 0 })
      .update((value) => {
        this.animationRight = value.right;
      })
      .complete(() => {
        this.animation = false;
      })
      .start();
  }

  render() {
    const { keymap } = this.context;
    const keymapStop = keymapOptionToString(keymap.stop[0]);
    return html`
      <div
        class="vuerd-table-properties"
        style=${styleMap({
          width: `${this.drawerWidth}px`,
          right: `${this.right}px`,
        })}
      >
        <div class="vuerd-table-properties-header">
          <h3>Table Properties "${this.table?.name}"</h3>
          <vuerd-icon
            class="vuerd-button"
            title=${keymapStop}
            icon="times"
            size="16"
            @click=${this.onClose}
          ></vuerd-icon>
        </div>
        <div class="vuerd-table-properties-body vuerd-scrollbar">
          <ul class="vuerd-table-properties-tab">
            ${this.tabs.map(
              (tab) =>
                html`
                  <li
                    class=${classMap({
                      active: tab.type === this.tab,
                    })}
                    @click=${() => this.onChangeTab(tab.type)}
                  >
                    ${tab.name}
                  </li>
                `
            )}
          </ul>
          ${this.table
            ? html`
                <div>
                  ${this.tab === "indexes"
                    ? html`
                        <vuerd-tab-indexes
                          .table=${this.table}
                        ></vuerd-tab-indexes>
                      `
                    : this.tab === "SQL"
                    ? html`
                        <vuerd-tab-sql .table=${this.table}></vuerd-tab-sql>
                      `
                    : this.tab === "GeneratorCode"
                    ? html`
                        <vuerd-tab-generator-code
                          .table=${this.table}
                        ></vuerd-tab-generator-code>
                      `
                    : ""}
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  private onClose = () => {
    const { store } = this.context;
    this.animation = true;
    this.animationFrame
      .play({ right: this.animationRight }, { right: -1 * this.drawerWidth })
      .update((value) => {
        this.animationRight = value.right;
      })
      .complete(() => {
        store.dispatch(selectTable(store, false, this.tableId));
        this.dispatchEvent(new CustomEvent("close"));
      })
      .start();
  };
  private onCloseOnly = () => {
    this.animation = true;
    this.animationFrame
      .play({ right: this.animationRight }, { right: -1 * this.drawerWidth })
      .update((value) => {
        this.animationRight = value.right;
      })
      .complete(() => {
        this.dispatchEvent(new CustomEvent("close"));
      })
      .start();
  };
  private onMousedown = (event: MouseEvent) => {
    const el = event.target as HTMLElement;
    if (!el.closest(".vuerd-table-properties")) {
      this.onClose();
    }
  };

  private onChangeTab(tab: TabType) {
    this.tab = tab;
  }
}
