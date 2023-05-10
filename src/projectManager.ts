/*
 * (c) Copyright IBM Corp. 2023
 */

import { QuickPickItem, Uri, window, workspace, WorkspaceFolder } from "vscode";
import { IProject } from "./iproject";
import { ProjectExplorerTreeItem } from "./views/projectExplorer/projectExplorerTreeItem";
import Project from "./views/projectExplorer/project";

export class ProjectManager {
    private static loaded: { [index: number]: IProject } = {};
    private static activeProject: IProject | undefined;

    public static load(workspaceFolder: WorkspaceFolder) {
        if (!this.loaded[workspaceFolder.index]) {
            const iProject = new IProject(workspaceFolder);
            this.loaded[workspaceFolder.index] = iProject;

            if (!this.activeProject) {
                this.activeProject = this.loaded[workspaceFolder.index];
            }
        }
    }

    public static get(workspaceFolder: WorkspaceFolder): IProject | undefined {
        return this.loaded[workspaceFolder.index];
    }

    public static getActiveProject(): IProject | undefined {
        return this.activeProject;
    }

    public static clear() {
        this.loaded = {};
    }

    public static clearActiveProject() {
        this.activeProject = undefined;
    }

    public static loadProjects() {
        const workspaceFolders = workspace.workspaceFolders;

        if (workspaceFolders && workspaceFolders.length > 0) {
            workspaceFolders.map(folder => {
                ProjectManager.load(folder);
            });
        }
    }

    public static setActiveProject(workspaceFolder: WorkspaceFolder) {
        this.activeProject = this.loaded[workspaceFolder.index];
    }

    public static async selectProject(): Promise<IProject | undefined> {
        switch (Object.keys(this.loaded).length) {
            case 0:
                window.showErrorMessage('Please open a local workspace folder.');
                break;
            case 1:
                return this.loaded[0];
            default:
                const projectItems: QuickPickItem[] = [];
                for (const index in this.loaded) {
                    const iProject = this.loaded[index];

                    const state = await iProject.getState();
                    if (state) {
                        projectItems.push({ label: iProject.getName(), description: state.description });
                    }
                }

                const selectedProject = await window.showQuickPick(projectItems, {
                    placeHolder: 'Select a project'
                });

                if (selectedProject) {
                    for (const index in this.loaded) {
                        const iProject = this.loaded[index];

                        if (iProject.getName() === selectedProject.label) {
                            return iProject;
                        }
                    }
                }
        }

        return;
    }

    public static getProjects(): IProject[] {
        let projects = [];
        for (const index in this.loaded) {
            projects.push(this.loaded[index]);
        }

        return projects;
    }

    public static getProjectFromActiveTextEditor(): IProject | undefined {
        let activeFileUri = window.activeTextEditor?.document.uri;
        activeFileUri = activeFileUri?.scheme === 'file' ? activeFileUri : undefined;

        if (activeFileUri) {
            return this.getProjectFromUri(activeFileUri);
        }
    }

    public static getProjectFromUri(uri: Uri): IProject | undefined {
        const workspaceFolder = workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
            return ProjectManager.get(workspaceFolder);
        }
    }

    public static getProjectFromTreeItem(element: ProjectExplorerTreeItem) {
        if (element.workspaceFolder) {
            return ProjectManager.get(element.workspaceFolder);
        }
    }

    public static pushExtensibleChildren(callback: (iProject: IProject) => Promise<ProjectExplorerTreeItem[]>) {
        Project.callBack.push(callback);
    }
}