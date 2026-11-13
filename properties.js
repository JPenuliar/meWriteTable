define([], function () {
    "use strict";

    var colorOptions = [
        { value: "w3-blue", label: "Blue" },
        { value: "w3-green", label: "Green" },
        { value: "w3-teal", label: "Teal" },
        { value: "w3-indigo", label: "Indigo" },
        { value: "w3-red", label: "Red" },
        { value: "w3-amber", label: "Amber" },
        { value: "w3-dark-grey", label: "Dark Grey" },
        { value: "w3-white", label: "White" }
    ];

    var widthModeOptions = [
        { value: "auto", label: "Auto (Fit Content)" },
        { value: "autofit", label: "Autofit (Stretch Equal)" },
        { value: "px", label: "Fixed Pixels (px)" },
        { value: "pct", label: "Percentage (%)" }
    ];

    var editorItemDef = {
        label: {
            type: "string",
            ref: "label",
            label: "Editor Label / Placeholder",
            defaultValue: "Bulk Edit"
        },
        editorType: {
            type: "string",
            component: "dropdown",
            ref: "editorType",
            label: "Editor Type",
            options: [
                { value: "dropdown", label: "Dropdown" },
                { value: "text", label: "Text / Number Input" },
                { value: "date", label: "Date Picker" },
                { value: "rating", label: "Star Rating (Text/Number)" },
                { value: "checkbox", label: "Checkbox / Tick Toggle" },
                { value: "radio", label: "Radio Button Group" },
                { value: "slider", label: "Range Slider (Text/Number)" },
                { value: "stepper", label: "Numeric Stepper (Text/Number)" },
                { value: "multiselect", label: "Multi-Select Pills (Text)" },
                { value: "stamp", label: "One-Click Stamp" },
                { value: "color", label: "Colour Picker (Text)" }
            ],
            defaultValue: "dropdown"
        },
        dropdownSource: {
            type: "string",
            component: "dropdown",
            ref: "dropdownSource",
            label: "Dropdown Option Source",
            options: [
                { value: "mirror", label: "Auto-Mirror from Table" },
                { value: "custom", label: "Custom Key-Value Pairs" }
            ],
            defaultValue: "mirror",
            show: function (item) { return (item.editorType || "dropdown") === "dropdown"; }
        },
        includeClearOption: {
            type: "boolean",
            ref: "includeClearOption",
            label: "Include '-- Clear / Empty --' Option",
            defaultValue: true,
            show: function (item) { return (item.editorType || "dropdown") === "dropdown"; }
        },
        keyValuePairs: {
            type: "string",
            ref: "keyValuePairs",
            label: "Key-Value Pairs (Label=Value, comma-separated)",
            expression: "optional",
            defaultValue: "Option A=A, Option B=B",
            show: function (item) {
                var t = item.editorType || "dropdown";
                return (t === "dropdown" && item.dropdownSource === "custom") || t === "radio" || t === "multiselect";
            }
        },
        textPlaceholder: {
            type: "string",
            ref: "textPlaceholder",
            label: "Input Placeholder",
            defaultValue: "Enter value...",
            show: function (item) { return item.editorType === "text"; }
        },
        dateFormat: {
            type: "string",
            component: "dropdown",
            ref: "dateFormat",
            label: "Output Date Format",
            options: [
                { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
                { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
                { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" }
            ],
            defaultValue: "YYYY-MM-DD",
            show: function (item) { return item.editorType === "date"; }
        },
        ratingMax: {
            type: "integer",
            ref: "ratingMax",
            label: "Max Stars (1-10)",
            defaultValue: 5,
            min: 1,
            max: 10,
            show: function (item) { return item.editorType === "rating"; }
        },
        ratingStep: {
            type: "string",
            component: "dropdown",
            ref: "ratingStep",
            label: "Fractional Star Precision",
            options: [
                { value: "1", label: "Whole Stars (1)" },
                { value: "0.5", label: "Half Stars (0.5)" },
                { value: "0.25", label: "Quarter Stars (0.25)" },
                { value: "0.1", label: "Tenth Stars (0.1)" }
            ],
            defaultValue: "0.5",
            show: function (item) { return item.editorType === "rating"; }
        },
        ratingColor: {
            type: "string",
            component: "dropdown",
            ref: "ratingColor",
            label: "Star Fill Colour",
            options: [
                { value: "#FFC107", label: "Gold / Amber" },
                { value: "#FF9800", label: "Orange" },
                { value: "#F44336", label: "Crimson Red" },
                { value: "#4CAF50", label: "Emerald Green" },
                { value: "#2196F3", label: "Qlik Blue" }
            ],
            defaultValue: "#FFC107",
            show: function (item) { return item.editorType === "rating"; }
        },
        ratingTrigger: {
            type: "string",
            component: "dropdown",
            ref: "ratingTrigger",
            label: "Apply Behaviour",
            options: [
                { value: "release", label: "Auto-Apply on Release" },
                { value: "button", label: "Click Apply Button" }
            ],
            defaultValue: "release",
            show: function (item) { return item.editorType === "rating"; }
        },
        checkboxLabel: {
            type: "string",
            ref: "checkboxLabel",
            label: "Checkbox Text",
            defaultValue: "Mark Complete",
            show: function (item) { return item.editorType === "checkbox"; }
        },
        checkedValue: {
            type: "string",
            ref: "checkedValue",
            label: "Checked Value",
            defaultValue: "Yes",
            show: function (item) { return item.editorType === "checkbox"; }
        },
        uncheckedValue: {
            type: "string",
            ref: "uncheckedValue",
            label: "Unchecked Value (blank = clear)",
            defaultValue: "No",
            show: function (item) { return item.editorType === "checkbox"; }
        },
        radioOrientation: {
            type: "string",
            component: "dropdown",
            ref: "radioOrientation",
            label: "Radio Orientation",
            options: [
                { value: "horizontal", label: "Horizontal" },
                { value: "vertical", label: "Vertical" }
            ],
            defaultValue: "horizontal",
            show: function (item) { return item.editorType === "radio"; }
        },
        numMin: {
            type: "number",
            ref: "numMin",
            label: "Minimum Value",
            defaultValue: 0,
            show: function (item) { return item.editorType === "slider" || item.editorType === "stepper"; }
        },
        numMax: {
            type: "number",
            ref: "numMax",
            label: "Maximum Value",
            defaultValue: 100,
            show: function (item) { return item.editorType === "slider" || item.editorType === "stepper"; }
        },
        numStep: {
            type: "number",
            ref: "numStep",
            label: "Step Increment",
            defaultValue: 1,
            show: function (item) { return item.editorType === "slider" || item.editorType === "stepper"; }
        },
        sliderPrefix: {
            type: "string",
            ref: "sliderPrefix",
            label: "Display Prefix (e.g. $)",
            defaultValue: "",
            show: function (item) { return item.editorType === "slider"; }
        },
        sliderSuffix: {
            type: "string",
            ref: "sliderSuffix",
            label: "Display Suffix (e.g. %)",
            defaultValue: "",
            show: function (item) { return item.editorType === "slider"; }
        },
        sliderTrigger: {
            type: "string",
            component: "dropdown",
            ref: "sliderTrigger",
            label: "Apply Behaviour",
            options: [
                { value: "release", label: "Auto-Apply on Release" },
                { value: "button", label: "Click Apply Button" }
            ],
            defaultValue: "release",
            show: function (item) { return item.editorType === "slider"; }
        },
        stepperDefault: {
            type: "number",
            ref: "stepperDefault",
            label: "Initial Value",
            defaultValue: 0,
            show: function (item) { return item.editorType === "stepper"; }
        },
        multiDelimiter: {
            type: "string",
            ref: "multiDelimiter",
            label: "Value Delimiter",
            defaultValue: ", ",
            show: function (item) { return item.editorType === "multiselect"; }
        },
        stampButtonLabel: {
            type: "string",
            ref: "stampButtonLabel",
            label: "Stamp Button Text",
            defaultValue: "Stamp Today",
            show: function (item) { return item.editorType === "stamp"; }
        },
        stampSource: {
            type: "string",
            component: "dropdown",
            ref: "stampSource",
            label: "Stamp Value Source",
            options: [
                { value: "today", label: "Today's Date (YYYY-MM-DD)" },
                { value: "timestamp", label: "Current Timestamp" },
                { value: "custom", label: "Custom Value / Qlik Expression" }
            ],
            defaultValue: "today",
            show: function (item) { return item.editorType === "stamp"; }
        },
        stampCustomValue: {
            type: "string",
            ref: "stampCustomValue",
            label: "Custom Stamp Value",
            expression: "optional",
            defaultValue: "Reviewed",
            show: function (item) { return item.editorType === "stamp" && item.stampSource === "custom"; }
        },
        defaultColorHex: {
            type: "string",
            ref: "defaultColorHex",
            label: "Default Hex Colour",
            defaultValue: "#2196F3",
            show: function (item) { return item.editorType === "color"; }
        },
        targetInputType: {
            type: "string",
            component: "dropdown",
            ref: "targetInputType",
            label: "Target Write Table Column Type",
            options: [
                { value: "text", label: "Text / Number Input" },
                { value: "dropdown", label: "Dropdown" }
            ],
            defaultValue: "text",
            show: function (item) { return item.editorType === "checkbox" || item.editorType === "radio"; }
        },
        stampTargetType: {
            type: "string",
            component: "dropdown",
            ref: "stampTargetType",
            label: "Target Write Table Column Type",
            options: [
                { value: "text", label: "Text / Number Input" },
                { value: "date", label: "Date Picker" }
            ],
            defaultValue: "text",
            show: function (item) { return item.editorType === "stamp"; }
        },
        showClearBtn: {
            type: "boolean",
            ref: "showClearBtn",
            label: "Show Clear ('✕') Button",
            defaultValue: true,
            show: function (item) {
                var t = item.editorType || "dropdown";
                return t !== "dropdown" && t !== "checkbox" && t !== "stamp";
            }
        },
        columnMode: {
            type: "string",
            component: "dropdown",
            ref: "columnMode",
            label: "Target Column Match",
            options: [
                { value: "all", label: "All Matching Editable Columns" },
                { value: "index", label: "By Editable Column Index" },
                { value: "header", label: "By Column Header Name" }
            ],
            defaultValue: "all"
        },
        columnIndex: {
            type: "integer",
            ref: "columnIndex",
            label: "Editable Column Index (1 = first)",
            defaultValue: 1,
            min: 1,
            show: function (item) { return item.columnMode === "index"; }
        },
        columnHeader: {
            type: "string",
            ref: "columnHeader",
            label: "Column Header Name",
            expression: "optional",
            defaultValue: "",
            show: function (item) { return item.columnMode === "header"; }
        },
        rowScope: {
            type: "string",
            component: "dropdown",
            ref: "rowScope",
            label: "Row Scope",
            options: [
                { value: "empty", label: "Empty Rows Only" },
                { value: "all", label: "All Visible Rows" }
            ],
            defaultValue: "empty"
        },
        widthMode: {
            type: "string",
            component: "dropdown",
            ref: "widthMode",
            label: "Editor Width Mode",
            options: [{ value: "", label: "Use Global Width Mode" }].concat(widthModeOptions),
            defaultValue: ""
        },
        widthPx: {
            type: "integer",
            ref: "widthPx",
            label: "Width in Pixels (px)",
            defaultValue: 220,
            min: 60,
            max: 2000,
            show: function (item) { return item.widthMode === "px"; }
        },
        widthPct: {
            type: "number",
            ref: "widthPct",
            label: "Width in Percentage (%)",
            defaultValue: 50,
            min: 5,
            max: 100,
            show: function (item) { return item.widthMode === "pct"; }
        },
        itemColor: {
            type: "string",
            component: "dropdown",
            ref: "itemColor",
            label: "Accent Colour Override",
            options: [{ value: "", label: "Use Global Colour" }].concat(colorOptions),
            defaultValue: ""
        }
    };

    return {
        type: "items",
        component: "accordion",
        items: {
            actionSection: {
                type: "items",
                label: "Write Table Action",
                items: {
                    triggerMode: {
                        type: "string",
                        component: "dropdown",
                        ref: "triggerMode",
                        label: "Trigger Mode",
                        options: [
                            { value: "editors", label: "Global Editors Toolbar" },
                            { value: "auto", label: "Automatic (Run on Sheet Load)" }
                        ],
                        defaultValue: "editors"
                    },
                    maxEditors: {
                        type: "integer",
                        ref: "maxEditors",
                        label: "Max Global Editors (1-50)",
                        defaultValue: 10,
                        min: 1,
                        max: 50,
                        show: function (data) { return (data.triggerMode || "editors") === "editors"; }
                    },
                    globalEditors: {
                        type: "array",
                        ref: "globalEditors",
                        label: "Global Editors",
                        itemTitleRef: "label",
                        allowAdd: true,
                        allowRemove: true,
                        allowMove: true,
                        addTranslation: "Add Global Editor",
                        maxItems: function (data) {
                            return Math.max(1, Math.min(50, parseInt(data.maxEditors, 10) || 10));
                        },
                        defaultValue: [
                            {
                                label: "Select Status",
                                editorType: "dropdown",
                                dropdownSource: "mirror",
                                includeClearOption: true,
                                columnMode: "all",
                                columnIndex: 1,
                                rowScope: "empty",
                                widthMode: "",
                                itemColor: ""
                            }
                        ],
                        items: editorItemDef,
                        show: function (data) { return (data.triggerMode || "editors") === "editors"; }
                    },
                    autoTargetType: {
                        type: "string",
                        component: "dropdown",
                        ref: "autoTargetType",
                        label: "Target Column Type",
                        options: [
                            { value: "dropdown", label: "Dropdown" },
                            { value: "text", label: "Text / Number Input" },
                            { value: "date", label: "Date Picker" }
                        ],
                        defaultValue: "dropdown",
                        show: function (data) { return data.triggerMode === "auto"; }
                    },
                    autoActionType: {
                        type: "string",
                        component: "dropdown",
                        ref: "autoActionType",
                        label: "Action",
                        options: [
                            { value: "set", label: "Set Value" },
                            { value: "clear", label: "Clear / Empty" }
                        ],
                        defaultValue: "set",
                        show: function (data) { return data.triggerMode === "auto"; }
                    },
                    autoTargetValue: {
                        type: "string",
                        ref: "autoTargetValue",
                        label: "Value to Apply",
                        expression: "optional",
                        defaultValue: "",
                        show: function (data) { return data.triggerMode === "auto" && (data.autoActionType || "set") === "set"; }
                    },
                    autoColumnMode: {
                        type: "string",
                        component: "dropdown",
                        ref: "autoColumnMode",
                        label: "Target Column Match",
                        options: [
                            { value: "all", label: "All Matching Editable Columns" },
                            { value: "index", label: "By Editable Column Index" },
                            { value: "header", label: "By Column Header Name" }
                        ],
                        defaultValue: "all",
                        show: function (data) { return data.triggerMode === "auto"; }
                    },
                    autoColumnIndex: {
                        type: "integer",
                        ref: "autoColumnIndex",
                        label: "Editable Column Index (1 = first)",
                        defaultValue: 1,
                        min: 1,
                        show: function (data) { return data.triggerMode === "auto" && data.autoColumnMode === "index"; }
                    },
                    autoColumnHeader: {
                        type: "string",
                        ref: "autoColumnHeader",
                        label: "Column Header Name",
                        expression: "optional",
                        defaultValue: "",
                        show: function (data) { return data.triggerMode === "auto" && data.autoColumnMode === "header"; }
                    },
                    autoRowScope: {
                        type: "string",
                        component: "dropdown",
                        ref: "autoRowScope",
                        label: "Row Scope",
                        options: [
                            { value: "empty", label: "Empty Rows Only" },
                            { value: "all", label: "All Visible Rows" }
                        ],
                        defaultValue: "empty",
                        show: function (data) { return data.triggerMode === "auto"; }
                    },
                    autoDelayMs: {
                        type: "integer",
                        ref: "autoDelayMs",
                        label: "Auto-Run Initial Delay (ms)",
                        defaultValue: 1200,
                        min: 200,
                        show: function (data) { return data.triggerMode === "auto"; }
                    }
                }
            },
            editorStyling: {
                type: "items",
                label: "Editor Toolbar Styling",
                items: {
                    editorLayout: {
                        type: "string",
                        component: "dropdown",
                        ref: "editorLayout",
                        label: "Multi-Editor Layout",
                        options: [
                            { value: "row", label: "Side by Side (Wrap)" },
                            { value: "column", label: "Stacked Vertically" }
                        ],
                        defaultValue: "row"
                    },
                    globalWidthMode: {
                        type: "string",
                        component: "dropdown",
                        ref: "globalWidthMode",
                        label: "Default Editor Width Mode",
                        options: widthModeOptions,
                        defaultValue: "auto"
                    },
                    globalWidthPx: {
                        type: "integer",
                        ref: "globalWidthPx",
                        label: "Default Width in Pixels (px)",
                        defaultValue: 220,
                        min: 60,
                        max: 2000,
                        show: function (data) { return data.globalWidthMode === "px"; }
                    },
                    globalWidthPct: {
                        type: "number",
                        ref: "globalWidthPct",
                        label: "Default Width in Percentage (%)",
                        defaultValue: 50,
                        min: 5,
                        max: 100,
                        show: function (data) { return data.globalWidthMode === "pct"; }
                    },
                    alignment: {
                        type: "string",
                        component: "buttongroup",
                        ref: "alignment",
                        label: "Horizontal Alignment",
                        options: [
                            { value: "flex-start", label: "Left" },
                            { value: "center", label: "Center" },
                            { value: "flex-end", label: "Right" }
                        ],
                        defaultValue: "flex-start"
                    },
                    w3Color: {
                        type: "string",
                        component: "dropdown",
                        ref: "w3Color",
                        label: "Default Accent Colour",
                        options: colorOptions,
                        defaultValue: "w3-blue"
                    },
                    w3Roundness: {
                        type: "string",
                        component: "dropdown",
                        ref: "w3Roundness",
                        label: "Roundness",
                        options: [
                            { value: "", label: "Square" },
                            { value: "w3-round-small", label: "Small" },
                            { value: "w3-round", label: "Medium" },
                            { value: "w3-round-large", label: "Large" },
                            { value: "w3-round-xxlarge", label: "Pill" }
                        ],
                        defaultValue: "w3-round"
                    },
                    w3Border: {
                        type: "string",
                        component: "dropdown",
                        ref: "w3Border",
                        label: "Border",
                        options: [
                            { value: "", label: "None" },
                            { value: "w3-border", label: "Thin Border" },
                            { value: "w3-border w3-border-black", label: "Black Border" },
                            { value: "w3-border w3-border-grey", label: "Grey Border" }
                        ],
                        defaultValue: "w3-border w3-border-grey"
                    },
                    w3Shadow: {
                        type: "string",
                        component: "dropdown",
                        ref: "w3Shadow",
                        label: "Shadow",
                        options: [
                            { value: "", label: "None" },
                            { value: "w3-card", label: "Subtle Shadow" },
                            { value: "w3-card-4", label: "Deep Shadow" }
                        ],
                        defaultValue: ""
                    }
                }
            },
            statusStyling: {
                type: "items",
                label: "Status Message Styling",
                items: {
                    statusTheme: {
                        type: "string",
                        component: "dropdown",
                        ref: "statusTheme",
                        label: "Banner Colour Theme",
                        options: [
                            { value: "pastel", label: "Pastel Light (Default)" },
                            { value: "dark", label: "Dark Mode" },
                            { value: "solid", label: "Bold Solid Colours" },
                            { value: "minimal", label: "Minimal White Card" }
                        ],
                        defaultValue: "pastel"
                    },
                    statusAccent: {
                        type: "string",
                        component: "dropdown",
                        ref: "statusAccent",
                        label: "Banner Border & Accent",
                        options: [
                            { value: "leftbar", label: "Thick Left Accent Bar" },
                            { value: "bordered", label: "Full Thin Border" },
                            { value: "clean", label: "No Border" }
                        ],
                        defaultValue: "leftbar"
                    },
                    statusAutoHideMs: {
                        type: "integer",
                        component: "dropdown",
                        ref: "statusAutoHideMs",
                        label: "Auto-Hide Timer",
                        options: [
                            { value: 0, label: "Persistent (Never Hide)" },
                            { value: 5000, label: "5 Seconds" },
                            { value: 15000, label: "15 Seconds" },
                            { value: 30000, label: "30 Seconds (Default)" }
                        ],
                        defaultValue: 30000
                    }
                }
            },
            timingSection: {
                type: "items",
                label: "Timing & Selector",
                items: {
                    targetTableFilter: {
                        type: "string",
                        ref: "targetTableFilter",
                        label: "Target Write Table (Title or Object ID)",
                        expression: "optional",
                        defaultValue: ""
                    },
                    autoSaveTable: {
                        type: "boolean",
                        ref: "autoSaveTable",
                        label: "Auto-Click Write Table 'Save' After Update",
                        defaultValue: false
                    },
                    autoSaveDelayMs: {
                        type: "integer",
                        ref: "autoSaveDelayMs",
                        label: "Auto-Save Delay (ms)",
                        defaultValue: 400,
                        min: 100,
                        show: function (data) { return !!data.autoSaveTable; }
                    },
                    stepDelayMs: {
                        type: "integer",
                        ref: "stepDelayMs",
                        label: "Step Delay Between Rows (ms)",
                        defaultValue: 180,
                        min: 50
                    }
                }
            },
            settings: {
                uses: "settings"
            }
        }
    };
});
