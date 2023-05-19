/*
 * (c) Copyright IBM Corp. 2023
 */

import { ThemeIcon, TreeItemCollapsibleState, Uri, WorkspaceFolder, l10n, workspace } from "vscode";
import { ContextValue } from "../../projectExplorerApi";
import { ProjectExplorerTreeItem } from "./projectExplorerTreeItem";
import { ProjectManager } from "../../projectManager";
import LocalIncludePath from "./localIncludePath";
import RemoteIncludePath from "./remoteIncludePath";
import { getInstance } from "../../ibmi";
import * as path from "path";

/**
 * Tree item for Include Paths heading
 */
export default class IncludePaths extends ProjectExplorerTreeItem {
  static contextValue = ContextValue.includePaths;

  constructor(public workspaceFolder: WorkspaceFolder) {
    super(l10n.t('Include Paths'), TreeItemCollapsibleState.Collapsed);

    this.contextValue = IncludePaths.contextValue;
    this.iconPath = new ThemeIcon(`list-flat`);
  }

  async getChildren(): Promise<ProjectExplorerTreeItem[]> {
    let items: ProjectExplorerTreeItem[] = [];

    const iProject = ProjectManager.get(this.workspaceFolder);
    const state = await iProject?.getState();
    if (state && state.includePath) {
      for await (const includePath of state.includePath) {

        let includePathUri = Uri.file(includePath);
        try {
          const statResult = await workspace.fs.stat(includePathUri);

          // Absolute local include path
          items.push(new LocalIncludePath(this.workspaceFolder, includePath, includePathUri));
        } catch (e) {
          includePathUri = Uri.joinPath(this.workspaceFolder.uri, includePath);

          try {
            const statResult = await workspace.fs.stat(includePathUri);

            // Relative local include path
            items.push(new LocalIncludePath(this.workspaceFolder, includePath, includePathUri));
          } catch (e) {
            if (includePath.startsWith('/')) {
              // Absolute remote include path
              items.push(new RemoteIncludePath(this.workspaceFolder, includePath));
            } else {
              // Relative remote include path
              const ibmi = getInstance();
              const deploymentDirs = ibmi?.getStorage().getDeployment()!;
              const remoteDir = deploymentDirs[this.workspaceFolder.uri.fsPath];
              const absoluteIncludePath = path.posix.join(remoteDir, includePath);
              items.push(new RemoteIncludePath(this.workspaceFolder, absoluteIncludePath, { label: includePath }));
            }
          }
        }
      }
    }

    return items;
  }
}