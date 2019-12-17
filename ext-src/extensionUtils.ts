import * as vscode from "vscode";
import { GraphQLSource } from "./extensionTypes";
import { extractGraphQLSources } from "./findGraphQLSources";

export function extractSelectedOperation(
  textEditor: vscode.TextEditor
): GraphQLSource | null {
  const sources = extractGraphQLSources(textEditor.document);

  if (!sources || sources.length < 1) {
    vscode.window.showErrorMessage("No GraphQL sources found in file.");
    return null;
  }

  let targetSource: GraphQLSource | null = null;

  if (sources[0].type === "FULL_DOCUMENT") {
    targetSource = sources[0];
  } else {
    // A tag must be focused
    const selection = textEditor.selection.active;

    for (let i = 0; i <= sources.length - 1; i += 1) {
      const t = sources[i];

      if (t.type === "TAG" && selection.line >= t.start.line) {
        targetSource = t;
      }
    }
  }

  return targetSource;
}

export function replaceTargetSource(
  textEditor: vscode.TextEditor,
  targetSource: GraphQLSource,
  newContent: string
): Promise<void> {
  return new Promise(resolve => {
    textEditor.edit((editBuilder: vscode.TextEditorEdit) => {
      const textDocument = textEditor.document;

      if (!textDocument) {
        return;
      }

      if (targetSource.type === "TAG") {
        editBuilder.replace(
          new vscode.Range(
            new vscode.Position(
              targetSource.start.line,
              targetSource.start.character
            ),
            new vscode.Position(
              targetSource.end.line,
              targetSource.end.character
            )
          ),
          newContent
        );
      } else if (targetSource.type === "FULL_DOCUMENT" && textDocument) {
        editBuilder.replace(
          new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(textDocument.lineCount + 1, 0)
          ),
          newContent
        );
      }

      resolve();
    });
  });
}
