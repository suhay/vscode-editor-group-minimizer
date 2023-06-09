import * as vscode from 'vscode';

import { EditorDocument } from './editorDocument';
import { EditorGroup } from './editorGroup';
import { ExtensionConfiguration } from './extensionConfiguration';

export class EditorGroupTreeDataProvider implements vscode.TreeDataProvider<EditorGroup> {
	private _onDidChangeTreeData: vscode.EventEmitter<EditorGroup | undefined> = new vscode.EventEmitter<EditorGroup | undefined>();
  readonly onDidChangeTreeData: vscode.Event<EditorGroup | undefined> = this._onDidChangeTreeData.event;
  
  context: vscode.ExtensionContext;
  configuration: ExtensionConfiguration;

  constructor(cont: vscode.ExtensionContext) {
    this.context = cont;
    this.configuration = new ExtensionConfiguration();
  }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: EditorGroup): vscode.TreeItem {
    return element;
  }

	getChildren(element?: EditorGroup): Thenable<EditorGroup[] | undefined> {
    if (element) {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri?.path ?? '';
      const documents = (element.documents || []).map(({ document }) => {
        const groupMember = new EditorGroup(document?.fileName.replace(`${root}/`, ''));
        groupMember.parent = element;
        return groupMember;
      });
      return Promise.resolve(documents);
    }
    
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups');
    const primed = minimizedGroups?.map((group) => {
      const documents = group.documents?.map(({ document, viewColumn }) => new EditorDocument(document, viewColumn));
      return new EditorGroup(
        group.label, 
        vscode.TreeItemCollapsibleState.Collapsed, 
        documents,
      );
    });
  
    return this.context.workspaceState.update('minimizedGroups', primed)
      .then(() => primed);
  }

  restore(group: EditorGroup) {
    return (group.documents || []).map(({ document, viewColumn }) => {
      return vscode.window.showTextDocument(document, {
        preserveFocus: true,
        preview: false,
        viewColumn: viewColumn ?? vscode.ViewColumn.One
      });
    });
  }


  remove(group: EditorGroup): Thenable<void> {
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
    const remaining = minimizedGroups.filter((mGroup) => mGroup !== group);
    return this.context.workspaceState.update('minimizedGroups', remaining)
      .then(() => this.refresh());
  }

  async minimize(): Promise<void> {
    const providedLabel = this.configuration.prompt ? await vscode.window.showInputBox({
      prompt: 'Provide group name or leave empty for default.'
    }) : undefined;

    const documents: EditorDocument[] = [];
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
    let activeTextEditor = vscode.window.activeTextEditor;
    let pinnedCheck = activeTextEditor;

    while (activeTextEditor !== undefined) {
      const closingEditor = activeTextEditor;
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

      if (!vscode.window.activeTextEditor) {
        await vscode.commands.executeCommand('workbench.action.nextEditor');
      }

      activeTextEditor = vscode.window.activeTextEditor;
      if (activeTextEditor === pinnedCheck) {
        break; // We may have hit a pinned editor since it didn't close
      }

      if (closingEditor.document.uri.scheme === 'file') {
        documents.push(new EditorDocument(closingEditor.document, closingEditor.viewColumn));
      }

      if (!vscode.window.activeTextEditor) { // Sometimes the timing is off between opening the next editor and checking if there are more to minimize
        await vscode.commands.executeCommand('workbench.action.nextEditor');
        activeTextEditor = vscode.window.activeTextEditor;
      }

      pinnedCheck = activeTextEditor;
    }

    const label = providedLabel && providedLabel.length ? providedLabel : `Group ${minimizedGroups.length + 1}`;
    minimizedGroups.push(new EditorGroup(
      label, 
      vscode.TreeItemCollapsibleState.Collapsed, 
      documents,
    ));

    return this.context.workspaceState.update('minimizedGroups', minimizedGroups)
      .then(() => {
        vscode.window.showInformationMessage(`Minimized as: ${label}`);
        this.refresh();
      });
  }

  dispose(): Thenable<void> {
    return this.clear();
  }

  clear(): Thenable<void> {
    return this.context.workspaceState.update('minimizedGroups', undefined);
  }

  rename(group: EditorGroup): Thenable<void> {
    return vscode.window.showInputBox()
      .then((value) => {
        const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
        const oldGroup = minimizedGroups.find((mGroup) => mGroup === group);

        if (oldGroup) {
          oldGroup.label = value || oldGroup.label;
        }

        return this.context.workspaceState.update('minimizedGroups', minimizedGroups);
      })
      .then(() => this.refresh());
  }

  addToGroup(uri: vscode.Uri): Thenable<void> {
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];

    return vscode.window.showQuickPick(minimizedGroups)
      .then((picked) => {
        if (picked) {
          return vscode.workspace.openTextDocument(uri)
            .then((document) => {
              if (document) {
                picked.documents?.push(new EditorDocument(document));
                vscode.window.showInformationMessage(`Added to ${picked.label}`);
              }
              picked.refresh();
              return this.context.workspaceState.update('minimizedGroups', minimizedGroups);
            });
        }
      })
      .then(() => this.refresh());
  }

  removeFromGroup(group: EditorGroup): Thenable<void> {
    const minimizedGroups = this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];

    if (group.parent) {
      const oldGroupIdx = minimizedGroups.findIndex((mGroup) => mGroup === group.parent);

      if (oldGroupIdx >= 0) {
        const oldGroup = minimizedGroups[oldGroupIdx];

        const i = oldGroup?.documents?.findIndex((doc) => doc.documentName === group.label) ?? -1;
        if (i >= 0) {
          oldGroup?.documents?.splice(i, 1);
        }

        if (oldGroup?.documents?.length === 0) {
          minimizedGroups.splice(oldGroupIdx, 1);
        } else {
          oldGroup?.refresh();
        }
      }
    }

    return this.context.workspaceState.update('minimizedGroups', minimizedGroups)
      .then(() => this.refresh());
  }
}
