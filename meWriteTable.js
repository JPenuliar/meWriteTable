define([
    "qlik",
    "jquery",
    "./properties",
    "css!./style.css"
], function (qlik, $, props, cssContent) {
    "use strict";

    $("<style>").html(cssContent).appendTo("head");

    function wait(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function triggerFullClick(el) {
        if (!el) return;
        var rect = el.getBoundingClientRect();
        var clientX = rect.left + rect.width / 2;
        var clientY = rect.top + rect.height / 2;

        var commonOpts = {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: clientX,
            clientY: clientY
        };

        if (typeof PointerEvent === "function") {
            el.dispatchEvent(new PointerEvent("pointerdown", Object.assign({ pointerId: 1, isPrimary: true, button: 0 }, commonOpts)));
        }
        el.dispatchEvent(new MouseEvent("mousedown", Object.assign({ button: 0, buttons: 1 }, commonOpts)));

        if (typeof PointerEvent === "function") {
            el.dispatchEvent(new PointerEvent("pointerup", Object.assign({ pointerId: 1, isPrimary: true, button: 0 }, commonOpts)));
        }
        el.dispatchEvent(new MouseEvent("mouseup", Object.assign({ button: 0, buttons: 0 }, commonOpts)));
        el.click();
    }

    function commitCellEdit(node) {
        if (!node) return;

        var cellEl = node.closest("td, th, [role='cell'], [role='gridcell']") || node;
        var wrapperEl = node.closest(".sn-table-editable-selector") || node;

        [node, wrapperEl, cellEl].forEach(function (el) {
            if (!el) return;
            try {
                el.dispatchEvent(new FocusEvent("focusout", { bubbles: true, cancelable: true, view: window }));
                el.dispatchEvent(new FocusEvent("blur", { bubbles: false, cancelable: true, view: window }));
            } catch (e) {}
        });

        var tableContainer = node.closest(".sn-table, [role='grid'], [role='table'], table");
        var headerCell = tableContainer ? tableContainer.querySelector("th, [role='columnheader']") : null;
        if (headerCell) {
            triggerFullClick(headerCell);
        }
    }

    function dismissOpenPopover(activeNode) {
        var escOptions = {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
            view: window
        };

        // Mark synthetic Escape events so our user Escape listener ignores its own fallback dispatches
        window._meWriteTableSyntheticEsc = true;

        try {
            if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.dispatchEvent(new KeyboardEvent("keydown", escOptions));
                document.activeElement.dispatchEvent(new KeyboardEvent("keyup", escOptions));
            }

            if (activeNode) {
                activeNode.dispatchEvent(new KeyboardEvent("keydown", escOptions));
                activeNode.dispatchEvent(new KeyboardEvent("keyup", escOptions));
            }

            var openListbox = document.querySelector('ul[role="listbox"], .MuiMenu-list, .MuiPopover-root');
            if (openListbox) {
                openListbox.dispatchEvent(new KeyboardEvent("keydown", escOptions));
                openListbox.dispatchEvent(new KeyboardEvent("keyup", escOptions));
            }

            document.dispatchEvent(new KeyboardEvent("keydown", escOptions));
            document.dispatchEvent(new KeyboardEvent("keyup", escOptions));

            var backdrop = document.querySelector(".MuiBackdrop-root, .MuiModal-backdrop");
            if (backdrop) {
                triggerFullClick(backdrop);
            }
        } finally {
            window._meWriteTableSyntheticEsc = false;
        }
    }

    function normalizeCellText(node) {
        if (!node) return "";
        return (node.textContent || "").replace(/[ ​-‍﻿]/g, " ").trim();
    }

    async function waitForOptionItem(actionType, targetValue, maxWaitMs) {
        var elapsed = 0;
        var interval = 40;
        var normalizedTarget = (targetValue || "").trim().toLowerCase();

        while (elapsed <= maxWaitMs) {
            if (window._meWriteTableAbortRequested) {
                return null;
            }

            var candidates = Array.from(
                document.querySelectorAll(
                    '.MuiPopover-root [role="option"], .MuiMenu-list li, ul[role="listbox"] li, [role="option"], li'
                )
            ).filter(function (el) {
                return el.offsetParent !== null || el.getClientRects().length > 0;
            });

            if (candidates.length > 0) {
                if (actionType === "clear") {
                    var blankMatch = candidates.find(function (el) {
                        var dataVal = el.getAttribute("data-value");
                        var txt = normalizeCellText(el).toLowerCase();
                        return (
                            dataVal === "" ||
                            txt === "" ||
                            txt === "-" ||
                            txt === "—" ||
                            txt === "(empty)" ||
                            txt === "none" ||
                            txt === "clear"
                        );
                    });
                    if (blankMatch) return blankMatch;
                } else {
                    var exactMatch = candidates.find(function (el) {
                        return normalizeCellText(el) === targetValue;
                    });
                    if (exactMatch) return exactMatch;

                    var ciMatch = candidates.find(function (el) {
                        return normalizeCellText(el).toLowerCase() === normalizedTarget;
                    });
                    if (ciMatch) return ciMatch;
                }
            }

            await wait(interval);
            elapsed += interval;
        }

        return null;
    }

    async function waitForPopoverClose(maxWaitMs) {
        var elapsed = 0;
        var interval = 30;
        while (elapsed <= maxWaitMs) {
            var openMenu = document.querySelector('.MuiPopover-root, ul[role="listbox"], .MuiMenu-list');
            if (!openMenu) {
                return true;
            }
            await wait(interval);
            elapsed += interval;
        }
        return false;
    }

    function filterNodesByColumn(allNodes, options) {
        var columnMode = options.columnMode || "all";

        if (columnMode === "all") {
            return allNodes;
        }

        if (columnMode === "index") {
            var targetIdx = Math.max(1, parseInt(options.columnIndex, 10) || 1) - 1;
            var rowGroups = [];
            var rowMap = new Map();

            allNodes.forEach(function (node) {
                var rowEl = node.closest("tr, [role='row']") || node.parentElement;
                if (!rowMap.has(rowEl)) {
                    var list = [];
                    rowMap.set(rowEl, list);
                    rowGroups.push(list);
                }
                rowMap.get(rowEl).push(node);
            });

            var selected = [];
            rowGroups.forEach(function (group) {
                if (group[targetIdx]) {
                    selected.push(group[targetIdx]);
                }
            });
            return selected;
        }

        if (columnMode === "header") {
            var headerName = (options.columnHeader || "").trim().toLowerCase();
            if (!headerName) {
                return [];
            }

            return allNodes.filter(function (node) {
                var cellEl = node.closest("td, th, [role='cell'], [role='gridcell']");
                var rowEl = node.closest("tr, [role='row']");
                var tableEl = node.closest("table, [role='grid'], [role='table'], .sn-table");

                if (!cellEl || !rowEl || !tableEl) {
                    return false;
                }

                var rowCells = Array.from(rowEl.querySelectorAll("td, th, [role='cell'], [role='gridcell']"));
                var cellColIdx = rowCells.indexOf(cellEl);
                if (cellColIdx === -1) {
                    return false;
                }

                var headerRow = tableEl.querySelector("thead tr, [role='rowgroup']:first-child [role='row'], tr:first-child");
                if (!headerRow) {
                    return false;
                }

                var headerCells = Array.from(headerRow.querySelectorAll("th, td, [role='columnheader'], [role='cell']"));
                var targetHeaderCell = headerCells[cellColIdx];
                if (!targetHeaderCell) {
                    return false;
                }

                var headerText = targetHeaderCell.textContent.trim().toLowerCase();
                return headerText === headerName || headerText.indexOf(headerName) !== -1;
            });
        }

        return allNodes;
    }

    function getFilteredNodes(selector, options) {
        var allNodes = Array.from(document.querySelectorAll(selector));
        return filterNodesByColumn(allNodes, options);
    }

    function isNodePending(node, actionType, targetValue, rowScope) {
        var currentText = normalizeCellText(node);
        if (actionType === "clear") {
            return currentText !== "";
        }
        if (rowScope === "empty") {
            return currentText === "";
        }
        return currentText !== targetValue;
    }

    function tryNativeClearAction(node) {
        var wrapperEl = node.closest(".sn-table-editable-selector") || node.parentElement || node;
        var cellEl = node.closest("td, [role='cell'], [role='gridcell']") || wrapperEl;

        // 1. Check if there is an inline Clear / Reset icon button inside the cell or wrapper
        var inlineClearBtn = wrapperEl.querySelector(
            'button[aria-label*="clear" i], button[title*="clear" i], .MuiAutocomplete-clearIndicator, [data-testid*="Clear" i]'
        );
        if (inlineClearBtn) {
            triggerFullClick(inlineClearBtn);
            return;
        }

        // 2. Try resetting the hidden MUI native input via React value setter
        var nativeInput = wrapperEl.querySelector("input.MuiSelect-nativeInput, input");
        if (nativeInput && nativeInput.value !== "") {
            try {
                var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                if (nativeSetter) {
                    nativeSetter.call(nativeInput, "");
                } else {
                    nativeInput.value = "";
                }
                nativeInput.dispatchEvent(new Event("input", { bubbles: true }));
                nativeInput.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (e) {}
        }

        // 3. Dispatch Delete and Backspace keyboard events on cell and display node
        if (typeof cellEl.focus === "function") {
            cellEl.focus();
        }
        if (typeof node.focus === "function") {
            node.focus();
        }

        var keys = [
            { key: "Delete", code: "Delete", keyCode: 46, which: 46 },
            { key: "Backspace", code: "Backspace", keyCode: 8, which: 8 }
        ];
        keys.forEach(function (k) {
            var opts = Object.assign({ bubbles: true, cancelable: true, view: window }, k);
            cellEl.dispatchEvent(new KeyboardEvent("keydown", opts));
            cellEl.dispatchEvent(new KeyboardEvent("keyup", opts));
            node.dispatchEvent(new KeyboardEvent("keydown", opts));
            node.dispatchEvent(new KeyboardEvent("keyup", opts));
        });
    }

    async function processSingleNode(node, actionType, targetValue, stepDelay) {
        if (window._meWriteTableAbortRequested) {
            dismissOpenPopover(node);
            return false;
        }

        if (document.querySelector('.MuiPopover-root, ul[role="listbox"]')) {
            dismissOpenPopover(null);
            await wait(80);
        }

        if (typeof node.scrollIntoView === "function") {
            node.scrollIntoView({ block: "nearest", inline: "nearest" });
        }

        // Open the MUI Select popover menu
        triggerFullClick(node);

        var targetItem = await waitForOptionItem(actionType, targetValue, 700);

        if (window._meWriteTableAbortRequested) {
            dismissOpenPopover(node);
            commitCellEdit(node);
            return false;
        }

        if (targetItem) {
            triggerFullClick(targetItem);
            await waitForPopoverClose(600);
            await wait(stepDelay);
            commitCellEdit(node);
            await wait(Math.max(100, Math.floor(stepDelay * 0.6)));
            return true;
        }

        // Escape fallback: close open popover first
        dismissOpenPopover(node);
        await waitForPopoverClose(400);

        if (actionType === "clear" && !window._meWriteTableAbortRequested) {
            tryNativeClearAction(node);
            await wait(stepDelay);
            commitCellEdit(node);
            await wait(Math.max(100, Math.floor(stepDelay * 0.6)));

            if (document.querySelector('.MuiPopover-root, ul[role="listbox"], .MuiMenu-list')) {
                dismissOpenPopover(node);
                await waitForPopoverClose(300);
            }

            return normalizeCellText(node) === "";
        }

        return false;
    }

    async function runBulkAction(options) {
        var actionType = options.actionType || "set";
        var targetValue = (options.targetValue || "").trim();
        var rowScope = options.rowScope || "empty";
        var selector = options.selectorTarget || ".sn-table-editable-selector #editable-selector";
        var stepDelay = Math.max(80, Number(options.stepDelay) || 220);
        var onProgress = options.onProgress || function () {};

        if (actionType !== "clear" && !targetValue) {
            console.warn("meWriteTable: Target Dropdown Value is empty.");
            return { updated: 0, total: 0 };
        }

        if (window._meWriteTableRunning) {
            return { updated: 0, total: 0, skippedLock: true };
        }

        var initialFiltered = getFilteredNodes(selector, options);
        var initialPending = initialFiltered.filter(function (node) {
            return isNodePending(node, actionType, targetValue, rowScope);
        });
        var initialTotal = initialPending.length;

        if (initialTotal === 0) {
            return { updated: 0, total: 0 };
        }

        window._meWriteTableRunning = true;
        window._meWriteTableAbortRequested = false;

        var activeNode = null;
        var updatedCount = 0;
        var processedIndices = {};
        var maxIterations = initialFiltered.length + 5;
        var iteration = 0;

        // Global Escape key listener (capture phase) to abort immediately and trigger fallback cleanup
        function onUserEscapeKey(e) {
            if (window._meWriteTableSyntheticEsc) {
                return;
            }
            var isEscape = e.key === "Escape" || e.key === "Esc" || e.keyCode === 27 || e.which === 27;
            if (isEscape && window._meWriteTableRunning) {
                window._meWriteTableAbortRequested = true;
                dismissOpenPopover(activeNode);
                if (activeNode) {
                    commitCellEdit(activeNode);
                }
            }
        }

        document.addEventListener("keydown", onUserEscapeKey, true);

        try {
            while (iteration < maxIterations) {
                if (window._meWriteTableAbortRequested) {
                    break;
                }

                iteration++;

                var currentFiltered = getFilteredNodes(selector, options);
                var nextIndex = -1;
                var nextNode = null;

                for (var idx = 0; idx < currentFiltered.length; idx++) {
                    if (processedIndices[idx]) {
                        continue;
                    }
                    if (isNodePending(currentFiltered[idx], actionType, targetValue, rowScope)) {
                        nextIndex = idx;
                        nextNode = currentFiltered[idx];
                        break;
                    }
                }

                if (!nextNode) {
                    break;
                }

                activeNode = nextNode;
                processedIndices[nextIndex] = true;

                var stepNumber = Math.min(iteration, initialTotal);
                onProgress(stepNumber, initialTotal);

                var success = await processSingleNode(nextNode, actionType, targetValue, stepDelay);

                if (window._meWriteTableAbortRequested) {
                    break;
                }

                if (success) {
                    updatedCount++;
                } else {
                    console.warn("meWriteTable: Row " + (nextIndex + 1) + " could not be " + (actionType === "clear" ? "cleared" : "updated") + ", advancing to next row.");
                }
            }
        } finally {
            document.removeEventListener("keydown", onUserEscapeKey, true);

            // Always run fallback dismissal and cell commit on exit/abort
            dismissOpenPopover(activeNode);
            if (activeNode) {
                commitCellEdit(activeNode);
            }

            var wasAborted = !!window._meWriteTableAbortRequested;
            window._meWriteTableAbortRequested = false;

            setTimeout(function () {
                window._meWriteTableRunning = false;
            }, 300);
        }

        return { updated: updatedCount, total: initialTotal, aborted: wasAborted };
    }

    return {
        definition: props,
        support: {
            snapshot: false,
            export: false,
            exportData: false
        },
        paint: function ($element, layout) {
            var id = "mewritetable_" + layout.qInfo.qId;
            $element.empty();

            var actionType = layout.actionType || "set";
            var triggerMode = layout.triggerMode || "button";
            var targetValue = layout.targetValue || "USER";
            var defaultBtnText = actionType === "clear" ? "Clear Dropdowns" : ("Set Empty Rows to " + targetValue);
            var btnLabel = (layout.buttonLabel || "").trim() || defaultBtnText;
            var btnColor = layout.buttonColor || "w3-blue";

            var badgeHtml = actionType === "clear"
                ? "<div class='mewt-auto-badge'>Auto-Clear Dropdowns</div>"
                : "<div class='mewt-auto-badge'>Auto-Fill: <b>" + targetValue + "</b></div>";

            var $container = $(
                "<div class='qv-object-meWriteTable' id='" + id + "'>" +
                "  <div class='mewt-wrapper'>" +
                (triggerMode === "button"
                    ? "<button type='button' class='w3-button w3-round " + btnColor + " mewt-btn'>" + btnLabel + "</button>"
                    : badgeHtml) +
                "    <span class='mewt-status'></span>" +
                "  </div>" +
                "</div>"
            );

            $element.append($container);

            var $btn = $container.find(".mewt-btn");
            var $status = $container.find(".mewt-status");

            var execConfig = {
                actionType: actionType,
                targetValue: targetValue,
                columnMode: layout.columnMode || "all",
                columnIndex: layout.columnIndex || 1,
                columnHeader: layout.columnHeader || "",
                rowScope: layout.rowScope || "empty",
                selectorTarget: layout.selectorTarget,
                stepDelay: layout.stepDelay,
                onProgress: function (current, total) {
                    var verb = actionType === "clear" ? "Clearing " : "Updating ";
                    if ($btn.length) {
                        $btn.text(verb + current + " / " + total + " (Esc to stop)...");
                    }
                    $status.text("Processing " + current + " of " + total + " (Press Esc to abort)...");
                }
            };

            if (triggerMode === "button") {
                $btn.on("click", async function () {
                    $btn.prop("disabled", true);
                    $status.text("Scanning table (Press Esc to abort)...");

                    var result = await runBulkAction(execConfig);

                    $btn.prop("disabled", false).text(btnLabel);

                    if (result.skippedLock) {
                        $status.text("Already running...");
                    } else if (result.aborted) {
                        $status.text("Aborted via Escape (" + result.updated + " updated).");
                    } else if (result.total === 0) {
                        $status.text("No matching rows found.");
                    } else {
                        var doneVerb = actionType === "clear" ? "Cleared " : "Updated ";
                        $status.text(doneVerb + result.updated + " of " + result.total + " row(s).");
                    }
                });
            } else {
                var isEditMode = qlik.navigation && qlik.navigation.getMode && qlik.navigation.getMode() === "edit";
                if (!isEditMode) {
                    var initDelay = Math.max(100, Number(layout.initialDelay) || 600);
                    setTimeout(function () {
                        runBulkAction(execConfig).then(function (result) {
                            if (result.aborted) {
                                $status.text("Aborted via Escape (" + result.updated + " updated).");
                            } else if (result.updated > 0) {
                                var autoVerb = actionType === "clear" ? "Auto-cleared " : "Auto-updated ";
                                $status.text(autoVerb + result.updated + " row(s).");
                            }
                        });
                    }, initDelay);
                } else {
                    $status.text("(Paused in Edit mode)");
                }
            }

            return qlik.Promise.resolve();
        }
    };
});
