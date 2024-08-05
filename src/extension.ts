import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const treeMachine = new TreeMachine();
    vscode.window.registerTreeDataProvider('remote-machines', treeMachine);

    vscode.commands.registerCommand('extension.myButtonCommand', (label: string) => {
        vscode.window.showInformationMessage(`Button clicked on ${label}`);
    });

    vscode.commands.registerCommand('extension.addMachine', async () => {
        await treeMachine.addMachine();
        treeMachine.refresh();
    });
    vscode.commands.registerCommand('extension.removeMachine', async () => {
        await treeMachine.removeMachine();
        treeMachine.refresh();
    });
    vscode.commands.registerCommand('extension.toggleConnect', (item: MachineItem) => {
        item.toggleConnect();
    });
}

export function deactivate() {}

class TreeMachine implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element instanceof TreeMachineItem) {
            return Promise.resolve(element.children || []);
        } else {
            return Promise.resolve(this.getItems());
        }
    }

    private getItems(): vscode.TreeItem[] {
        const items: vscode.TreeItem[] = [];
        const add_button = new ButtonItem('Add Machine', { command: 'extension.addMachine', title: 'Add Machine'});
		add_button.iconPath = new vscode.ThemeIcon('add');
		items.push(add_button);
        const rem_button = new ButtonItem('Remove Machine', { command: 'extension.removeMachine', title: 'Remove Machine' });
		rem_button.iconPath = new vscode.ThemeIcon('remove');
		items.push(rem_button);

        const treeMachines = new TreeMachineItem('Machine List:', this);
        treeMachines.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        treeMachines.children = this.getMachines().map(name => {
            const machineItem = new MachineItem(name, treeMachines);
            machineItem.onDidChangeDescription(() => {
                this._onDidChangeTreeData.fire(machineItem);
            });
            return machineItem;
        });
        items.push(treeMachines);

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
        }
    }

    async removeMachine() {
        const machineName = await vscode.window.showQuickPick(this.getMachines(), {
            placeHolder: 'Select machine to remove',
        });
        if (machineName) {
            const config = vscode.workspace.getConfiguration("remote-compilation");
            const machines: { name: string }[] = config.get('machines', []);
            const index = machines.findIndex(({ name }) => name === machineName);
            machines.splice(index, 1);
            await config.update('machines', machines, vscode.ConfigurationTarget.Global);
        }
    }

    getMachines(): string[] {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const machines: { name: string }[] = config.get('machines', []);
        return machines.map(({ name }) => name);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}

class ButtonItem extends vscode.TreeItem {
    constructor(label: string, command?: vscode.Command) {
        super(label);
        this.contextValue = 'button';
        this.command = command;
    }
}

class TreeMachineItem extends vscode.TreeItem {
    children: MachineItem[] | undefined;
    parent?: TreeMachine;

    constructor(label: string, parent?: TreeMachine) {
        super(label);
        this.parent = parent;
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

class MachineItem extends vscode.TreeItem {
    private _onDidChangeDescription: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeDescription: vscode.Event<void> = this._onDidChangeDescription.event;

    parent?: TreeMachineItem;
    status: string = 'offline';
    ip: string | undefined;

    terminal: vscode.Terminal | undefined;
    constructor(label: string, parent?: TreeMachineItem) {
        super(label);
        this.ip = label;
        this.parent = parent;
        this.command = { command: 'extension.toggleConnect', title: 'Connect', arguments: [this] };
        this.tooltip = "Click to connect";
        this.description = this.status;
		this.iconPath = new vscode.ThemeIcon('server');
        console.log("MachineItem created: ", this.label);
    }

    private connect() {
        this.status = 'connecting';
        const path_integrated_terminal: string = vscode.workspace.getConfiguration('terminal.integrated.env').get('windows') || '';
        this.terminal = vscode.window.createTerminal({ name: this.ip });
        this.terminal.show();
        this.terminal.sendText('ssh ' + this.label);
        this.status = 'focused';
    }

    private disconnect() {
        this.terminal?.dispose();
        this.status = 'offline';
    }

    toggleConnect() {
        if ((this.status === 'online')) {
			this.parent?.unfocusAll();
			this.terminal?.show();
			this.status = 'focused';
        } else if (this.status === 'offline') {
			this.parent?.unfocusAll();
            this.connect();
        } else if (this.status ==='focused') {
			this.disconnect();
		}
		this.refresh();
    }

    refresh() {
        console.log("refreshing status: ", this.status);
        this.description = this.status;
        this._onDidChangeDescription.fire();
    }
}