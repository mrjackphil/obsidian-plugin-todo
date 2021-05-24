import {App, Notice, Plugin, PluginManifest, TFile, WorkspaceLeaf} from 'obsidian';
import { VIEW_TYPE_TODO } from './constants';
import { TodoItemView, TodoItemViewProps } from './ui/TodoItemView';
import { TodoItem, TodoItemStatus } from './model/TodoItem';
import { TodoIndex } from './model/TodoIndex';

export default class TodoPlugin extends Plugin {
  private todoIndex: TodoIndex;
  private view: TodoItemView;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.todoIndex = new TodoIndex(this.app.vault, this.tick.bind(this));
  }

  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_TODO, (leaf: WorkspaceLeaf) => {
      const todos: TodoItem[] = [];
      const props = {
        todos: todos,
        openFile: (filePath: string) => {
          const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
          this.app.workspace.activeLeaf.openFile(file, { active: true });
        },
        toggleTodo: (todo: TodoItem, newStatus: TodoItemStatus) => {
          this.todoIndex.setStatus(todo, newStatus);
        },
      };
      this.view = new TodoItemView(leaf, props);
      return this.view;
    });

    if (this.app.workspace.layoutReady) {
      this.initLeaf();
      await this.prepareIndex();
    } else {
      this.registerEvent(this.app.workspace.on('layout-ready', this.initLeaf.bind(this)));
      this.registerEvent(this.app.workspace.on('layout-ready', async () => await this.prepareIndex()));
    }
  }

  onunload(): void {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO).forEach((leaf) => leaf.detach());
  }

  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_TODO,
    });
  }

  async prepareIndex(): Promise<void> {
    await this.todoIndex.initialize();
  }

  tick(todos: TodoItem[]): void {
    this.view.setProps((currentProps: TodoItemViewProps) => {
      return {
        ...currentProps,
        todos: todos,
      };
    });
  }
}
