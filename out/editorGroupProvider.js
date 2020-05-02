"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class EditorGroupView {
    constructor(context) {
        const view = vscode.window.createTreeView('minimizedGroups', { treeDataProvider: editorGroupTreeDataProvider(), showCollapseAll: true });
    }
}
exports.EditorGroupView = EditorGroupView;
function editorGroupTreeDataProvider() {
    return {
        getChildren: (element) => {
            return Promise.resolve([]);
        },
        getTreeItem: (element) => {
            return element;
        }
    };
}
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