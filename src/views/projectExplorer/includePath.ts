/*
 * (c) Copyright IBM Corp. 2023
 */

import { ThemeIcon, WorkspaceFolder } from "vscode";
import { ContextValue } from "../../projectExplorerApi";
import IFSDirectory from "./ifsDirectory";
import * as path from "path";

export default class IncludePath extends IFSDirectory {
  static contextValue = ContextValue.includePath;

  constructor(public workspaceFolder: WorkspaceFolder, includePath: string) {
    super(workspaceFolder,
      {
        type: 'directory',
        name: path.posix.basename(includePath),
        path: includePath
      },
      {
        label: includePath
      }
    );
    this.contextValue = IncludePath.contextValue;
    this.iconPath = new ThemeIcon(`link`);
  }
}