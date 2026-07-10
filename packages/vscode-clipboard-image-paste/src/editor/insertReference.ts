import * as vscode from "vscode";
import { findAltTextSelection } from "./altTextSelection";

export { findAltTextSelection } from "./altTextSelection";

export async function insertReference(
  editor: vscode.TextEditor,
  insertText: string,
  languageId: string,
): Promise<void> {
  const position = editor.selection.active;
  await editor.edit((builder) => {
    builder.insert(position, insertText);
  });

  const selection = findAltTextSelection(insertText, languageId);
  if (!selection) {
    const endPosition = editor.document.positionAt(
      editor.document.offsetAt(position) + insertText.length,
    );
    editor.selection = new vscode.Selection(endPosition, endPosition);
    return;
  }

  const insertOffset = editor.document.offsetAt(position);
  const start = editor.document.positionAt(insertOffset + selection.start);
  const end = editor.document.positionAt(insertOffset + selection.end);
  editor.selection = new vscode.Selection(start, end);
}
