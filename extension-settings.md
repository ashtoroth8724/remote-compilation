# Remote Compilation JSON Settings

- [Description of the settings](#description-of-the-settings)
  - [+ `remote-compilation.machines` : list](#-remote-compilationmachines--list)
  - [+ `remote-compilation.macros`: list](#-remote-compilationmacros-list)
  - [+ `remote-compilation.remoteRoot` : string](#-remote-compilationremoteroot--string)
  - [+ `remote-compilation.remoteProjectPath` : string](#-remote-compilationremoteprojectpath--string)
  - [+ `remote-compilation.disablePasswordWarnings` : boolean](#-remote-compilationdisablepasswordwarnings--boolean)
  - [+ `remote-compilation.clearOutputBeforeExecution` : boolean](#-remote-compilationclearoutputbeforeexecution--boolean)
  - [+ `remote-compilation.connectionTimeout` : number](#-remote-compilationconnectiontimeout--number)
- [Examples](#examples)
  - [+ code-workspace Template](#-code-workspace-template)
  - [+ settings.json Template (User)](#-settingsjson-template-user)


## Description of the settings

### + `remote-compilation.machines` : list
Intended to be placed in user settings. They are the machines to run the macros on.
| Item sub-setting    | Description                                                                                   |
|---------------------|-----------------------------------------------------------------------------------------------|
| `name`              | The name of the machine (for display only).                                                   |
| `paths`             | A list of the project paths on the machine (in case the default project path does not fit you).|
| `user`              | The user to connect to on the remote machine.                                                 |
| `ip`                | The IP or host of the machine.                                                                |
| `port`              | The port of the machine to connect to (22 by default).                                        |
| `password`          | The password of the machine **<ins>/!\\</ins> IT IS HIGHLY RECOMMENDED TO USE RSA KEYS <ins>/!\\</ins>**.|

### + `remote-compilation.macros`: list
Intended to be placed in user settings. They are the macros to run.
| Item sub-setting    | `group`  | Description                                                                                   |
|---------------------|----------|-----------------------------------------------------------------------------------------------|
| `name`              | All      | The name of the macro (for display only).                                                     |
| `group`             | All      | The type of the macro [`build`, `local`, `remote`, `vscode`].                                 |
| `command`           | `local`  | The command to execute (in your local or machine terminal).                                   |
| `command`           | `remote` | The command to execute (in your local or machine terminal).                                   |
| `command`           | `vscode` | The VS Code command to execute (`workbench.action.reloadWindow` for example reloads VS Code's window). |
| `command`           | `build`  | The build argument of your makefile.                                                          |
| `cleanCommand`      | `build`  | The clean argument of your makefile.                                                          |
| `subPath`           | `build`  | The path to your makefile (according to your project root defined in the machine).            |
| `buildMachineIP`    | `build`  | The machine IP to build on (run locally if not specified).                                    |
| `makefileName`      | `build`  | The name of the makefile (`makefile` if not specified).                              |
  
### + `remote-compilation.remoteRoot` : string
Intended to be placed in user settings. It is intended to be the root folder (or shared folder) on the VM. The extension uses it in combination with `remote-compilation.remoteProjectPath` to generate the default path.

### + `remote-compilation.remoteProjectPath` : string
Intended to be placed in the workspace settings. It is the path to the project from the VM root. The extension uses it in combination with `remote-compilation.remoteRoot` to generate the default path.

### + `remote-compilation.disablePasswordWarnings` : boolean
You should always consider using RSA keys to secure your SSH connection ([follow this tutorial](https://kb.iu.edu/d/aews)), but just in case you can't and don't want to be annoyed by pop-ups, here is a workaround.

### + `remote-compilation.clearOutputBeforeExecution` : boolean
Whether to clear the Output of a machine before running a command.\
Defaults to False.

### + `remote-compilation.connectionTimeout` : number
Connection timeout in seconds.\
Defaults to 5 seconds.

## Examples

### + code-workspace Template
This is a settings example you can use for your ### + workspace_name.code-workspace file.
```json
{
    "extensions": {
        "recommendations": [
            "ashtoroth.remote-compilation"
        ]
    },
    "folders": [
        {
            "path": "."
        }
    ],
    "settings": {
        // Macros added to the workspace will end up here
        // You can change their name and/or the order in which they are displayed
        "remote-compilation.macros": [
            {
                "name": "Windows",
                "command": "all",
                "group": "build",
                "makefileName": "makefile_windows",
                "buildMachineIP": "192.168.56.111",
                "cleanCommand": "clean",
                "subPath": "src"
            },
            {
                "name": "Reload VS Code window",
                "command": "workbench.action.reloadWindow",
                "group": "vscode"
            },
            {
                "name": "Hello Local",
                "command": "echo 'Hello from local terminal!'",
                "group": "local"
            },
            {
                "name": "Hello Remote",
                "command": "echo 'Hello from remote terminal!'",
                "group": "remote"
            }
        ],
        // This setting will be used to determine the remote project path
        "remote-compilation.default.remoteProjectPath": "project1"
    }
}
```

### + settings.json Template (User)
This is a settings example for settings.json (user).
```json
{
    "remote-compilation.default.remoteRoot": "/root/projects",
    "remote-compilation.machines": [
        {
            "name": "Raspberry Pi",
            "user": "pi",
            "ip": "192.168.0.100",
            "paths": [
                "/root/projects/specialProject"
            ],
            "port": 22,
            "password": "raspberry"
        }
    ],
}
```
> Note: These two examples together will create the "default path": `/root/projects/project1`\
> [would you like to know more](README.md#-default-paths)