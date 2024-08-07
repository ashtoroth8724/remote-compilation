import * as vscode from 'vscode';
import { TreeMachine, MachineItem, MachineList, MachinePathItem} from './treeMachine';
import { register } from 'module';
import {TreeMacro, MacroItem, MacroList, MacroLocal, MacroBuild, MacroRemote} from './treeMacro';

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
    vscode.commands.registerCommand('remote-compilation.connect', (machine: MachineItem) => {
        machine.toggleConnect();
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

}

export function deactivate() {}

