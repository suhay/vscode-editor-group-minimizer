"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class EditorGroup extends vscode.TreeItem {
    constructor(label, collapsibleState, documents) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.documents = documents;
        this.contextValue = collapsibleState && documents ? 'editorGroup' : '';
        const des = this._description;
        this.description = des.length > 0 ? `${des.join(', ').substr(0, 30)}...` : '';
    }
    get tooltip() {
        return `${this._description.join(', ')}`;
    }
    get _description() {
        const root = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : '';
        return (this.documents || []).map((document) => document.fileName.replace(`${root}/`, ''));
    }
}
exports.EditorGroup = EditorGroup;
//# sourceMappingURL=editorGroup.js.map