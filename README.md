# ![alt text](./ressources/images/icon/logo-extension-32.png?raw=true) remote-compilation README

Remote Compilation is a VSCode extension I developed during my internship at **IN-Core Systèmes**. Its objective is to reproduce part of Netbeans' functionalities we were using to Compile C/C++ over a Virtual machine. \
The extension aims to easily share compilation configs and macros among collaborators based on a workspace, but keep the machine configs proper to a user.

## Table of Content
- [ remote-compilation README](#-remote-compilation-readme)
  - [Table of Content](#table-of-content)
  - [Features](#features)
    - [Machines](#machines)
    - [Macros](#macros)
    - [Build Macros](#build-macros)
    - [Default Paths](#default-paths)
  - [Extension Settings](#extension-settings)
  - [Examples](#examples)
    - [.code-workspace Template](#code-workspace-template)
    - [settings.json template (User)](#settingsjson-template-user)
  - [Known Issues](#known-issues)
  - [Release Notes](#release-notes)
  - [License](#license)
  - [Links](#links)


## Features
This extension revolves around 3 features:
### Machines
Machines can be found on the top part of the view
### Macros

### Build Macros
### Default Paths

<!---
## Requirements
If you have any requirements or dependencies, add a section describing those and how to install and configure them.
-->
## Extension Settings

- `remote-compilation.machines`: The machines to run the macros on
- `remote-compilation.macros`: The macros to run.
- `remote-compilation.remoteRoot`: The root folder (or shared folder) on the VM.
- `remote-compilation.remoteProjectPath`: The path to the project from the VM root.
- `remote-compilation.disablePasswordWarnings`: Just in case you can't and don't be annoyed by pop-ups, here is a workaround.

see more details on settings [here](extension-settings.md)

## Examples
### .code-workspace Template
This is a settings template/example you can use for your workspaceName.code-workspace file.
```
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
        // you can change their name and/or the order in which they are displayed
        "remote-compilation.macros": [
            {
                "name": "Windows",
                "command": "all",
                "group": "build",
                "makefileName": "makefilewindows",
                "buildMachineIP": "192.168.56.111",
                "cleanCommand": "clean",
                "subPath": "src"
            },
            {
                "name": "Reload VSCode window",
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
        //This setting will be used to determine the remote project path
        "remote-compilation.default.remoteProjectPath": "project1",
    }
}
```
### settings.json template (User)
This is a settings example for settings.json (user)
```
{
    "remote-compilation.default.remoteRoot": "/root/projects",
    "remote-compilation.machines": [
        {
            "name": "Raspberry Pi",
            "user": "pi",
            "ip": "192.168.0.100",
            "paths": [
                "/root/projects/specialProject",
            ],
            "port": 22,
            "password": "raspberry"
        }
    ],
}
```

## Known Issues

- The Extension cannot read the output of the terminal, neither the time it takes to run a command. This causes "run all build macros" not to work every time, especially if the build are long

## Release Notes
see changelog [here](CHANGELOG.md)

## License

This software is under a MIT license, see it [here](LICENSE.md)

## Links
**[The Github Project Page](https://github.com/ashtoroth8724/remote-compilation)**\
**[My Github Page](https://github.com/ashtoroth8724)**\
\
**Enjoy!**
