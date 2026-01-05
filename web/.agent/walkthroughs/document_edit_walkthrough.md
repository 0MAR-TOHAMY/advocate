# Document Edit Feature Walkthrough

This walkthrough explains how to use the new Document Edit functionality.

## Overview
You can now edit the metadata (Title, Type, Date, Description) of existing documents in the Case Detail view / Documents tab.

## Steps

1.  **Navigate to a Case**: Go to `/dashboard/cases/[id]`.
2.  **Go to Documents Tab**: Click on the "Documents" tab.
3.  **Find a Document**: Locate the document you want to edit.
4.  **Click Edit**: Click the Amber "Pencil" icon in the actions column.
    *   A modal will appear pre-filled with the document's current details.
5.  **Make Changes**: Update the Title, Type, Date, or Description.
    *   *Note: File replacement is not supported in this modal; re-upload if you need to change the file.*
6.  **Save**: Click "Save". The list will refresh automatically.

## Technical Details
-   **Frontend**: `DocumentEditDialog.tsx` handles the form.
-   **API**: `PATCH /api/documents` updates the database record.
-   **Validation**: Validates that required fields are present.

## Hearings Tab Updates
-   The Hearings tab now matches the Documents tab design (Actions column, Icon sizes).
-   **Delete Hearing**: You can now delete hearings directly from the list.
-   **Edit/Postpone**: Buttons are visible for future implementation (currently placeholders).
