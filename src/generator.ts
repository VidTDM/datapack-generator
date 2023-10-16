import * as vscode from "vscode";
import * as fs from "fs";
import { render } from "mustache";

/* The `Generator` class is a TypeScript class that generates a Minecraft data pack based on user input
and VSCode configurations. */
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
     * The `input` function prompts the user to enter values for name, namespace, description, and pack
     * format, and then generates a result based on those values.
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
                ? options[2]
                : this.DESCRIPTION;
            const pack_format: number = options[3]
                ? !Number.isNaN(parseInt(options[3]))
                    ? parseInt(options[3])
                    : this.LASTEST_PACK_FORMAT
                : this.LASTEST_PACK_FORMAT;

            this.generate(name, namespace, description, pack_format);
        });
    }
    /**
     * The `generate` function creates a new Minecraft datapack with the specified name, namespace,
     * description, and pack format.
     * @param {string} name - The name of the generated project or folder.
     * @param {string} namespace - The `namespace` parameter is a string that represents the namespace
     * of the generated code. In this context, it is used to create the necessary directories and files
     * for the Minecraft data pack.
     * @param {string} description - A brief description of the generated code or project.
     * @param {number} pack_format - The `pack_format` parameter is a number that represents the format
     * version of the resource pack. It is used in the `pack.mcmeta` file to specify the version
     * compatibility of the resource pack with Minecraft.
     */
    private generate(
        name: string,
        namespace: string,
        description: string,
        pack_format: number
    ): void {
        const pack_mcmeta = render(
            fs
                .readFileSync(
                    `${__dirname}\\..\\src\\templates\\pack.mcmeta.mst`
                )
                .toString(),
            {
                pack_format,
                description,
            }
        );
        const load_json = render(
            fs
                .readFileSync(`${__dirname}\\..\\src\\templates\\load.json.mst`)
                .toString(),
            { namespace }
        );
        const tick_json = render(
            fs
                .readFileSync(`${__dirname}\\..\\src\\templates\\tick.json.mst`)
                .toString(),
            { namespace }
        );

        const createNewDir = this.configurations.createNewDirectory;
        // Generate Main Folders
        if (createNewDir)
            this.vsfs.createDirectory(vscode.Uri.joinPath(this.folder, name));
        this.vsfs.createDirectory(
            vscode.Uri.joinPath(this.folder, `${createNewDir ? name : ""}/data`)
        );
        this.vsfs.writeFile(
            vscode.Uri.joinPath(
                this.folder,
                `${createNewDir ? name : ""}/pack.mcmeta`
            ),
            new TextEncoder().encode(pack_mcmeta)
        );

        // Generate Tags
        this.vsfs.createDirectory(
            vscode.Uri.joinPath(
                this.folder,
                `${createNewDir ? name : ""}/data/minecraft/tag/functions`
            )
        );
        this.vsfs.writeFile(
            vscode.Uri.joinPath(
                this.folder,
                `${
                    createNewDir ? name : ""
                }/data/minecraft/tag/functions/load.json`
            ),
            new TextEncoder().encode(load_json)
        );
        this.vsfs.writeFile(
            vscode.Uri.joinPath(
                this.folder,
                `${
                    createNewDir ? name : ""
                }/data/minecraft/tag/functions/tick.json`
            ),
            new TextEncoder().encode(tick_json)
        );

        // Generate Functions
        this.vsfs.createDirectory(
            vscode.Uri.joinPath(
                this.folder,
                `${createNewDir ? name : ""}/data/${namespace}/functions`
            )
        );
        this.vsfs.writeFile(
            vscode.Uri.joinPath(
                this.folder,
                `${
                    createNewDir ? name : ""
                }/data/${namespace}/functions/load.mcfunction`
            ),
            new Uint8Array([])
        );
        this.vsfs.writeFile(
            vscode.Uri.joinPath(
                this.folder,
                `${
                    createNewDir ? name : ""
                }/data/${namespace}/functions/tick.mcfunction`
            ),
            new Uint8Array([])
        );

        this.openNewWindow(vscode.Uri.joinPath(this.folder, name));
    }
    /**
     * The function `openNewWindow` checks the user's configuration and prompts them to open a new
     * window or opens a new window automatically based on the configuration.
     * @param path - The path parameter is of type vscode.Uri and represents the file path of the
     * datapack that needs to be opened in a new window.
     * @return The function does not have a return type, so it does not explicitly return anything.
     */
    private openNewWindow(path: vscode.Uri): void {
        if (!this.configurations.createNewDirectory) return;
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
