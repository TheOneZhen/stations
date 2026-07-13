import path from 'node:path'
import * as vscode from 'vscode'

export function toFileUri(filePath: string): vscode.Uri {
  return vscode.Uri.file(filePath)
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(toFileUri(filePath))
    return stat.type === vscode.FileType.File
  }
  catch {
    return false
  }
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await vscode.workspace.fs.createDirectory(toFileUri(dirPath))
}

export async function writeFileBytes(filePath: string, data: Uint8Array): Promise<void> {
  await ensureDirectory(path.dirname(filePath))
  await vscode.workspace.fs.writeFile(toFileUri(filePath), data)
}

export async function readFileBytes(filePath: string): Promise<Uint8Array> {
  return vscode.workspace.fs.readFile(toFileUri(filePath))
}

export async function copyFilePath(src: string, dest: string): Promise<void> {
  const data = await readFileBytes(src)
  await writeFileBytes(dest, data)
}

export async function getFileSize(filePath: string): Promise<number | undefined> {
  try {
    const stat = await vscode.workspace.fs.stat(toFileUri(filePath))
    return stat.size
  }
  catch {
    return undefined
  }
}

export async function hostPathExists(filePath: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(toFileUri(filePath))
    return true
  }
  catch {
    return false
  }
}

export async function removeFileIfExists(filePath: string): Promise<void> {
  try {
    await vscode.workspace.fs.delete(toFileUri(filePath), { useTrash: false })
  }
  catch {
    // Ignore missing files.
  }
}
