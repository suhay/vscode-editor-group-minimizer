"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class EditorGroupProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }
        return Promise.resolve([]);
    }
}
exports.EditorGroupProvider = EditorGroupProvider;
class EditorGroup extends vscode.TreeItem {
    constructor(label, version, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.version = version;
        this.collapsibleState = collapsibleState;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
    }
    get tooltip() {
        return `${this.label}-${this.version}`;
    }
    get description() {
        return this.version;
    }
}
//# sourceMappingURL=editorGroupProvider.js.map