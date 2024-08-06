// treeMachine.ts

import { log } from 'console';
import * as vscode from 'vscode';

export class TreeMachine implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;
    children: (MachineList | MachinePathList)[] | undefined;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element instanceof MachineList || element instanceof MachinePathList) {
            return Promise.resolve(element.children || []);
        } else {
            return Promise.resolve(this.getItems());
        }
    }

    private getItems(): vscode.TreeItem[] {
        const items: vscode.TreeItem[] = [];

        const treeMachines = new MachineList('Machines');
        treeMachines.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        treeMachines.children = this.getMachines().map(name => {
            const machineItem = new MachineItem(name);
            machineItem.onDidChangeDescription(() => {
                this.refreshPaths();
            });
            return machineItem;
        });
        items.push(treeMachines);

        const treePaths = new MachinePathList('Paths');
        treePaths.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        treePaths.children = this.getPaths();
        items.push(treePaths);

        this.children = [treeMachines, treePaths];

        return items;
    }

    async addMachine() {
        const machineName = await vscode.window.showInputBox({
            prompt: 'Enter machine name',
            placeHolder: 'user@host:port',
        });

        if (machineName) {
            const config = vscode.workspace.getConfiguration("remote-compilation");
            const machines: { name: string }[] = config.get('machines', []);
            machines.push({ name: machineName });
            await config.update('machines', machines, vscode.ConfigurationTarget.Global);
            this.refresh();
        }
    }

    async removeMachine(machineItem: MachineItem) {
        const machineName = machineItem.label;
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machines: { name: string }[] = config.get('machines', []);
        const index = machines.findIndex(({ name }) => name === machineName);
        machines.splice(index, 1);
        await config.update('machines', machines, vscode.ConfigurationTarget.Global);
        this.refresh();
    }

    getMachines(): string[] {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machines: { name: string }[] = config.get('machines', []);
        return machines.map(({ name }) => name);
    }

    getPaths(): MachinePathItem[] {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machinePaths: string[] = config.get('machinePaths', []);
        return machinePaths.map(path => new MachinePathItem(path));
    }

    refreshPaths(): void {
        const treePaths = this.children?.find(child => child instanceof MachinePathList) as MachinePathList;
        if (treePaths) {
            treePaths.children = this.getPaths();
            this._onDidChangeTreeData.fire(treePaths);
        }
    }

    setDescription(description: string, item: vscode.TreeItem) {
        console.log(`Setting description of ${item.label} to: ${description}`);
        item.description = description;
        this._onDidChangeTreeData.fire(item);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}

export class MachineList extends vscode.TreeItem {
    children: MachineItem[] | undefined;
    parent?: TreeMachine;

    constructor(label: string) {
        super(label);
        this.contextValue = 'machineList';
    }

    refresh() {
        this.parent?.refresh();
    }

    unfocusAll() {
        this.children?.forEach((child) => {
            if (child.status === 'focused') {
                child.status = 'online';
                child.refresh();
            }
        });
    }

    getFocused() {
        return this.children?.find((child) => child.status === 'focused');
    }
}

export class MachineItem extends vscode.TreeItem {
    private _onDidChangeDescription: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeDescription: vscode.Event<void> = this._onDidChangeDescription.event;

    parent?: MachineList;
    status: string = 'offline';
    ip: string | undefined;

    terminal: vscode.Terminal | undefined;
    constructor(label: string) {
        super(label);
        this.ip = label;
        this.description = this.status;
        this.iconPath = new vscode.ThemeIcon('server');
        this.contextValue = 'machineItem';
        const existingTerminal = vscode.window.terminals.find(terminal => terminal.name === this.ip);
        if (existingTerminal) {
            this.terminal = existingTerminal;
            this.status = 'online';
            this.terminal.show();
            this.refresh();
        }
        console.log("MachineItem created: ", this.label);
    }

    private connect() {
        this.status = 'connecting';
        this.terminal = vscode.window.createTerminal({ name: this.ip });
        this.terminal.show();
        this.terminal.sendText('ssh ' + this.label);
        this.status = 'focused';
    }

    disconnect() {
        this.terminal?.dispose();
        this.status = 'offline';
        this.refresh();
    }

    toggleConnect() {
        if ((this.status === 'online')) {
            this.parent?.unfocusAll();
            this.terminal?.show();
            this.status = 'focused';
        } else if (this.status === 'offline') {
            this.parent?.unfocusAll();
            this.connect();
        }
        this.refresh();
    }

    getPathList() {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machinePaths: string[] = config.get('machinePaths', []);
        const pathItems = machinePaths.map(path => new MachinePathItem(path));
        return pathItems;
    }

    refresh() {
        if (this.parent && this.parent.parent) {
            this.parent.parent.setDescription(this.status, this);
        } else {
            console.log("could not update description");
        }
    }
}

export class MachinePathList extends vscode.TreeItem {
    children: MachinePathItem[] | undefined;
    parent?: TreeMachine;

    constructor(label: string) {
        super(label);
        this.contextValue = 'machinePathList';
    }
}

export class MachinePathItem extends vscode.TreeItem {
    parent?: MachinePathList;

    constructor(label: string) {
        super(label);
        this.contextValue = 'machinePathItem';
    }
}