// treeMachine.ts

import { log } from 'console';
import path from 'path';
import * as vscode from 'vscode';

export class TreeMachine implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;
    children: MachineList | undefined;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        console.log('getChildren called with element:', element);
        if (element instanceof MachineList) {
            console.log('Returning children of MachineList:', element.children);
            return Promise.resolve(element.children || []);
        } else if (element instanceof MachineItem) {
            console.log('Returning children of MachineItem:', element.children);
            return Promise.resolve(element.children || []);
        } else {
            console.log('Calling getItems to get root items');
            return Promise.resolve(this.getItems());
        }
    }
    
    private getItems(): vscode.TreeItem[] {
        console.log('getItems called');
        const items: vscode.TreeItem[] = [];
    
        const machineList = new MachineList('Machines', this);
        machineList.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        const machines = this.getMachines();
        machines.forEach((machine) => {
            let machineItem: MachineItem;
            if (machine.name) {
                machineItem = new MachineItem(machine.name, machineList);
                machineItem.tooltip = machine.host;
                machineItem.ip = machine.host;
            } else if (machine.host) {
                machineItem = new MachineItem(machine.host, machineList);
                machineItem.ip = machine.host;
            } else {
                console.error('Machine has no name or host:', machine);
                return;
            }
            if (machine.paths) {
                machine.paths.forEach((path) => {
                    const pathItem = new MachinePathItem(path, machineItem);
                    machineItem.addChild(pathItem);
                });
            }
            if (machine.port) {
                machineItem.port = machine.port;
            }
            if (machine.password) {
                machineItem.password = 'password';
                if (machine.name) {
                    vscode.window.showInformationMessage(`Warning: Password for ${machine.name} is stored in plain text`);
                } else if (machine.host) {
                    vscode.window.showInformationMessage(`Warning: Password for ${machine.host} is stored in plain text`);
                }
            }
            machineList.addChild(machineItem);
        });

        items.push(machineList);
    
        this.children = machineList;
    
        console.log('Items created:', items);
        return items;
    }
    
    async addMachine() {
        const machineName = await vscode.window.showInputBox({
            prompt: 'Enter machine name',
            placeHolder: 'user@host:port',
        });
    
        if (machineName) {
            console.log('Adding machine:', machineName);
            const config = vscode.workspace.getConfiguration("remote-compilation");
            const machines: { name: string }[] = config.get('machines', []);
            machines.push({ name: machineName });
            await config.update('machines', machines, vscode.ConfigurationTarget.Global);
            console.log('Machine added to configuration:', machines);
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


    getMachines(): { name: string, paths: string[], port: string, host: string, password: string }[]  {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machines: { name: string, paths: string[], port: string, host: string, password: string }[] = config.get('machines', []);
        log('Machines found:', machines);
        return machines;
    }

    setDescription(description: string, item: vscode.TreeItem) {
        console.log(`Setting description of ${item.label} to: ${description}`);
        item.description = description;
        this._onDidChangeTreeData.fire(item);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async addMachinePath(machineItem: MachineItem) {
        await vscode.window.showInputBox({
            prompt: 'Enter path',
            placeHolder: '/absolute/remote/path/to/your/project',
        }).then((path) => {
            if (path) {
                try {
                    const config = vscode.workspace.getConfiguration("remote-compilation");
                    const machines: { name: string, paths?: string[] }[] = config.get('machines', []);
                    const machine = machines.find(({ name }) => name === machineItem.label);
                    if (machine) {
                        if (machine.paths) {
                            machine.paths.push(path);
                        } else {
                            machine.paths = [path];
                        }
                        config.update('machines', machines, vscode.ConfigurationTarget.Global);
                        console.log('Path added to machine:', machine);
                    } else {
                        console.error('Machine not found:', machineItem.label);
                    }
                } catch (error) {
                    console.error('Error updating machine paths:', error);
                }
            } else {
                console.log('No path entered');
            }
        });
        this._onDidChangeTreeData.fire(machineItem);
    }

    async removeMachinePath(pathItem: MachinePathItem) {
        const machineItem = pathItem.parent;
        const path = pathItem.label;
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machines: { name: string, paths?: string[] }[] = config.get('machines', []);
        const machine = machines.find(({ name }) => name === machineItem?.label);
        if (machine && machine.paths) {
            const index = machine.paths.findIndex(p => p === path);
            machine.paths.splice(index, 1);
            await config.update('machines', machines, vscode.ConfigurationTarget.Global);
        }
        this._onDidChangeTreeData.fire(pathItem);
    }

    getFocused() {
        return this.children?.getFocused();
    }
}

export class MachineList extends vscode.TreeItem {
    children: MachineItem[] | undefined;
    parent?: TreeMachine;

    constructor(label: string, parent?: TreeMachine) {
        super(label);
        this.parent = parent;
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


    addChild(child: MachineItem) {
        if (!this.children) {
            this.children = [];
        }
        this.children.push(child);
    }
}

export class MachineItem extends vscode.TreeItem {
    private _onDidChangeDescription: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeDescription: vscode.Event<void> = this._onDidChangeDescription.event;

    parent?: MachineList;
    children?: MachinePathItem[];
    status: string = 'offline';
    ip?: string;
    port?: string;
    password?: string;

    terminal: vscode.Terminal | undefined;
    constructor(label: string, parent: MachineList) {
        super(label);
        this.parent = parent;
        this.description = this.status;
        this.iconPath = new vscode.ThemeIcon('server');
        this.contextValue = 'machineItem';
        const existingTerminal = vscode.window.terminals.find(terminal => terminal.name === this.label?.toString());
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
        this.terminal = vscode.window.createTerminal({ name: this.label?.toString() });
        this.terminal.show();
        if (this.port) {
            this.terminal.sendText('ssh -p ' + this.port + ' ' + this.ip);
        } else {
            this.terminal.sendText('ssh ' + this.label);
        }
        if (this.password) {
            this.terminal.sendText(this.password);
        }
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

    unselectAllPath() {
        this.children?.forEach((child) => {
            if (child.description === 'selected') {
                child.unselect();
            }
        });
    }

    executeCommand(command: string) {
        this.terminal?.show();
        this.terminal?.sendText(command);
    }

    getSelectedPath(): string | undefined {
        const selectedPath = this.children?.find((child) => child.description === 'selected')?.label?.toString();
        log("Selected path: ", selectedPath);
        return selectedPath;
    }

    refresh() {
        if (!this.parent) {
            console.log(`could not find parent of ${this.label}`)
        } else if (!this.parent.parent) {
            console.log(`Could not find parent of ${this.parent.label}`)
        } else {
            if (this.status === 'focused') {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            } else {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            }
            this.parent.parent.setDescription(this.status, this);
        }
    }
    addChild(child: MachinePathItem) {
        if (!this.children) {
            this.children = [];
        }
        this.children.push(child);
    }
}

export class MachinePathItem extends vscode.TreeItem {
    parent?: MachineItem;

    constructor(label: string, parent: MachineItem) {
        super(label);
        this.parent = parent;
        this.contextValue = 'machinePathItem';
        this.tooltip = "Click to select";
        this.command = { command: 'remote-compilation.selectPath', title: 'Select', arguments: [this] };
        this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified');
    }

    select() {
        this.parent?.unselectAllPath();
        this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-disabled');
        this.parent?.parent?.parent?.setDescription("selected", this);
    }

    unselect() {
        this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified');
        this.parent?.parent?.parent?.setDescription("", this);
    }

}