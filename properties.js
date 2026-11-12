define(["qlik", "jquery"], function (qlik, $) {
    "use strict";

    // *****************************************************************************
    // Action Settings
    // *****************************************************************************

    var actionType = {
        type: "string",
        component: "dropdown",
        label: "Action Mode",
        ref: "actionType",
        options: [
            {
                value: "set",
                label: "Set Dropdown Value"
            },
            {
                value: "clear",
                label: "Clear Dropdown Value (Make Empty)"
            }
        ],
        defaultValue: "set"
    };

    var targetValue = {
        ref: "targetValue",
        label: "Target Dropdown Value",
        type: "string",
        expression: "optional",
        defaultValue: "USER",
        show: function (layout) {
            return layout.actionType !== "clear";
        }
    };

    var columnMode = {
        type: "string",
        component: "dropdown",
        label: "Target Dropdown Column",
        ref: "columnMode",
        options: [
            {
                value: "all",
                label: "All Editable Dropdowns"
            },
            {
                value: "index",
                label: "By Dropdown Column Index (1st, 2nd, etc.)"
            },
            {
                value: "header",
                label: "By Column Header Name"
            }
        ],
        defaultValue: "all"
    };

    var columnIndex = {
        ref: "columnIndex",
        label: "Dropdown Column Number (1 = First Dropdown)",
        type: "integer",
        defaultValue: 1,
        min: 1,
        show: function (layout) {
            return layout.columnMode === "index";
        }
    };

    var columnHeader = {
        ref: "columnHeader",
        label: "Column Header Name (Exact Match)",
        type: "string",
        expression: "optional",
        defaultValue: "",
        show: function (layout) {
            return layout.columnMode === "header";
        }
    };

    var triggerMode = {
        type: "string",
        component: "dropdown",
        label: "Trigger Mode",
        ref: "triggerMode",
        options: [
            {
                value: "button",
                label: "Manual (Button Click)"
            },
            {
                value: "auto",
                label: "Automatic (Run on Sheet Load)"
            }
        ],
        defaultValue: "button"
    };

    var rowScope = {
        type: "string",
        component: "dropdown",
        label: "Row Scope",
        ref: "rowScope",
        options: [
            {
                value: "empty",
                label: "Empty Rows Only (Preserve Existing)"
            },
            {
                value: "all",
                label: "All Visible Rows (Overwrite)"
            }
        ],
        defaultValue: "empty",
        show: function (layout) {
            return layout.actionType !== "clear";
        }
    };

    var buttonLabel = {
        ref: "buttonLabel",
        label: "Button Label (Leave blank for auto label)",
        type: "string",
        expression: "optional",
        defaultValue: "",
        show: function (layout) {
            return layout.triggerMode !== "auto";
        }
    };

    var buttonColor = {
        type: "string",
        component: "dropdown",
        label: "Button Style (W3.CSS)",
        ref: "buttonColor",
        options: [
            { value: "w3-blue", label: "Blue" },
            { value: "w3-green", label: "Green" },
            { value: "w3-teal", label: "Teal" },
            { value: "w3-indigo", label: "Indigo" },
            { value: "w3-red", label: "Red" },
            { value: "w3-amber", label: "Amber" },
            { value: "w3-dark-grey", label: "Dark Grey" },
            { value: "w3-white w3-border", label: "White (Bordered)" }
        ],
        defaultValue: "w3-blue",
        show: function (layout) {
            return layout.triggerMode !== "auto";
        }
    };

    // *****************************************************************************
    // Timing & Selector Settings
    // *****************************************************************************

    var selectorTarget = {
        ref: "selectorTarget",
        label: "CSS Selector (Dropdown Node)",
        type: "string",
        defaultValue: ".sn-table-editable-selector #editable-selector"
    };

    var stepDelay = {
        ref: "stepDelay",
        label: "Step Delay Between Rows (ms)",
        type: "number",
        defaultValue: 220
    };

    var initialDelay = {
        ref: "initialDelay",
        label: "Auto-Run Initial Delay (ms)",
        type: "number",
        defaultValue: 600,
        show: function (layout) {
            return layout.triggerMode === "auto";
        }
    };

    var actionSection = {
        type: "items",
        label: "Write Table Action",
        items: {
            actionType: actionType,
            targetValue: targetValue,
            columnMode: columnMode,
            columnIndex: columnIndex,
            columnHeader: columnHeader,
            triggerMode: triggerMode,
            rowScope: rowScope,
            buttonLabel: buttonLabel,
            buttonColor: buttonColor
        }
    };

    var advancedSection = {
        type: "items",
        label: "Timing & Selector",
        items: {
            selectorTarget: selectorTarget,
            stepDelay: stepDelay,
            initialDelay: initialDelay
        }
    };

    // *****************************************************************************
    // Appearance Section
    // *****************************************************************************

    var appearanceSection = {
        uses: "settings",
        items: {
            general: {
                show: true,
                items: {
                    showTitles: {
                        defaultValue: false
                    },
                    details: {
                        show: false
                    }
                }
            },
            presentation: {
                uses: "presentation"
            }
        }
    };

    // *****************************************************************************
    // About Section
    // *****************************************************************************

    var aboutSection = {
        type: "items",
        label: "About",
        items: {
            header: {
                label: "meWriteTable Extension (v1.2.7)",
                component: "text"
            },
            one: {
                label: "Automates bulk dropdown selection and clearing across visible rows in Qlik Write Tables.",
                component: "text"
            },
            two: {
                label: "Supports pressing Escape during a run to abort immediately and trigger clean fallback recovery.",
                component: "text"
            },
            three: {
                label: "Created by jxp",
                component: "text"
            }
        }
    };

    return {
        type: "items",
        component: "accordion",
        items: {
            sectionAction: actionSection,
            sectionAdvanced: advancedSection,
            appearance: appearanceSection,
            sectionAbout: aboutSection
        }
    };
});
