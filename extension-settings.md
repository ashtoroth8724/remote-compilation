# Remote Compilation JSON Settings

- [description](#description-of-the-settings)
- [examples](#examples)


## Description of the settings

### - `remote-compilation.machines`
Intended to be placed in user settings. They are the machines to run the macros on.
- `name`: The name of the machine (for display only).
- `paths`: A list of the project paths on the machine (in case the default project path does not fit you).
- `user`: The user to connect to on the remote machine.
- `ip`: The IP or host of the machine.
- `port`: The port of the machine to connect to (22 by default).
- `password`: The password of the machine **<ins>/!\\</ins> IT IS HIGHLY RECOMMENDED TO USE RSA KEYS <ins>/!\\</ins>**.

### - `remote-compilation.macros`
Intended to be placed in user settings. They are the macros to run.
- `name`: The name of the macro (for display only).
- `group`: The type of the macro [`build`, `local`, `remote`, `vscode`].
- For build macros:
  - `command`: The build argument of your makefile.
  - `cleanCommand`: The clean argument of your makefile.
  - `subPath`: The path to your makefile (according to your project root defined in the machine).
  - `buildMachineIP`: The machine IP to build on (run locally if not specified).
  - `makefileName`: The name of the makefile (standard `makefile` if not specified).
- For local and remote macros:
  - `command`: The command to execute (in your local or machine terminal).
- For VS Code macros:
  - `command`: The VS Code command to execute (`workbench.action.reloadWindow` for example reloads VS Code's window).
  
### - `remote-compilation.remoteRoot`
Intended to be placed in user settings. It is intended to be the root folder (or shared folder) on the VM. The extension uses it in combination with `remote-compilation.remoteProjectPath` to generate the default path.

### - `remote-compilation.remoteProjectPath`
Intended to be placed in the workspace settings. It is the path to the project from the VM root. The extension uses it in combination with `remote-compilation.remoteRoot` to generate the default path.

### - `remote-compilation.disablePasswordWarnings`
You should always consider using RSA keys to secure your SSH connection ([follow this tutorial](https://kb.iu.edu/d/aews)), but just in case you can't and don't want to be annoyed by pop-ups, here is a workaround.

## Examples

### .code-workspace Template
This is a settings template/example you can use for your workspaceName.code-workspace file.
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

### settings.json Template (User)
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
    ]
}
```