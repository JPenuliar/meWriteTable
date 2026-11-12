# meWriteTable (v2.0.0)

**meWriteTable** is a custom Qlik Sense extension that adds a global bulk-editing toolbar to **Qlik Write Tables**. Instead of manually updating rows one by one, users can configure up to 50 independent global editors on a sheet to populate, update, or clear Write Table columns in a single action—or execute updates automatically on sheet load.

---

## ✨ Key Features

### 1. Dual Trigger Modes
* **Global Editors Toolbar (Default):** Renders a customizable bar of live UI controls (default cap of `10` editors, configurable up to `50`) that immediately bulk-update matching Write Table rows upon interaction.
* **Automatic Mode (Run on Sheet Load):** Runs a pre-configured bulk update or clear automatically after a configurable delay when a sheet renders (safely paused when Qlik Sense is in **Edit** mode).

### 2. 10 Global Editor Types
Each item added to the **Global Editors** list can be configured as any of the following controls:

| Editor Type | Description | Target Write Table Column |
| :--- | :--- | :--- |
| **Dropdown** | Dynamically **auto-mirrors** live Material UI options from the table column (`↻` sync) or uses **Custom Key-Value Pairs** (`Label=Value` with Qlik `fx` expression support) + optional `-- Clear / Empty --`. | Dropdown |
| **Text / Number Input** | Inline text or numeric field with **Enter** key commit, **Apply (`✓`)**, and optional **Clear (`✕`)** buttons. | Text / Number Input |
| **Date Picker** | Native HTML5 calendar picker with configurable output formatting (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`). | Date Picker |
| **Star Rating** | Click-and-drag fractional star widget (**Whole `1`**, **Half `0.5`**, **Quarter `0.25`**, **Tenth `0.1`** up to 10 stars) with custom star colours and live `3.5 / 5` readout. | Text / Number Input |
| **Checkbox / Tick Toggle** | Styled toggle card that immediately writes a configured **Checked Value** or **Unchecked Value** (or clears cells). | Text / Number or Dropdown |
| **Radio Button Group** | Horizontal or vertical radio pills driven by `Label=Value` pairs (with Qlik `fx` support). | Text / Number or Dropdown |
| **Range Slider** | Draggable horizontal slider with **Min / Max / Step**, live prefix/suffix badge (e.g. `$` or `%`), and auto-apply on release or **Apply (`✓`)**. | Text / Number Input |
| **Numeric Stepper** | Compact `-` and `+` increment buttons flanking a clamped numeric input. | Text / Number Input |
| **Multi-Select Pills** | Toggleable option chips from `Label=Value` pairs that join selected values using a custom **Delimiter** (default `", "`). | Text / Number Input |
| **One-Click Stamp** | Single action button that stamps **Today's Date**, **Current Timestamp**, or a **Custom Value / Qlik `fx` Expression** (e.g. `=OSUser()`). | Text / Number or Date Picker |
| **Colour Picker** | Visual HTML5 `<input type="color">` swatch selector with live hex readout (`#2196F3`) that writes hex codes to cells. | Text / Number Input |

### 3. Precision Targeting & Automation
* **Per-Editor Column Targeting:** Target **All Editable Columns**, a specific **Column Index**, or match dynamically by **Column Header Name** (supports Qlik `fx` expressions).
* **Row Scope Control:** Choose between **Empty Rows Only** (preserving existing edits) or **All Visible Rows** (overwriting existing values).
* **Target Specific Write Table:** Filter by **Chart Title** or **Object ID** when multiple Write Tables exist on the same sheet.
* **Auto-Click Write Table Save:** Optional post-run delay to automatically locate and click the scoped Write Table's **Save** button once bulk updates finish.

### 4. W3.CSS Styling & Safety Engine
* **Flexible Layout & Themes:** Arrange editors **Side by Side (Wrap)** or **Stacked Vertically**, align **Left / Center / Right**, apply global or per-editor W3.CSS colour overrides, and customize roundness, borders, drop shadows, and stacked auto-hiding status notification banners.
* **React-Safe DOM Execution:** Re-queries live DOM nodes between rows, uses React's native value setters, avoids accidental column sorting on blur, locks controls during Qlik **Edit** mode, and supports instant mid-run cancellation via the **Escape** key.

---

## 📦 Installation

1. Download or package the extension files (`meWriteTable.qext`, `properties.js`, `meWriteTable.js`, and `style.css`) into `meWriteTable.zip`.
2. Open the **Qlik Management Console (QMC)** → **Extensions** → **Import** and upload `meWriteTable.zip` (or extract into your Qlik Sense Desktop `Extensions` folder).
3. Hard-refresh your browser (`Ctrl + Shift + R`) and drag **meWriteTable** from **Custom Objects** onto any sheet containing a Qlik Write Table.

---

## ⚙️ Quick Configuration Guide

1. **Add Global Editors:** Under **Write Table Action**, click **Add Global Editor** (up to your configured **Max Editors** limit).
2. **Choose Editor Type & Target Column:** Pick one of the 10 editor types, select how to match your target column (**Header Name**, **Column Index**, or **All**), and choose **Empty Rows Only** or **All Visible Rows**.
3. **Multi-Table & Auto-Save (Optional):** Under **Timing & Selector**, enter a **Target Write Table Filter** (Chart Title or Object ID) if multiple Write Tables are on the sheet, and toggle **Auto-Click Save** if you want changes committed automatically.
4. **Style Your Toolbar:** Under **Dropdown / Editor Styling** and **Status Message Styling**, pick your layout direction, W3.CSS colour palette, border/shadow style, and banner auto-hide timer.

---

## 📋 Changelog

* **v2.0.0:** Added **Range Slider**, **Numeric Stepper**, **Multi-Select Pills**, **One-Click Stamp**, and **Colour Picker** editors; added **Target Specific Write Table** filtering and **Auto-Click Write Table Save**.
* **v1.9.0:** Added **Checkbox / Tick Toggle** and **Radio Button Group** editors supporting both Text/Number and Dropdown target columns.
* **v1.8.0:** Added draggable fractional **Star Rating** editor (`1`, `0.5`, `0.25`, `0.1` step precision) targeting Text/Number columns.
* **v1.7.0:** Added **Custom Key-Value Pairs** (`Label=Value` with `fx` expression support) to the Dropdown editor.
* **v1.6.0:** Expanded extension to support **Text / Number Input** and **Date Picker** global editors alongside Dropdowns.
* **v1.5.1:** Streamlined UI around Global Editors (removing static Action Button mode) and added configurable **Max Editors** cap (default `10`).
* **v1.4.0:** Added repeatable multi-editor list (`array` property) with per-editor column targeting, row scope, and colour overrides.
* **v1.3.0:** Initial release with Global Mirrored Dropdown, Action Button, Automatic sheet-load trigger, and W3.CSS styling.
