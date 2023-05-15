/*
 * (c) Copyright IBM Corp. 2023
 */

import { ThemeIcon, TreeItemCollapsibleState, Uri, WorkspaceFolder } from "vscode";
import { ProjectExplorerTreeItem } from "./projectExplorerTreeItem";
import { ProjectManager } from "../../projectManager";
import ErrorItem from "./errorItem";
import Variable from "./variable";
import { ContextValue } from "../../projectExplorerApi";

/**
 * Tree item for the Variables heading
 */
export default class Variables extends ProjectExplorerTreeItem {
  static contextValue = ContextValue.variables;

  constructor(public workspaceFolder: WorkspaceFolder, unresolvedVariableCount: number) {
    super(`Variables`, TreeItemCollapsibleState.Collapsed);

    this.resourceUri = Uri.parse(`variables:${unresolvedVariableCount}`, true);
    this.contextValue = Variables.contextValue;
    this.iconPath = new ThemeIcon(`symbol-variable`);
  }

  async getChildren(): Promise<ProjectExplorerTreeItem[]> {
    let items: ProjectExplorerTreeItem[] = [];

    const iProject = ProjectManager.get(this.workspaceFolder);
    const possibleVariables = await iProject?.getVariables();
    if (!possibleVariables) {
      return [];
    }

    const actualValues = await iProject?.getEnv();
    if (!actualValues) {
      return [new ErrorItem(this.workspaceFolder, `Unable to retrieve environment variables`)];
    }

    items.push(...possibleVariables.map(
      varName => {
        return new Variable(this.workspaceFolder, varName, actualValues[varName]);
      }
    ));

    return items;
  }
}