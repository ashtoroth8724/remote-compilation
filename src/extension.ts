import * as vscode from 'vscode';
import { TreeMachine, MachineItem, MachinePathItem} from './treeMachine';
import { register } from 'module';
import {TreeMacro, MacroItem, MacroList, MacroLocal, MacroBuild, MacroRemote} from './treeMacro';
import * as path from 'path';

//npm install -S appdata-path
import getAppDataPath from "appdata-path";

export function activate(context: vscode.ExtensionContext) {
    const treeMachine = new TreeMachine();
    vscode.window.registerTreeDataProvider('remote-machines', treeMachine);

    const treeMacro = new TreeMacro();
    vscode.window.registerTreeDataProvider('remote-macros', treeMacro);

    // Commands of TreeMachine
    vscode.commands.registerCommand('remote-compilation.addMachine', async () => {
        await treeMachine.addMachine();
        treeMachine.refresh();
    });
    vscode.commands.registerCommand('remote-compilation.removeMachine', async (machine: MachineItem) => {
        await treeMachine.removeMachine(machine);
        treeMachine.refresh();
    });
    vscode.commands.registerCommand('remote-compilation.connect', async (machine: MachineItem) => {
        await machine.toggleConnect();
    });
    vscode.commands.registerCommand('remote-compilation.disconnect', (machine: MachineItem) => {
        machine.disconnect();
    });
    vscode.commands.registerCommand('remote-compilation.addPath', async (machine: MachineItem) => {
        await treeMachine.addMachinePath(machine);
        treeMachine.refresh();
    });
    vscode.commands.registerCommand('remote-compilation.removePath', async (path: MachinePathItem) => {
        await treeMachine.removeMachinePath(path);
        treeMachine.refresh();
    });
    vscode.commands.registerCommand('remote-compilation.selectPath', async (path: MachinePathItem) => {
        path.select();
    });
    vscode.commands.registerCommand('remote-compilation.unselectPath', async (path: MachinePathItem) => {
        path.unselect();
    });
    vscode.commands.registerCommand('remote-compilation.refreshTreeMachine', () => {
        treeMachine.refresh();
    });


    //commands of treeMacro
    vscode.commands.registerCommand('remote-compilation.runMacro', (macro: MacroItem) => {
        if (macro instanceof MacroLocal) {
            macro.run();
        } else {
            // récuperer la machine focus et la passer en argument à run
            const focusedMachine = treeMachine.getFocused();
            if (focusedMachine) {
                macro.run(focusedMachine);
            } else {
                vscode.window.showErrorMessage("No machine focused to run the macro on");
            }
        }
    });
    vscode.commands.registerCommand('remote-compilation.refreshTreeMacro', () => {
        treeMacro.refresh();
    });
    vscode.commands.registerCommand('remote-compilation.addMacro', async (macroList: MacroList) => {
        await treeMacro.addMacro(macroList);
        treeMacro.refresh();
    });
    vscode.commands.registerCommand('remote-compilation.removeMacro', async (macro: MacroItem) => {
        await treeMacro.removeMacro(macro);
        treeMacro.refresh();
    });


    async function runMacroBuild(macro: MacroItem, type:string){
        if (macro instanceof MacroBuild){
            await macro.run(undefined, treeMachine, type);
        } else {
            vscode.window.showErrorMessage("The macro is not a build macro");
        }
    }

    vscode.commands.registerCommand('remote-compilation.cleanMacro', async (macro: MacroItem) => {
        await runMacroBuild(macro, "clean");
    });
    vscode.commands.registerCommand('remote-compilation.cleanAndBuildMacro', async (macro: MacroItem) => {
        await runMacroBuild(macro, "cleanAndBuild");
    });
    vscode.commands.registerCommand('remote-compilation.buildMacro', async (macro: MacroItem) => {
        await runMacroBuild(macro, "build");
    });



    // global commands
    vscode.commands.registerCommand('remote-compilation.editConfig', async (item: vscode.TreeItem | undefined) => {
        const config = vscode.workspace.getConfiguration("remote-compilation");
        let configType = "user";
        if (item instanceof MachineItem) {
            const configInfo = config.inspect('machines');
            if (configInfo && configInfo.workspaceValue !== undefined) {
                configType = "workspace";
            }
        } else if (item instanceof MachinePathItem) {
            const configInfo = config.inspect('paths');
            if (configInfo && configInfo.workspaceValue !== undefined) {
                configType = "workspace";
            }
        } else if (item instanceof MacroBuild || item instanceof MacroRemote || item instanceof MacroLocal) {
            const configInfo = config.inspect('macros');
            if (configInfo && configInfo.workspaceValue !== undefined) {
                configType = "workspace";
            }
        }

        await openSettings(configType);
        });

}

export function deactivate() {}


async function openSettings(configType: string) {
    let settingsPath: string;
    if (configType === 'user') {
        //path is user/APPDATA/Roaming/Code/User/settings.json
        settingsPath = path.join(getAppDataPath("Code"), 'User', 'settings.json');
    } else if (configType === 'workspace') {
        const workspaceFile = vscode.workspace.workspaceFile;
        if (!workspaceFile) {
            vscode.window.showErrorMessage('No workspace is open.');
            return;
        }
        settingsPath = workspaceFile.fsPath;
    } else {
        vscode.window.showErrorMessage('Invalid config type.');
        return;
    }

    try {
        const document = await vscode.workspace.openTextDocument(settingsPath);
        const editor = await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open settings: ${error}`);
    }
}