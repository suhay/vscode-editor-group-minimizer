import * as vscode from 'vscode';

export class EditorGroup extends vscode.TreeItem {
  contextValue: string;
  description: string;

  constructor(
    public label: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly documents?: vscode.TextDocument[]
  ) {
    super(label, collapsibleState);
    this.contextValue = collapsibleState && documents ? 'editorGroup' : '';

    const des = this._description;
    this.description = des.length > 0 ? `${des.join(', ').substr(0, 30)}...` : '';
  }

  get tooltip(): string {
    return `${this._description.join(', ')}`;
  }
  
  private get _description(): string[] {
    const root = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : '';
    return (this.documents || []).map((document) => document.fileName.replace(`${root}/`, ''));
  }
}
