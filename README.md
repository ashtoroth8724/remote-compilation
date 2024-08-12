# remote-compilation README

Remote Compilation is a VSCode extension I developed during my internship at **IN-Core Systèmes**. Its objective is to reproduce part of Netbeans' functionalities we were using to Compile C/C++ over a Virtual machine. \
The extension aims to easily share compilation configs and macros among collaborators based on a workspace, but keep the machine configs proper to a user.

## Table of Content
- [remote-compilation README](#remote-compilation-readme)
  - [Table of Content](#table-of-content)
  - [Features](#features)
    - [Machines](#machines)
    - [Macros](#macros)
    - [Build Macros](#build-macros)
    - [Default Paths](#default-paths)
  - [Extension Settings](#extension-settings)
  - [Known Issues](#known-issues)
  - [Release Notes](#release-notes)
    - [1.0.0](#100)
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

- `remote-compilation.machines`: Intended to be placed in user settings. They are the machines to run the macros on
  - `name`: The name of the Machine (for display only)
  - `paths`: a list of the project path on the machine (in case the default project path does not fit you)
  - `user`: the user to connect to on the remote machine
  - `ip`: the ip or host of the machine
  - `port`: the port of the machine to connect to (22 by default)
  - `password`: the password of the machine (<ins>/!\\</ins> IT IS HIGHLY RECOMMENDED TO USE RSA KEYS <ins>/!\\</ins>)
- `remote-compilation.macros`: Intended to be placed in user settings. They are the macro to run
  - `name`: The name of the Macro (for display only)
  - `group`: the type of the macro [`build`, `local`, `remote`, `vscode`]
  - For build macros:
    - `command`: the build argument of your makefile
    - `cleanCommand`: the clean argument of your makefile
    - `subPath`: the path to your makefile (according to your project root defined in the machine)
    - `buildMachineIP`: the machine IP to build on (run locally if not specified)
    - `makefileName`: the name of the makefile (standard `makefile` if not specified)
  - for local and remote macros:
    - `command`: the command to execute (in your local or machine terminal)
  - for vscode macros:
    - `command`: the vscode command to execute (`workbench.action.reloadWindow` for example reload vscode's window)
- `remote-compilation.remoteRoot`: Intended to be placed in user settings, it is intended to be the root folder (or shared folder) on the VM. The extension uses it in combination with `remote-compilation.remoteProjectPath` to generate the default path.
- `remote-compilation.remoteProjectPath`: Intended to be placed in the workspace settings, it is the path to the project from the VM root. The extension uses it in combination with `remote-compilation.remoteRoot` to generate the default path.
- `remote-compilation.disablePasswordWarnings`: You should always consider to use RSA keys to secure your SSH connection ([follow this tutorial](https://kb.iu.edu/d/aews)), but just in case you can't and don't be annoyed by pop-ups, here is a workaround.

## Known Issues

- The Extension cannot read the output of the terminal, neither the time it takes to run a command. This causes "run all build macros" not to work every time, especially if the build are long

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...



## Links
**[The Github Project Page](https://github.com/ashtoroth8724/remote-compilation)**\
**[My Github Page](https://github.com/ashtoroth8724)**\
\
**Enjoy!**
