import * as vscode from 'vscode';

export class EditorDocument {
  contextValue: string;

  constructor(
    public readonly document: vscode.TextDocument,
    public readonly viewColumn?: vscode.ViewColumn,
    public label?: string,
  ) {
    this.viewColumn = viewColumn || vscode.ViewColumn.One;
    this.label = label ?? document?.fileName ?? '';
    this.contextValue = 'editorDocument';
  }

  get documentName(): string {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri?.path ?? '';
    return (this.label || '').replace(`${root}/`, '');
  }
}
