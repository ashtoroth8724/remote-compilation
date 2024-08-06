import * as vscode from 'vscode';
import { TreeMachine, MachineItem, MachineList, MachinePathItem, MachinePathList } from './treeMachine';

export function activate(context: vscode.ExtensionContext) {
    const treeMachine = new TreeMachine();
    vscode.window.registerTreeDataProvider('remote-machines', treeMachine);

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
}

export function deactivate() {}