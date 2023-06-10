import * as vscode from 'vscode';

import { EditorDocument } from './editorDocument';
import { EditorGroup } from './editorGroup';

export class EditorGroupTreeDataProvider implements vscode.TreeDataProvider<EditorGroup> {
	private _onDidChangeTreeData: vscode.EventEmitter<EditorGroup | undefined> = new vscode.EventEmitter<EditorGroup | undefined>();
  readonly onDidChangeTreeData: vscode.Event<EditorGroup | undefined> = this._onDidChangeTreeData.event;
  
  context: vscode.ExtensionContext;

  constructor(cont: vscode.ExtensionContext) {
    this.context = cont;
  }

  public get minimizedGroups() {
    return this.context.workspaceState.get<Array<EditorGroup>>('minimizedGroups') || [];
  }

	public refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	public getTreeItem(element: EditorGroup): vscode.TreeItem {
    return element;
  }

	public async getChildren(element?: EditorGroup): Promise<EditorGroup[] | undefined> {
    const minimizedGroups = this.minimizedGroups;
    if (element) {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri?.path ?? '';
      const documents = (element.documents || []).map(({ document }) => {
        const groupMember = new EditorGroup(document?.fileName.replace(`${root}/`, ''));
        groupMember.parent = element;
        return groupMember;
      });
      return documents;
    }
    
    const primed = minimizedGroups?.map((group) => {
      const documents = group.documents?.map(({ document, viewColumn }) => new EditorDocument(document, viewColumn));
      return new EditorGroup(
        group.label, 
        vscode.TreeItemCollapsibleState.Collapsed, 
        documents,
      );
    });
  
    await this.updateMinimizedGroups(primed);
    return primed;
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


  public async remove(group: EditorGroup): Promise<EditorGroup[]> {
    const minimizedGroups = this.minimizedGroups;
    const remaining = minimizedGroups.filter((mGroup) => mGroup !== group);
    await this.updateMinimizedGroups(remaining);
    this.refresh();
    return remaining;
  }

  public async minimize(update?: boolean): Promise<void> {
    const minimizedGroups = this.minimizedGroups;
    const documents: EditorDocument[] = [];
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

    if (update) {
      const picked = await this.pickMinimizedGroup(minimizedGroups);
      if (picked) {
        const updatedGroup = new EditorGroup(
          picked.label, 
          picked.collapsibleState, 
          documents,
        );
        const minimizedGroupsUpdated = await this.remove(picked);
        minimizedGroupsUpdated.push(updatedGroup);
        await this.updateMinimizedGroups(minimizedGroupsUpdated);
        vscode.window.showInformationMessage(`Minimized as: ${updatedGroup.label} (updated)`);
      }
    } else {
      const length = minimizedGroups.push(new EditorGroup(
        `Group ${minimizedGroups.length + 1}`, 
        vscode.TreeItemCollapsibleState.Collapsed, 
        documents,
      ));
      await this.updateMinimizedGroups(minimizedGroups);
      vscode.window.showInformationMessage(`Minimized as: ${minimizedGroups[length-1].label}`);
    }
    this.refresh();
  }

  dispose(): Thenable<void> {
    return this.clear();
  }

  clear(): Thenable<void> {
    return this.context.workspaceState.update('minimizedGroups', undefined);
  }

  public async rename(group: EditorGroup): Promise<void> {
    const minimizedGroups = this.minimizedGroups;
    const value = await vscode.window.showInputBox();
    const oldGroup = minimizedGroups.find((mGroup) => mGroup === group);

    if (oldGroup) {
      oldGroup.label = value || oldGroup.label;
    }

    await this.updateMinimizedGroups(minimizedGroups);
    this.refresh();
  }

  public async addToGroup(uri: vscode.Uri): Promise<void> {
    const minimizedGroups = this.minimizedGroups;
    const picked = await this.pickMinimizedGroup(minimizedGroups);
    if (picked) {
      const document = await vscode.workspace.openTextDocument(uri);
      if (document) {
        picked.documents?.push(new EditorDocument(document));
        vscode.window.showInformationMessage(`Added to ${picked.label}`);
      }
      picked.refresh();
      await this.updateMinimizedGroups(minimizedGroups);
    }
    this.refresh();
  }

  public async removeFromGroup(group: EditorGroup): Promise<void> {
    const minimizedGroups = this.minimizedGroups;
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

    await this.updateMinimizedGroups(minimizedGroups);
    this.refresh();
  }

  public async updateMinimizeGroup() {
    return await this.minimize(true);
  }

  private async pickMinimizedGroup(minimizedGroups: EditorGroup[]) {
    return await vscode.window.showQuickPick(minimizedGroups);
  }

  private async updateMinimizedGroups(minimizedGroups: EditorGroup[]) {
    await this.context.workspaceState.update('minimizedGroups', minimizedGroups);
    await vscode.commands.executeCommand('setContext', 'vscode-editor-group-minimizer.lengthMinimizedGroups', minimizedGroups.length);
  }
}
