import * as vscode from 'vscode';

import { EditorGroupTreeDataProvider } from './editorGroupTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
  const editorGroupTreeDataProvider = new EditorGroupTreeDataProvider(context);
  vscode.window.registerTreeDataProvider('minimizedGroups', editorGroupTreeDataProvider);
  vscode.commands.registerCommand('vscode-editor-group-minimizer.minimize', () => editorGroupTreeDataProvider.minimize());
  vscode.commands.registerCommand('vscode-editor-group-minimizer.remove', group => editorGroupTreeDataProvider.remove(group));
  vscode.commands.registerCommand('vscode-editor-group-minimizer.restore', group => editorGroupTreeDataProvider.restore(group));
  vscode.commands.registerCommand('vscode-editor-group-minimizer.rename', group => editorGroupTreeDataProvider.rename(group));
  vscode.commands.registerCommand('vscode-editor-group-minimizer.addToGroup', uri => editorGroupTreeDataProvider.addToGroup(uri));
  vscode.commands.registerCommand('vscode-editor-group-minimizer.removeFromGroup', group => editorGroupTreeDataProvider.removeFromGroup(group));

  context.subscriptions.push(editorGroupTreeDataProvider);
}

export function deactivate() {}
