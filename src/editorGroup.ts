import * as vscode from 'vscode';

import { EditorDocument } from './editorDocument';

export class EditorGroup extends vscode.TreeItem {
  contextValue: string;
  description: string;

  _parent?: EditorGroup = undefined;

  constructor(
    public label: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly documents?: EditorDocument[]
  ) {
    super(label, collapsibleState);
    this.contextValue = collapsibleState && documents ? 'editorGroup' : 'editorDocument';

    const des = this._description;
    this.description = des.length > 0 ? `${des.join(', ').substr(0, 30)}...` : '';
    this.tooltip = `${this._description.join(', ')}`;
  }

  private get _description(): string[] {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri?.path ?? '';
    return (this.documents || []).map(({ document }) => document?.fileName.replace(`${root}/`, ''));
  }

  get parent(): EditorGroup | undefined {
    return this._parent;
  }

  set parent(value: EditorGroup | undefined) {
    this._parent = value;
  }

  refresh() {
    const des = this._description;
    this.description = des.length > 0 ? `${des.join(', ').substr(0, 30)}...` : '';
    this.tooltip = `${this._description.join(', ')}`;
  }
}
