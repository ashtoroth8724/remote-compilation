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
        macroBuildList.iconPath = new vscode.ThemeIcon('run-below');
        const macroRemoteList = new MacroList("Remote Macros");
        macroRemoteList.iconPath = new vscode.ThemeIcon('vm');
        const macroLocalList = new MacroList("Local Macros");
        macroLocalList.iconPath = new vscode.ThemeIcon('terminal');
        const macros = this.getMacros();
        if (macros.length > 0) {
            macros.forEach(macro => {
                if (!macro.command || !macro.group) {
                    console.log(`Macro ${macro} is missing a command or a group`);
                    return;
                } else if (!macro.name) {
                    macro.name = macro.command;
                }
                log(`Adding macro "${macro.name}": "${macro.command}" to group "${macro.group}"`);
                if (macro.group === "build") {
                    const macroBuild = new MacroBuild(macro.name, macro.command, macroBuildList, macro.subPath, macro.cleanCommand);
                    if (macro.buildMachineIP) {
                        macroBuild.buildMachineIP = macro.buildMachineIP;
                    }
                    if (macro.makefileName) {
                        macroBuild.makefileName = macro.makefileName;
                    }
                    macroBuildList.addChild(macroBuild);
                } else if (macro.group === "remote") {
                    macroRemoteList.addChild(new MacroRemote(macro.name, macro.command, macroRemoteList));
                } else if (macro.group === "local") {
                    macroLocalList.addChild(new MacroLocal(macro.name, macro.command, macroLocalList));
                } else {
                    console.log(`Macro ${macro.name} has an unkown group: ${macro.group}`);
                }
            });
        }

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

    getMacros():  { name: string, command: string, group: string, cleanCommand: string, subPath: string , buildMachineIP: string, makefileName: string}[] {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const macros: { name: string, command: string, group: string, cleanCommand: string, subPath: string , buildMachineIP: string, makefileName: string}[] = config.get('macros', []);
        log('Macros found:', macros);
        return macros;
    }

    async addMacro(macroList: MacroList | undefined) {
        const macroCommand = await vscode.window.showInputBox({ prompt: "Enter the command to execute" });
        let macroType: string | undefined;
        if (macroList?.label === "Local Macros") {
            macroType = "local";
        } else if (macroList?.label === "Remote Macros") {
            macroType = "remote";
        } else if (macroList?.label === "Build Macros") {
            macroType = "build";
        }
        if (!macroType) {
            macroType = await vscode.window.showQuickPick(["local", "remote", "build"], { placeHolder: "Select the type of macro" });
        }
        if (macroCommand && macroType) {
            const config = vscode.workspace.getConfiguration("remote-compilation");
            let configInfo = config.inspect('macros');
            let macros: { name: string, command: string, group: string }[] = config.get('macros', []);
            if (!Array.isArray(macros)) {
                macros = [];
            }
            macros.push({name: macroCommand, command: macroCommand, group: macroType });
            if (configInfo && configInfo.workspaceValue !== undefined) {
                await config.update('macros', macros, vscode.ConfigurationTarget.Workspace);
                console.log('Added macro to workspace:', macroCommand);
            } else if (configInfo && configInfo.globalValue !== undefined) {
                await config.update('macros', macros, vscode.ConfigurationTarget.Global);
                console.log('Added macro to user:', macroCommand);
            } else {
                // Handle case where there are no existing macros
                await config.update('macros', macros, vscode.ConfigurationTarget.Global);
                console.log('Added macro to user (default):', macroCommand);
            }
            this.refresh();
        }
    }

    async removeMacro(macroItem: MacroItem) {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        const configInfo = config.inspect('macros');
        const macros: { name: string, command: string, group: string }[] = config.get('macros', []);
        const index = macros.findIndex(macro => macro.command === macroItem.getCommand());
        if (index !== -1) {
            macros.splice(index, 1);
            if (configInfo && configInfo.workspaceValue) {
                config.update('macros', macros, vscode.ConfigurationTarget.Workspace);
            } else if (configInfo && configInfo.globalValue) {
                config.update('macros', macros, vscode.ConfigurationTarget.Global);
            }
            this.refresh();
        }
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
    run(machine?: MachineItem | undefined, machines?: TreeMachine | undefined, type?: string | undefined): void;
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
        this.tooltip = commandString;
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
    cleanArg?: string;
    subPath?: string;
    buildMachineIP?: string;
    makefileName?: string;
    constructor(label: string, buildArg: string, parent: MacroList, subPath?: string, cleanArg?: string) {
        super(label);
        this.buildArg = buildArg;
        this.parent = parent;
        this.contextValue = 'buildItem';
        this.tooltip = `make ${buildArg}`;
        if (subPath) {
            this.subPath = subPath;
            this.tooltip = `make ${buildArg} in ${subPath}`;
        }
        if (cleanArg) {
            this.cleanArg = cleanArg;
            this.contextValue = 'buildItemWithClean';
        }
    }

    async run(machine?: undefined, machines?: TreeMachine | undefined, type?: string | undefined): Promise<void> {
        if (!this.cleanArg && (type === "clean" || type === "cleanAndBuild")) {
            vscode.window.showErrorMessage("No clean command defined");
            return;
        } else if (machines && (type === "build" || type === "cleanAndBuild" || type === "clean")) {
            let machine: MachineItem | undefined;
            let terminal: vscode.Terminal | undefined;
            if (this.buildMachineIP) {
                machine = machines.getMachineFromIP(this.buildMachineIP);
                if (!machine) {
                    vscode.window.showErrorMessage(`No machine with IP ${this.buildMachineIP}`);
                    return;
                }
                await machine.toggleConnect();
                if (!machine.getSelectedPath() && machines.defaultPath) {
                    machine.getDefaultPath();
                }
                if (!machine.getSelectedPath()) {
                    vscode.window.showErrorMessage("No path selected");
                    return;
                }
                terminal = machine.terminal;
            } else {
                // running build loccally
                terminal = vscode.window.terminals.find(terminal => terminal.name === "Remote Compilation");
                if (!terminal) {
                    terminal = vscode.window.createTerminal("Remote Compilation");
                }
            }
            if (!terminal) {
                vscode.window.showErrorMessage("No terminal found");
                return;
            }
            terminal.show();
            terminal.sendText(this.getMakeCommand(type));
        }
    }

    getMakeCommand(type: string): string {
        let commandString = "make";
        if (this.subPath) {
            commandString = `${commandString} -C ${this.subPath}`;
        }
        if (this.makefileName) {
            commandString = `${commandString} -f ${this.makefileName}`;
        }
        if (type === "clean") {
            commandString = `${commandString} ${this.cleanArg}`;
        } else if (type === "build") {
            commandString = `${commandString} ${this.buildArg}`;
        } else if (type === "cleanAndBuild") {
            commandString = `${commandString} ${this.cleanArg}; ${commandString} ${this.buildArg}`;
        } else {
            commandString = "";
        }
        return commandString;
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
        this.tooltip = commandString;
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