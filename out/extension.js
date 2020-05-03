"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const editorGroupTreeDataProvider_1 = require("./editorGroupTreeDataProvider");
function activate(context) {
    const editorGroupTreeDataProvider = new editorGroupTreeDataProvider_1.EditorGroupTreeDataProvider(context);
    vscode.window.registerTreeDataProvider('minimizedGroups', editorGroupTreeDataProvider);
    vscode.commands.registerCommand('vscode-editor-group-minimizer.minimize', group => editorGroupTreeDataProvider.minimize());
    vscode.commands.registerCommand('vscode-editor-group-minimizer.remove', group => editorGroupTreeDataProvider.remove(group));
    vscode.commands.registerCommand('vscode-editor-group-minimizer.restore', group => editorGroupTreeDataProvider.restore(group));
    context.subscriptions.push(editorGroupTreeDataProvider);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map