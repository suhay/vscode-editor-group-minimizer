import * as vscode from 'vscode';
import { commands, Disposable, ExtensionContext, TextEditor, window } from 'vscode';
import { resolve } from 'dns';

export class EditorGroupTreeDataProvider implements vscode.TreeDataProvider<EditorGroup> {
	private _onDidChangeTreeData: vscode.EventEmitter<EditorGroup | undefined> = new vscode.EventEmitter<EditorGroup | undefined>();
  readonly onDidChangeTreeData: vscode.Event<EditorGroup | undefined> = this._onDidChangeTreeData.event;
  
  context: vscode.ExtensionContext;
  group = 1;

  constructor(cont: vscode.ExtensionContext) {
    this.context = cont;
    const groups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups');
    this.group = (groups || []).length + 1;
  }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: EditorGroup): vscode.TreeItem {
    return element;
  }

	getChildren(element?: EditorGroup): Thenable<EditorGroup[] | undefined> {
    if (element) {
      const documents = (element.documents || []).map((document) => new EditorGroup(document.fileName));
      return Promise.resolve(documents);
    } else {
      const groups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups');
      return Promise.resolve(groups);
    }
  }

  restore(group: EditorGroup): Thenable<vscode.TextEditor[]> {
    return Promise.all(
      (group.documents || []).map(async (document) => vscode.window.showTextDocument(document))
    );
      // .then(() => this.remove(group));
  }

  remove(group: EditorGroup): Thenable<void> {
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
    const remaining = minimizedGroups.filter((mGroup) => mGroup !== group);
    return this.context.workspaceState.update('minimizedGroups', remaining)
      .then(() => this.refresh());
  }

  minimize(): Thenable<void> {
    const documents = [...vscode.workspace.textDocuments];
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
    minimizedGroups.push(new EditorGroup(`Group ${this.group}`, vscode.TreeItemCollapsibleState.Collapsed, documents.filter((doc) => {
      return doc.uri.scheme === 'file' && !doc.fileName.endsWith('tsconfig.json');
    })));

    return this.context.workspaceState.update('minimizedGroups', minimizedGroups)
      .then(() => commands.executeCommand('workbench.action.closeAllEditors'))
      .then(() => {
        vscode.window.showInformationMessage(`Minimized as: Group ${this.group}`);
        this.group++;
        this.refresh();
      });
  }

  dispose() {
    this.context.workspaceState.update('minimizedGroups', undefined);
  }
}

class EditorGroup extends vscode.TreeItem {
  contextValue: string;

  constructor(
    public readonly label: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly documents?: vscode.TextDocument[]
  ) {
    super(label, collapsibleState);
    this.contextValue = collapsibleState && documents ? 'editorGroup' : '';
  }

  get tooltip(): string {
    return `${this.label}`;
  }

  get description(): string {
    const des = (this.documents || []).map((document) => document.fileName);
    return des.length > 0 ? `${des.join(', ').substr(0, 30)}...` : '';
  }
}
