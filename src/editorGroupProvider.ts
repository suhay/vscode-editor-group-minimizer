import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class EditorGroupProvider implements vscode.TreeDataProvider<EditorGroup> {
  constructor(private workspaceRoot: readonly vscode.WorkspaceFolder[] | undefined) {}

  getTreeItem(element: EditorGroup): vscode.TreeItem {
    return element;
  }

  getChildren(element?: EditorGroup): Thenable<EditorGroup[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    return Promise.resolve([]);
  }
}

class EditorGroup extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return `${this.label}-${this.version}`;
  }

  get description(): string {
    return this.version;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}