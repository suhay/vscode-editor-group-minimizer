import * as vscode from 'vscode';

export class ExtensionConfiguration {
  public prompt: boolean = false;

  constructor() {
    vscode.workspace.onDidChangeConfiguration(() => this.init());
    this.init();
  }

  init() {
    this.prompt = vscode.workspace.getConfiguration('editorGroupMinimizer').get<boolean>('groupNamePrompt') || false;
  }
}
