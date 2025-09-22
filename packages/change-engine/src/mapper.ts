import type { VisualEdit, FileUpdate, ChangeContext } from './types';

export class ChangeMapper {
  constructor(private context: ChangeContext) {}

  /**
   * Maps visual edits to file system updates
   */
  mapEditsToFileUpdates(edits: VisualEdit[]): FileUpdate[] {
    const fileUpdates: FileUpdate[] = [];
    const fileChanges = new Map<string, VisualEdit[]>();

    // Group edits by file
    for (const edit of edits) {
      const filePath = edit.target.file;
      if (!fileChanges.has(filePath)) {
        fileChanges.set(filePath, []);
      }
      fileChanges.get(filePath)!.push(edit);
    }

    // Process each file's changes
    for (const [filePath, fileEdits] of fileChanges) {
      const update = this.processFileEdits(filePath, fileEdits);
      if (update) {
        fileUpdates.push(update);
      }
    }

    return fileUpdates;
  }

  private processFileEdits(filePath: string, edits: VisualEdit[]): FileUpdate | null {
    // Sort edits by position (reverse order for proper application)
    const sortedEdits = edits.sort((a, b) => {
      if (a.target.startLine !== b.target.startLine) {
        return b.target.startLine - a.target.startLine;
      }
      return b.target.startColumn - a.target.startColumn;
    });

    // For demo purposes, we'll create a simple text replacement
    // In a real implementation, this would apply all edits to the file content
    let updatedContent = '';
    
    for (const edit of sortedEdits) {
      switch (edit.type) {
        case 'text-change':
        case 'selection-replace':
          updatedContent = this.applyTextChange(edit);
          break;
        case 'insert':
          updatedContent = this.applyInsert(edit);
          break;
        case 'delete':
          updatedContent = this.applyDelete(edit);
          break;
      }
    }

    // Use context for file path resolution
    const relativePath = filePath.startsWith(this.context.projectRoot) 
      ? filePath.substring(this.context.projectRoot.length + 1)
      : filePath;

    return {
      path: relativePath,
      content: updatedContent || edits[0]?.content || '',
      action: 'update',
      encoding: 'utf8',
    };
  }

  private applyTextChange(edit: VisualEdit): string {
    // Demo implementation - replace original content with new content
    return edit.content;
  }

  private applyInsert(edit: VisualEdit): string {
    // Demo implementation - insert content
    return edit.originalContent + edit.content;
  }

  private applyDelete(edit: VisualEdit): string {
    // Demo implementation - remove original content
    return edit.originalContent.replace(edit.content, '');
  }

  /**
   * Validates that edits can be safely applied
   */
  validateEdits(edits: VisualEdit[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const edit of edits) {
      // Check if file exists in context
      if (!edit.target.file) {
        errors.push(`Edit ${edit.id}: Missing target file`);
      }

      // Check if edit has valid content
      if (edit.type !== 'delete' && !edit.content) {
        errors.push(`Edit ${edit.id}: Missing content for ${edit.type}`);
      }

      // Check line/column bounds
      if (edit.target.startLine < 1 || edit.target.endLine < edit.target.startLine) {
        errors.push(`Edit ${edit.id}: Invalid line range`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
