import * as vscode from 'vscode';

import { EditorGroup } from './editorGroup';

export class EditorGroupTreeDataProvider implements vscode.TreeDataProvider<EditorGroup> {
	private _onDidChangeTreeData: vscode.EventEmitter<EditorGroup | undefined> = new vscode.EventEmitter<EditorGroup | undefined>();
  readonly onDidChangeTreeData: vscode.Event<EditorGroup | undefined> = this._onDidChangeTreeData.event;
  
  context: vscode.ExtensionContext;
  group = 1;

  constructor(cont: vscode.ExtensionContext) {
    this.context = cont;
    const groups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups');
    this.group = groups && groups.length > 0 
      ? parseInt(groups[groups.length - 1].label.replace(/\D+/g, ''), 10) + 1
      : 1;
  }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: EditorGroup): vscode.TreeItem {
    return element;
  }

	getChildren(element?: EditorGroup): Thenable<EditorGroup[] | undefined> {
    if (element) {
      const root = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : '';
      const documents = (element.documents || []).map((document) => new EditorGroup(document.fileName.replace(`${root}/`, '')));
      return Promise.resolve(documents);
    } else {
      const groups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups');
      return Promise.resolve(groups);
    }
  }

  async restore(group: EditorGroup): Promise<void> {
    for (const document of group.documents || []) {
      await vscode.window.showTextDocument(document, {
        preserveFocus: true,
        preview: false,
        viewColumn: (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) || 1
      });
    }
    return Promise.resolve();
  }

  remove(group: EditorGroup): Thenable<void> {
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
    const remaining = minimizedGroups.filter((mGroup) => mGroup !== group);
    return this.context.workspaceState.update('minimizedGroups', remaining)
      .then(() => this.refresh());
  }

  async minimize(): Promise<void> {
    const documents = [];
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
    let active = vscode.window.activeTextEditor;

    while (active !== undefined) {
      documents.push(active?.document);
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      active = vscode.window.activeTextEditor;
    }

    minimizedGroups.push(new EditorGroup(`Group ${this.group}`, vscode.TreeItemCollapsibleState.Collapsed, documents.filter((doc) => {
      return doc.uri.scheme === 'file';
    })));

    return this.context.workspaceState.update('minimizedGroups', minimizedGroups)
      .then(() => {
        vscode.window.showInformationMessage(`Minimized as: Group ${this.group}`);
        this.group++;
        this.refresh();
      });
  }

  dispose(): Thenable<void> {
    return this.clear();
  }

  clear(): Thenable<void> {
    return this.context.workspaceState.update('minimizedGroups', undefined);
  }
}
