import * as vscode from "vscode";
import * as fs from "fs";
import { render } from "mustache";
//! ADD LINK AFTER PUBLISHING
// TODO: Add create in same directory configuration
/*
          "datapack-generator.createInThisDirectory": {
            "type": [
              "boolean"
            ],
            "default": false,
            "description": "Tells whether to create the datapack in this directory or not."
          }
*/

/* The above class is a TypeScript code that generates a Minecraft data pack with user-defined
parameters. */
export default class Generator {
    private readonly configurations =
        vscode.workspace.getConfiguration("datapack-generator");
    private readonly vsfs = vscode.workspace.fs;
    private readonly folder = vscode.workspace.workspaceFolders![0]?.uri;
    private readonly NAME = "Datapack";
    private readonly NAMESPACE = "ns";
    private readonly DESCRIPTION = "Generated using Datapack Generator";
    private readonly LASTEST_PACK_FORMAT = 15;

    public init(): void {
        this.input();
    }
    /**
     * The below function takes user input from a VSCode input box and uses it to generate a name,
     * namespace, description, and pack format for further processing.
     */
    private input(): void {
        const input = vscode.window.showInputBox({
            value: ",,,",
            prompt: "<name:string>,<namespace:string>,<description:string>,<pack_format:integer>(separted by commas)",
        });
        input.then((val) => {
            if (!val) return;

            const options: Array<string> = [];
            val.split(",").forEach((val) => options.push(val));

            const name: string = options[0]
                ? options[0].replace(/<|>|:|"|\/|\\|\||\?/gm, "-")
                : this.NAME;
            const namespace: string = options[1]
                ? options[1].replace(/[^a-z]/gm, "").toLowerCase()
                : this.NAMESPACE;
            const description: string = options[2]
                ? options[2].replace(/\\\\/gm, "\\\\")
                : this.DESCRIPTION;
            const pack_format: number = options[3]
                ? parseInt(options[3])
                : this.LASTEST_PACK_FORMAT;

            this.generate(name, namespace, description, pack_format);
        });
    }
    /**
     * The function generates a Minecraft data pack with the given name, namespace, description, and pack format.
     * @param {string} name - The name of the generated files and folders.
     * @param {string} namespace - The `namespace` parameter is a string that represents the namespace of the Minecraft data pack.
     * @param {string} description - A string that describes the purpose or content of the generated files.
     * @param {number} pack_format - The `pack_format` parameter is a number that represents the format version of the pack. It is used to determine compatibility with different versions of Minecraft.
     */
    // prettier-ignore
    private generate(name: string, namespace: string, description: string, pack_format: number): void {
        const pack_mcmeta = render(
            fs.
                readFileSync(`${__dirname}\\..\\src\\templates\\pack.mcmeta.mst`)
                .toString(),
            {
                pack_format,
                description
            }
        );
        const load_json = render(
            fs.
                readFileSync(`${__dirname}\\..\\src\\templates\\load.json.mst`)
                .toString(),
                { namespace }
        );
        const tick_json = render(
                fs
                    .readFileSync(`${__dirname}\\..\\src\\templates\\tick.json.mst`)
                    .toString(),
                { namespace }
        );

        // Generate Main Folders
        this.vsfs.createDirectory(vscode.Uri.joinPath(this.folder, name));
        this.vsfs.createDirectory(vscode.Uri.joinPath(this.folder, `${name}/data`));
        this.vsfs.writeFile(
            vscode.Uri.joinPath(this.folder, `${name}/pack.mcmeta`),
            new TextEncoder().encode(pack_mcmeta)
        );

        // Generate Tags
        this.vsfs.createDirectory(vscode.Uri.joinPath(this.folder, `${name}/data/minecraft/tag/functions`));
        this.vsfs.writeFile(
            vscode.Uri.joinPath(this.folder, `${name}/data/minecraft/tag/functions/load.json`),
            new TextEncoder().encode(load_json)
        );
        this.vsfs.writeFile(
            vscode.Uri.joinPath(this.folder, `${name}/data/minecraft/tag/functions/tick.json`),
            new TextEncoder().encode(tick_json)
        );

        // Generate Functions
        this.vsfs.createDirectory(vscode.Uri.joinPath(this.folder, `${name}/data/${namespace}/functions`));
        this.vsfs.writeFile(
            vscode.Uri.joinPath(this.folder, `${name}/data/${namespace}/functions/load.mcfunction`),
            new Uint8Array([])
        );
        this.vsfs.writeFile(
            vscode.Uri.joinPath(this.folder, `${name}/data/${namespace}/functions/tick.mcfunction`),
            new Uint8Array([])
        );

        this.openNewWindow(vscode.Uri.joinPath(this.folder, name));
    }
    /**
     * The function `openNewWindow` checks the user's configuration and prompts them to open a new window or opens a new window directly based on the configuration.
     * @param path - The `path` parameter is the path to the file or directory that you want to open in a new window. It is of type `vscode.Uri`.
     */
    private openNewWindow(path: vscode.Uri): void {
        switch (this.configurations.openNewWindow) {
            case null:
                vscode.window
                    .showInformationMessage(
                        "Open datapack in new window?",
                        ...["Yes", "No"]
                    )
                    .then((sel) => {
                        if (sel === "No") return;
                        vscode.commands.executeCommand(
                            "vscode.openFolder",
                            path,
                            true
                        );
                    });
                break;

            case true:
                vscode.commands.executeCommand("vscode.openFolder", path, true);
                break;

            case false:
                break;
        }
    }
    public abort(err: any): void {
        throw new Error(`Extension action aborted due to ${err}`);
    }
}
