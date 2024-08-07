import { log } from 'console';
import path from 'path';
import * as vscode from 'vscode';
import { TreeMachine, MachineItem, MachineList, MachinePathItem} from './treeMachine';


export class TreeMacro implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        console.log('getChildren called with element:', element);
        if (element instanceof MacroList) {
            console.log('Returning children of MacroList:', element.children);
            return Promise.resolve(element.children || []);
        } else {
            console.log('Calling getItems to get root items');
            return Promise.resolve(this.getItems());
        }
    }

    getItems(): vscode.TreeItem[] {
        const items: vscode.TreeItem[] = [];        
        const macroBuildList = new MacroList("Build Macros");
        const macroRemoteList = new MacroList("Remote Macros");
        const macroLocalList = new MacroList("Local Macros");
        const macros = this.getMacros();
        macros.forEach(macro => {
            log(`Adding macro "${macro.name}": "${macro.command}" to group "${macro.group}"`);
            if (macro.group === "build") {
                macroBuildList.addChild(new MacroBuild(macro.name, macro.command, macroBuildList));
            } else if (macro.group === "remote") {
                macroRemoteList.addChild(new MacroRemote(macro.name, macro.command, macroRemoteList));
            } else if (macro.group === "local") {
                macroLocalList.addChild(new MacroLocal(macro.name, macro.command, macroLocalList));
            } else {
                console.log(`Macro ${macro.name} has an unkown group: ${macro.group}`);
            }
        });
        macroLocalList.addChild(new MacroLocal("echo Hello", "echo Hello", macroLocalList));


        items.push(macroLocalList);
        items.push(macroBuildList);
        items.push(macroRemoteList);

        return items;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setDescription(description: string, item: vscode.TreeItem) {
        console.log(`Setting description of ${item.label} to: ${description}`);
        item.description = description;
        this._onDidChangeTreeData.fire(item);
    }

    getMacros(): { name: string, command: string, group: string }[]  {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const macros: { name: string, command: string, group: string }[] = config.get('macros', []);
        log('Macros found:', macros);
        return macros;
    }
}

export class MacroList extends vscode.TreeItem {
    children: MacroItem[] | undefined;

    constructor(label: string) {
        super(label);
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.contextValue = 'macroList';
    }

    addChild(child: MacroItem) {
        if (!this.children) {
            this.children = [];
        }
        this.children.push(child);
    }

}

export interface MacroItem extends vscode.TreeItem {
    run(machine: MachineItem | undefined): void;
    getCommand(): string;
}


// execute the command initialized in a local terminal named "Remote Compilation"
export class MacroLocal extends vscode.TreeItem implements MacroItem {
    parent?: MacroList;
    commandString: string;
    constructor(label: string, commandString: string, parent: MacroList) {
        super(label);
        this.commandString = commandString;
        this.parent = parent;
        this.contextValue = 'macroItem';
    }

    run(): void {
        const terminal = vscode.window.terminals.find(terminal => terminal.name === "Remote Compilation");
        if (this.commandString && terminal) {
            terminal.show();
            terminal.sendText(this.commandString);
        } else if (this.commandString && !terminal) {
            const terminal = vscode.window.createTerminal("Remote Compilation");
            terminal.show();
            terminal.sendText(this.commandString);
        } else {
            vscode.window.showErrorMessage("No command to execute");
        }
    }

    getCommand(): string {
        return this.commandString;
    }
}

export class MacroBuild extends vscode.TreeItem implements MacroItem {
    parent?: MacroList;
    buildArg: string;
    constructor(label: string, buildArg: string, parent: MacroList) {
        super(label);
        this.buildArg = buildArg;
        this.parent = parent;
        this.contextValue = 'macroItem';
    }

    run(machine: MachineItem): void {
        if (machine) {
            const pathProject = machine.getSelectedPath();
            if (pathProject) {
                machine.executeCommand(`make -C ${pathProject} ${this.buildArg}`);
            } else {
                vscode.window.showErrorMessage("No path selected");
            }
        } else {
            vscode.window.showErrorMessage("No machine selected");
        }
    }

    getCommand(): string {
        return this.buildArg;
    }
}

export class MacroRemote extends vscode.TreeItem implements MacroItem {
    parent?: MacroList;
    commandString: string;
    constructor(label: string, commandString: string, parent: MacroList) {
        super(label);
        this.commandString = commandString;
        this.parent = parent;
        this.contextValue = 'macroItem';
    }

    run(machine: MachineItem): void {
        if (machine) {
            machine.executeCommand(this.commandString);
        } else {
            vscode.window.showErrorMessage("No machine selected");
        }
    }

    getCommand(): string {
        return this.commandString;
    }
}