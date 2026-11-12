# meWriteTable

A lightweight Qlik Sense visualization extension that automates bulk dropdown selection and clearing across visible rows in Qlik Write Table (`.sn-table-editable-selector`) objects.

Built with W3.CSS styling and pure client-side DOM automation, **meWriteTable** eliminates tedious row-by-row clicking when updating Material UI (`MuiSelect`) dropdown cells on a Qlik Sense sheet.

---

## Key Features

* **Set or Clear Modes:** Populate dropdown cells with a target value or reset populated cells back to empty (`""`).
* **Flexible Column Targeting:**
  * **All Editable Dropdowns:** Updates every visible dropdown across all rows.
  * **By Dropdown Column Index:** Targets a specific dropdown column per row (e.g., 1st or 2nd dropdown).
  * **By Column Header Name:** Matches cells dynamically against the table's header text.
* **Manual or Automatic Triggers:**
  * **Manual (Button Click):** Renders a customizable W3.CSS action button with live progress feedback (`Updating 1 / 10...`).
  * **Automatic (Sheet Load):** Executes automatically after a configurable initial delay (automatically paused in Qlik **Edit** mode).
* **Row Scope Control:** Choose between **Empty Rows Only** (preserving existing selections) or **All Visible Rows** (overwriting existing values).
* **Reliable Cell Commits & Escape Abort:** Automatically dispatches `focusout`/`blur` events to commit the final row edit, and supports pressing **`Escape`** mid-run to immediately stop execution and dismiss open popover menus.

---

## Installation

### Qlik Sense Enterprise (QMC)
1. Download the latest `meWriteTable.zip` release from this repository.
2. Open the **Qlik Management Console (QMC)** and navigate to **Extensions**.
3. Click **Import** and select `meWriteTable.zip`.

### Qlik Sense Desktop
1. Extract the contents of `meWriteTable.zip` into a folder named `meWriteTable`.
2. Move the `meWriteTable` folder into your local extensions directory:
   ```text
   C:\Users\<YourUsername>\Documents\Qlik\Sense\Extensions\meWriteTable
   ```
3. Refresh Qlik Sense Desktop (`Ctrl + Shift + R`).

---

## Configuration Properties

Once you drag **meWriteTable** onto a sheet containing a Qlik Write Table, configure the extension under the **Write Table Action** and **Timing & Selector** sections in the property panel:

| Property | Description | Default |
| :--- | :--- | :--- |
| **Action Mode** | Choose between `Set Dropdown Value` or `Clear Dropdown Value (Make Empty)`. | `Set Dropdown Value` |
| **Target Dropdown Value** | The exact text of the dropdown option to select (supports Qlik `fx` expressions). | `USER` |
| **Target Dropdown Column** | Target `All Editable Dropdowns`, `By Dropdown Column Index`, or `By Column Header Name`. | `All Editable Dropdowns` |
| **Trigger Mode** | Run via `Manual (Button Click)` or `Automatic (Run on Sheet Load)`. | `Manual (Button Click)` |
| **Row Scope** | Choose `Empty Rows Only (Preserve Existing)` or `All Visible Rows (Overwrite)`. | `Empty Rows Only` |
| **Button Label** | Custom text for the action button (supports Qlik `fx` expressions). | Auto-generated |
| **Button Style (W3.CSS)** | Select the W3.CSS button color theme (`w3-blue`, `w3-green`, `w3-red`, etc.). | `w3-blue` |
| **CSS Selector** | Target selector for the MUI dropdown display node. | `.sn-table-editable-selector #editable-selector` |
| **Step Delay (ms)** | Wait time between opening/selecting each row to allow portal rendering and cell commits. | `220` |
| **Auto-Run Initial Delay (ms)** | Delay before automatic execution begins after the sheet renders. | `600` |

---

## How It Works

1. **DOM Discovery:** Queries visible dropdown nodes matching `.sn-table-editable-selector #editable-selector` and filters them by your chosen column and row scope.
2. **Sequential Portal Interaction:** Because Material UI renders dropdown menus inside a single `<body>` portal popover, the extension processes rows sequentially—dispatching `pointerdown`/`mousedown`/`mouseup`/`click` events, waiting for the option list to mount, and clicking the matching `<li>` item.
3. **Final Row Commit:** After each selection, the extension dispatches `focusout`/`blur` events and clicks the table header to ensure Qlik's data grid commits the edit—including the final row in the loop.
4. **Clear & Escape Fallbacks:** When clearing values, the extension looks for blank options (`""`, `-`, `(empty)`, `None`) or falls back to `Escape` dismissal, native input clearing, and `Delete`/`Backspace` events. Pressing **`Escape`** at any time during execution safely aborts the loop.

---

## Limitations & Notes

* **Visible Rows Only:** Operates on rows currently rendered in the browser DOM. If your Write Table uses virtual scrolling with hundreds of rows, scroll down to load additional rows and trigger the action again.
* **Client-Side Execution:** Runs inside the active user's browser session using their existing Qlik Sense permissions.

---

## Author

Created by **jxp** (`ME extensions` bundle).
