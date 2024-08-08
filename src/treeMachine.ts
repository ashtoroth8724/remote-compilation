// treeMachine.ts
import * as vscode from 'vscode';
import * as ping from 'ping';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class TreeMachine implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;
    children: MachineItem[] | undefined;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        console.log('getChildren called with element:', element);
        if (element instanceof MachineItem) {
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
        const machines = this.getMachines();
        machines.forEach((machine) => {
            let machineItem: MachineItem;
            if (machine.name && machine.user && machine.ip) {
                machineItem = new MachineItem(machine.name, this);
                machineItem.tooltip = `${machine.user}@${machine.ip}`;
                machineItem.ip = machine.ip;
            } else if (machine.user && machine.ip) {
                machineItem = new MachineItem(`${machine.user}@${machine.ip}`, this);
                machineItem.ip = machine.ip;
            } else {
                console.error('Machine has no ip and user:', machine);
                return;
            }
            machineItem.ip = machine.ip;
            machineItem.user = machine.user;
            if (machine.paths) {
                machine.paths.forEach((path) => { /* TODO: Add path handling logic here */ });
            }
            if (machine.port) { /* TODO: Add port handling logic here */ }
            if (machine.password) { /* TODO: Add password handling logic here */ }
            items.push(machineItem);
        });

        this.children = items as MachineItem[];
        console.log('Items created:', items);
        return items;
    }
    
    async addMachine() {
        const userIP = await vscode.window.showInputBox({
            prompt: 'Enter machine name',
            placeHolder: 'user@ip',
        });
        if (!userIP) {
            return;
        }
        const [user, ip] = userIP.split('@');
        if (!user && !ip) {
            vscode.window.showErrorMessage('Invalid machine name, please enter a valid user@ip');
            return;
        }
        console.log('Adding machine:', userIP);
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machines: { name: string, paths: string[], port: number, password: string, ip: string, user: string }[] = config.get('machines', []);
        machines.push({ name: userIP, paths: [], port: 22, password: '', ip: ip, user: user });
        await config.update('machines', machines, vscode.ConfigurationTarget.Global);
        console.log('Machine added to configuration:', machines);
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

    getMachines(): { name: string, paths: string[], port: number, password: string, ip: string, user: string }[]  {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machines: { name: string, paths: string[], port: number, password: string, ip: string, user: string }[] = config.get('machines', []);
        console.log('Machines found:', machines);
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
            if (path) { /* TODO: Add path handling logic here */ } else { /* Handle no path entered */ }
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
        return this.children?.find((child) => child.status === 'focused');
    }

    getMachineFromName(name: string): MachineItem | undefined {
        return this.children?.find((child) => child.label === name);
    }
}

export class MachineItem extends vscode.TreeItem {
    private _onDidChangeDescription: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeDescription: vscode.Event<void> = this._onDidChangeDescription.event;

    parent?: TreeMachine;
    children?: MachinePathItem[];
    status: string = 'offline';
    ip?: string;
    port?: string;
    password?: string;
    user?: string;

    terminal: vscode.Terminal | undefined;
    constructor(label: string, parent: TreeMachine) {
        super(label);
        this.parent = parent;
        this.description = this.status;
        this.iconPath = new vscode.ThemeIcon('vm');
        this.contextValue = 'machineItem';
        const existingTerminal = vscode.window.terminals.find(terminal => terminal.name === this.label?.toString());
        if (existingTerminal) {
            this.terminal = existingTerminal;
            this.status = 'online';
            this.terminal.show();
            this.refresh();
        }
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        console.log("MachineItem created: ", this.label);
    }

    private async connect() {
        this.status = 'connecting';
        this.refresh();

        //try to ping the machine to check if it is online
        const res = await ping.promise.probe(this.ip);
        if (!res.alive) {
            vscode.window.showErrorMessage(`machine ${this.label} is unreachable`);
            this.status = 'offline';
            this.refresh();
            return;
        }

        this.terminal = vscode.window.createTerminal({ name: this.label?.toString() });
        this.terminal.show();
        if (this.port) {
            this.terminal.sendText(`ssh -p ${this.port} ${this.user}@${this.ip}`);
        } else {
            this.terminal.sendText(`ssh ${this.user}@${this.ip}`);
        }
        console.log(`Connected to ${this.label}, on ${this.ip}, port ${this.port}`);
        if (this.password) {
            await sleep(5000); //TODO: find a better way to wait for the terminal to be ready
            this.terminal.sendText(this.password);
            console.log('Password sent');
        }
        this.status = 'focused';
    }

    disconnect() {
        this.terminal?.dispose();
        this.status = 'offline';
        this.refresh();
    }

    async toggleConnect() {
        if ((this.status === 'online')) {
            this.parent?.children?.forEach(child => child.status = 'online');
            this.terminal?.show();
            this.status = 'focused';
        } else if (this.status === 'offline') {
            this.parent?.children?.forEach(child => child.status = 'online');
            await this.connect();
        }
        this.refresh();
    }

    unselectAllPath() {
        this.children?.forEach((child) => {
            if (child.description === 'selected') { /* TODO: Add unselect logic here */ }
        });
    }

    executeCommand(command: string) {
        this.terminal?.show();
        this.terminal?.sendText(command);
    }

    getSelectedPath(): string | undefined {
        const selectedPath = this.children?.find((child) => child.description === 'selected')?.label?.toString();
        console.log("Selected path: ", selectedPath);
        return selectedPath;
    }

    refresh() {
        if (!this.parent) {
            console.log(`could not find parent of ${this.label}`);
        } else {
            if (this.status === 'focused') { /* TODO: Add focused logic here */ } else if (this.status === 'connecting') { /* TODO: Add connecting logic here */ } else if (this.status === 'online') { /* TODO: Add online logic here */ } else { /* TODO: Add offline logic here */ }
            this.parent.setDescription(this.status, this);
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
        this.parent?.parent?.setDescription("selected", this);
    }

    unselect() {
        this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified');
        this.parent?.parent?.setDescription("", this);
    }
}