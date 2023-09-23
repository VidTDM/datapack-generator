import * as vscode from "vscode";
import Generator from "./generator";

/**
 * This TypeScript function activates a Visual Studio Code extension and registers a command to generate a datapack using a Generator class.
 * @param context - The `context` parameter is an instance of the `vscode.ExtensionContext` class. It represents the context in which the extension is activated and provides access to various extension-related functionalities, such as registering commands, creating disposable resources, and accessing the extension's storage path.
 */
export function activate(context: vscode.ExtensionContext) {
    console.info("datapack-generator is now active");
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "datapack-generator.generateDatapack",
            () => {
                const generator = new Generator();
                try {
                    generator.init();
                } catch (err) {
                    generator.abort(err);
                }
            }
        )
    );
}

export function deactivate() {}
