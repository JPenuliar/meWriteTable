define(["qlik", "./properties", "css!./style.css"], function (qlik, properties) {
    "use strict";

    var isRunning = false;
    var abortRequested = false;

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isRunning) {
            abortRequested = true;
        }
    });

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function isEditMode() {
        try {
            return qlik.navigation && qlik.navigation.getMode && qlik.navigation.getMode() === "edit";
        } catch (e) {
            return !!document.querySelector(".qv-mode-edit, .qs-mode-edit");
        }
    }

    function parseKeyValuePairs(raw) {
        if (!raw || typeof raw !== "string") return [];
        return raw.split(",").map(function (part) {
            var trimmed = part.trim();
            if (!trimmed) return null;
            var eqIdx = trimmed.indexOf("=");
            if (eqIdx === -1) {
                return { label: trimmed, value: trimmed };
            }
            return {
                label: trimmed.substring(0, eqIdx).trim(),
                value: trimmed.substring(eqIdx + 1).trim()
            };
        }).filter(Boolean);
    }

    function formatDateOutput(isoDate, format) {
        if (!isoDate || isoDate.indexOf("-") === -1) return isoDate;
        var parts = isoDate.split("-");
        if (parts.length !== 3) return isoDate;
        if (format === "DD/MM/YYYY") return parts[2] + "/" + parts[1] + "/" + parts[0];
        if (format === "MM/DD/YYYY") return parts[1] + "/" + parts[2] + "/" + parts[0];
        return isoDate;
    }

    function resolveStampValue(cfg) {
        var now = new Date();
        var yyyy = now.getFullYear();
        var mm = String(now.getMonth() + 1).padStart(2, "0");
        var dd = String(now.getDate()).padStart(2, "0");
        var iso = yyyy + "-" + mm + "-" + dd;
        if (cfg.stampSource === "timestamp") {
            var hh = String(now.getHours()).padStart(2, "0");
            var min = String(now.getMinutes()).padStart(2, "0");
            var ss = String(now.getSeconds()).padStart(2, "0");
            return iso + " " + hh + ":" + min + ":" + ss;
        }
        if (cfg.stampSource === "custom") {
            return cfg.stampCustomValue != null ? String(cfg.stampCustomValue) : "";
        }
        return iso;
    }

    function resolveTargetTableRoot(filterText) {
        var filter = (filterText || "").trim().toLowerCase();
        var containers = Array.prototype.slice.call(document.querySelectorAll(".qv-object-wrapper, .qv-gridcell, [tid]"));
        if (filter) {
            for (var i = 0; i < containers.length; i++) {
                var el = containers[i];
                var tid = (el.getAttribute("tid") || el.id || "").toLowerCase();
                var titleEl = el.querySelector(".qv-object-title, header, [data-testid='title']");
                var title = titleEl ? titleEl.textContent.trim().toLowerCase() : "";
                if ((tid && tid.indexOf(filter) !== -1) || (title && title.indexOf(filter) !== -1)) {
                    if (el.querySelector("table, [role='grid'], .sn-table-editable-selector")) {
                        return el;
                    }
                }
            }
        }
        return document;
    }

    function getColumnHeaders(root) {
        var headers = root.querySelectorAll("thead th, [role='columnheader']");
        return Array.prototype.slice.call(headers).map(function (th) {
            return (th.textContent || "").trim().toLowerCase();
        });
    }

    function getCellColumnIndex(cell) {
        var td = cell.closest("td, [role='gridcell']");
        if (!td || !td.parentElement) return -1;
        var siblings = Array.prototype.slice.call(td.parentElement.children);
        return siblings.indexOf(td);
    }

    function findTargetCells(root, targetType, colMode, colIndex, colHeader) {
        var rows = Array.prototype.slice.call(root.querySelectorAll("tbody tr, [role='row']"));
        var headers = colMode === "header" ? getColumnHeaders(root) : [];
        var targetHeaderLower = (colHeader || "").trim().toLowerCase();
        var matched = [];

        rows.forEach(function (row) {
            if (row.closest("thead")) return;
            var rowCells = [];
            if (targetType === "dropdown") {
                rowCells = Array.prototype.slice.call(row.querySelectorAll(".sn-table-editable-selector"));
            } else if (targetType === "date") {
                rowCells = Array.prototype.slice.call(row.querySelectorAll("td input[type='date'], [role='gridcell'] input[type='date'], td input[placeholder*='YYYY'], td input[placeholder*='DD'], td input[placeholder*='MM']"));
                if (!rowCells.length) {
                    rowCells = Array.prototype.slice.call(row.querySelectorAll("td input:not([type='hidden']):not([type='checkbox']):not([type='radio']), [role='gridcell'] input:not([type='hidden'])"));
                }
            } else {
                rowCells = Array.prototype.slice.call(row.querySelectorAll("td input:not([type='hidden']):not([type='checkbox']):not([type='radio']), td textarea, [role='gridcell'] input:not([type='hidden']), [role='gridcell'] textarea"));
            }

            rowCells.forEach(function (cell, editableIdx) {
                if (cell.closest(".mewt-container")) return;
                if (colMode === "index") {
                    if (editableIdx + 1 !== (parseInt(colIndex, 10) || 1)) return;
                } else if (colMode === "header" && targetHeaderLower) {
                    var domColIdx = getCellColumnIndex(cell);
                    if (domColIdx < 0 || !headers[domColIdx] || headers[domColIdx].indexOf(targetHeaderLower) === -1) {
                        return;
                    }
                }
                matched.push(cell);
            });
        });

        return matched;
    }

    function isCellEmpty(cell, targetType) {
        if (targetType === "dropdown") {
            var txt = (cell.textContent || "").replace(/​/g, "").trim();
            return !txt || txt === "-" || txt.toLowerCase() === "select";
        }
        return !(cell.value || "").trim();
    }

    function setNativeInputValue(input, value) {
        var proto = input.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        var descriptor = Object.getOwnPropertyDescriptor(proto, "value");
        if (descriptor && descriptor.set) {
            descriptor.set.call(input, value);
        } else {
            input.value = value;
        }
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function commitBlurSafe() {
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        var bg = document.querySelector(".qv-panel-sheet, .sheet-grid, body");
        if (bg) {
            bg.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            bg.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        }
    }

    async function discoverDropdownOptions(root, colMode, colIndex, colHeader) {
        var cells = findTargetCells(root, "dropdown", colMode, colIndex, colHeader);
        if (!cells.length) return [];
        var firstCell = cells[0];
        firstCell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        firstCell.click();
        await sleep(220);

        var items = Array.prototype.slice.call(document.querySelectorAll("[role='listbox'] [role='option'], .MuiMenu-list li"));
        var options = [];
        items.forEach(function (li) {
            var label = (li.textContent || "").trim();
            if (label && label !== "-- Clear / Empty --") {
                options.push({ label: label, value: label });
            }
        });

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        commitBlurSafe();
        await sleep(100);
        return options;
    }

    async function applyToSingleCell(cell, targetType, actionType, value, stepDelay) {
        if (targetType === "dropdown") {
            cell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            cell.click();
            await sleep(Math.max(120, stepDelay));

            var options = Array.prototype.slice.call(document.querySelectorAll("[role='listbox'] [role='option'], .MuiMenu-list li"));
            var targetLower = String(value || "").trim().toLowerCase();
            var picked = null;

            for (var i = 0; i < options.length; i++) {
                var txt = (options[i].textContent || "").trim();
                if (actionType === "clear") {
                    if (!txt || txt === "-" || txt.toLowerCase() === "none" || txt.toLowerCase() === "clear" || txt.toLowerCase() === "empty") {
                        picked = options[i];
                        break;
                    }
                } else if (txt.toLowerCase() === targetLower) {
                    picked = options[i];
                    break;
                }
            }

            if (picked) {
                picked.click();
                await sleep(80);
            } else {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
                var innerInput = cell.querySelector("input");
                if (innerInput && actionType === "clear") {
                    setNativeInputValue(innerInput, "");
                }
            }
            commitBlurSafe();
        } else {
            cell.focus();
            await sleep(40);
            var finalVal = actionType === "clear" ? "" : String(value != null ? value : "");
            setNativeInputValue(cell, finalVal);
            cell.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
            await sleep(50);
            commitBlurSafe();
        }
    }

    async function triggerTableAutoSave(root, delayMs) {
        await sleep(Math.max(100, delayMs || 400));
        var buttons = Array.prototype.slice.call(root.querySelectorAll("button"));
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            if (btn.disabled || btn.closest(".mewt-container")) continue;
            var txt = (btn.textContent || "").trim().toLowerCase();
            var aria = (btn.getAttribute("aria-label") || "").toLowerCase();
            if (txt === "save" || aria === "save" || txt.indexOf("save changes") !== -1) {
                btn.click();
                return true;
            }
        }
        return false;
    }

    function applyCardWidth(card, cfg, layout) {
        var mode = cfg.widthMode || layout.globalWidthMode || "auto";
        if (mode === "autofit") {
            card.classList.add("mewt-width-autofit");
        } else if (mode === "px") {
            var pxVal = cfg.widthMode === "px"
                ? (parseInt(cfg.widthPx, 10) || 220)
                : (parseInt(layout.globalWidthPx, 10) || 220);
            card.classList.add("mewt-width-fixed");
            card.style.width = Math.max(60, pxVal) + "px";
            card.style.flex = "0 0 auto";
        } else if (mode === "pct") {
            var pctVal = cfg.widthMode === "pct"
                ? (parseFloat(cfg.widthPct) || 50)
                : (parseFloat(layout.globalWidthPct) || 50);
            var clampedPct = Math.max(5, Math.min(100, pctVal));
            card.classList.add("mewt-width-fixed");
            card.style.width = clampedPct + "%";
            card.style.flex = "0 0 " + clampedPct + "%";
        }
    }

    return {
        initialProperties: {
            version: 2.1
        },
        definition: properties,
        support: {
            snapshot: false,
            export: false,
            exportData: false
        },
        paint: function ($element, layout) {
            var self = this;
            var el = $element[0];
            var editMode = isEditMode();
            var stepDelay = Math.max(50, parseInt(layout.stepDelayMs, 10) || 180);
            var hideTimer = null;

            el.innerHTML = "";

            var container = document.createElement("div");
            container.className = "mewt-container" + (editMode ? " mewt-edit-mode-locked" : "");

            var statusBanner = document.createElement("div");
            var themeClass = "mewt-status-" + (layout.statusTheme || "pastel");
            var accentClass = layout.statusAccent === "clean" ? "" : "mewt-status-" + (layout.statusAccent || "leftbar");
            statusBanner.className = "mewt-status-banner " + themeClass + " " + accentClass + " " + (layout.w3Roundness || "");

            var statusText = document.createElement("span");
            var closeStatus = document.createElement("span");
            closeStatus.textContent = "✕";
            closeStatus.style.cursor = "pointer";
            closeStatus.onclick = function () { statusBanner.classList.remove("mewt-visible"); };
            statusBanner.appendChild(statusText);
            statusBanner.appendChild(closeStatus);

            function showStatus(msg, type) {
                if (hideTimer) clearTimeout(hideTimer);
                statusBanner.className = "mewt-status-banner mewt-visible " + themeClass + " " + accentClass + " " + (layout.w3Roundness || "") + " mewt-type-" + (type || "info");
                statusText.textContent = msg;
                var autoHide = parseInt(layout.statusAutoHideMs, 10);
                if (isNaN(autoHide)) autoHide = 30000;
                if (autoHide > 0) {
                    hideTimer = setTimeout(function () {
                        statusBanner.classList.remove("mewt-visible");
                    }, autoHide);
                }
            }

            async function runBulkAction(opts) {
                if (editMode) {
                    showStatus("Paused in Qlik Edit mode.", "warn");
                    return;
                }
                if (isRunning) {
                    showStatus("Another bulk update is currently running.", "warn");
                    return;
                }
                isRunning = true;
                abortRequested = false;

                try {
                    var root = resolveTargetTableRoot(layout.targetTableFilter);
                    var initialCells = findTargetCells(root, opts.targetType, opts.columnMode, opts.columnIndex, opts.columnHeader);

                    if (!initialCells.length) {
                        showStatus("No matching editable Write Table cells found.", "warn");
                        return;
                    }

                    var targetIndices = [];
                    initialCells.forEach(function (cell, idx) {
                        if ((opts.rowScope || "empty") === "all" || isCellEmpty(cell, opts.targetType)) {
                            targetIndices.push(idx);
                        }
                    });

                    if (!targetIndices.length) {
                        showStatus("All matching rows already have values (Empty Rows Only).", "info");
                        return;
                    }

                    var updated = 0;
                    for (var i = 0; i < targetIndices.length; i++) {
                        if (abortRequested) {
                            showStatus("Aborted by user after updating " + updated + " cell(s).", "warn");
                            return;
                        }
                        showStatus("Updating " + (i + 1) + " of " + targetIndices.length + "... (Press Esc to abort)", "info");
                        var liveRoot = resolveTargetTableRoot(layout.targetTableFilter);
                        var liveCells = findTargetCells(liveRoot, opts.targetType, opts.columnMode, opts.columnIndex, opts.columnHeader);
                        var cell = liveCells[targetIndices[i]];
                        if (cell) {
                            await applyToSingleCell(cell, opts.targetType, opts.actionType, opts.value, stepDelay);
                            updated++;
                        }
                        await sleep(stepDelay);
                    }

                    var summary = (opts.actionType === "clear" ? "Cleared " : "Updated ") + updated + " cell(s).";
                    if (layout.autoSaveTable) {
                        var saved = await triggerTableAutoSave(resolveTargetTableRoot(layout.targetTableFilter), layout.autoSaveDelayMs);
                        summary += saved ? " Auto-saved table." : " (Save button not found).";
                    }
                    showStatus(summary, "success");
                } catch (err) {
                    showStatus("Error during update: " + (err && err.message ? err.message : err), "error");
                } finally {
                    isRunning = false;
                    abortRequested = false;
                }
            }

            if (layout.triggerMode === "auto") {
                var autoMsg = document.createElement("div");
                autoMsg.className = "mewt-editor-label";
                autoMsg.textContent = editMode ? "Automatic Mode (Paused in Edit Mode)" : "Automatic Mode Active";
                container.appendChild(autoMsg);
                container.appendChild(statusBanner);
                el.appendChild(container);

                if (!editMode && !self._autoTriggered) {
                    self._autoTriggered = true;
                    setTimeout(function () {
                        runBulkAction({
                            targetType: layout.autoTargetType || "dropdown",
                            actionType: layout.autoActionType || "set",
                            value: layout.autoTargetValue || "",
                            columnMode: layout.autoColumnMode || "all",
                            columnIndex: layout.autoColumnIndex || 1,
                            columnHeader: layout.autoColumnHeader || "",
                            rowScope: layout.autoRowScope || "empty"
                        });
                    }, Math.max(200, parseInt(layout.autoDelayMs, 10) || 1200));
                }
                return qlik.Promise.resolve();
            }

            var bar = document.createElement("div");
            bar.className = "mewt-editors-bar" + (layout.editorLayout === "column" ? " mewt-layout-column" : "");
            bar.style.justifyContent = layout.alignment || "flex-start";

            var maxCap = Math.max(1, Math.min(50, parseInt(layout.maxEditors, 10) || 10));
            var editors = (layout.globalEditors || []).slice(0, maxCap);

            editors.forEach(function (cfg) {
                var type = cfg.editorType || "dropdown";
                var accent = cfg.itemColor || layout.w3Color || "w3-blue";
                var round = layout.w3Roundness || "";
                var border = layout.w3Border || "";
                var shadow = layout.w3Shadow || "";

                var card = document.createElement("div");
                card.className = "mewt-editor-card " + round + " " + border + " " + shadow;
                applyCardWidth(card, cfg, layout);

                if (cfg.label) {
                    var lbl = document.createElement("div");
                    lbl.className = "mewt-editor-label";
                    lbl.textContent = cfg.label;
                    card.appendChild(lbl);
                }

                var row = document.createElement("div");
                row.className = "mewt-control-row";

                function addClearBtn(onClear) {
                    if (cfg.showClearBtn === false) return;
                    var clr = document.createElement("button");
                    clr.type = "button";
                    clr.className = "mewt-icon-btn mewt-clear-btn " + round;
                    clr.title = "Clear matching cells";
                    clr.textContent = "✕";
                    clr.onclick = onClear;
                    row.appendChild(clr);
                }

                function addApplyBtn(onApply) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "mewt-icon-btn " + accent + " " + round;
                    btn.title = "Apply to matching cells";
                    btn.textContent = "✓";
                    btn.onclick = onApply;
                    row.appendChild(btn);
                }

                if (type === "dropdown") {
                    var select = document.createElement("select");
                    select.className = "mewt-select " + round;

                    function populateSelect(optsList) {
                        select.innerHTML = "";
                        var placeholderOpt = document.createElement("option");
                        placeholderOpt.value = "__placeholder__";
                        placeholderOpt.textContent = cfg.label || "Select...";
                        placeholderOpt.disabled = true;
                        placeholderOpt.selected = true;
                        select.appendChild(placeholderOpt);

                        if (cfg.includeClearOption !== false) {
                            var clearOpt = document.createElement("option");
                            clearOpt.value = "__clear__";
                            clearOpt.textContent = "-- Clear / Empty --";
                            select.appendChild(clearOpt);
                        }

                        optsList.forEach(function (o) {
                            var opt = document.createElement("option");
                            opt.value = o.value;
                            opt.textContent = o.label;
                            select.appendChild(opt);
                        });
                    }

                    if (cfg.dropdownSource === "custom") {
                        populateSelect(parseKeyValuePairs(cfg.keyValuePairs));
                        row.appendChild(select);
                    } else {
                        populateSelect([]);
                        row.appendChild(select);
                        var syncBtn = document.createElement("button");
                        syncBtn.type = "button";
                        syncBtn.className = "mewt-icon-btn " + accent + " " + round;
                        syncBtn.title = "Scan table options";
                        syncBtn.textContent = "↻";
                        syncBtn.onclick = async function () {
                            if (editMode || isRunning) return;
                            showStatus("Scanning dropdown options...", "info");
                            var root = resolveTargetTableRoot(layout.targetTableFilter);
                            var found = await discoverDropdownOptions(root, cfg.columnMode, cfg.columnIndex, cfg.columnHeader);
                            populateSelect(found);
                            showStatus(found.length ? "Loaded " + found.length + " option(s)." : "No options found in target column.", found.length ? "success" : "warn");
                        };
                        row.appendChild(syncBtn);
                    }

                    select.onchange = function () {
                        var val = select.value;
                        if (val === "__placeholder__") return;
                        runBulkAction({
                            targetType: "dropdown",
                            actionType: val === "__clear__" ? "clear" : "set",
                            value: val === "__clear__" ? "" : val,
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                        select.value = "__placeholder__";
                    };
                } else if (type === "text") {
                    var txtInput = document.createElement("input");
                    txtInput.type = "text";
                    txtInput.className = "mewt-text-input " + round;
                    txtInput.placeholder = cfg.textPlaceholder || "Enter value...";
                    txtInput.onkeydown = function (e) {
                        if (e.key === "Enter") {
                            runBulkAction({
                                targetType: "text",
                                actionType: "set",
                                value: txtInput.value,
                                columnMode: cfg.columnMode,
                                columnIndex: cfg.columnIndex,
                                columnHeader: cfg.columnHeader,
                                rowScope: cfg.rowScope
                            });
                        }
                    };
                    row.appendChild(txtInput);
                    addApplyBtn(function () {
                        runBulkAction({
                            targetType: "text",
                            actionType: "set",
                            value: txtInput.value,
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                    addClearBtn(function () {
                        txtInput.value = "";
                        runBulkAction({
                            targetType: "text",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                } else if (type === "date") {
                    var dateInput = document.createElement("input");
                    dateInput.type = "date";
                    dateInput.className = "mewt-date-input " + round;
                    row.appendChild(dateInput);
                    addApplyBtn(function () {
                        if (!dateInput.value) {
                            showStatus("Pick a date first.", "warn");
                            return;
                        }
                        runBulkAction({
                            targetType: "date",
                            actionType: "set",
                            value: formatDateOutput(dateInput.value, cfg.dateFormat || "YYYY-MM-DD"),
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                    addClearBtn(function () {
                        dateInput.value = "";
                        runBulkAction({
                            targetType: "date",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                } else if (type === "rating") {
                    var maxStars = Math.max(1, Math.min(10, parseInt(cfg.ratingMax, 10) || 5));
                    var step = parseFloat(cfg.ratingStep) || 0.5;
                    var fillColor = cfg.ratingColor || "#FFC107";
                    var currentRating = 0;

                    var track = document.createElement("div");
                    track.className = "mewt-star-track";

                    var badge = document.createElement("span");
                    badge.className = "mewt-star-badge " + round;
                    badge.textContent = "0 / " + maxStars;

                    var fillLayers = [];
                    var starPath = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

                    for (var s = 0; s < maxStars; s++) {
                        var starBox = document.createElement("span");
                        starBox.className = "mewt-star-item";
                        starBox.innerHTML = "<svg viewBox='0 0 24 24'><path fill='#dcdcdc' d='" + starPath + "'/></svg>";
                        var fillDiv = document.createElement("div");
                        fillDiv.className = "mewt-star-fill-layer";
                        fillDiv.style.width = "0%";
                        fillDiv.innerHTML = "<svg viewBox='0 0 24 24'><path fill='" + fillColor + "' d='" + starPath + "'/></svg>";
                        starBox.appendChild(fillDiv);
                        track.appendChild(starBox);
                        fillLayers.push(fillDiv);
                    }

                    function renderStars(val) {
                        currentRating = val;
                        badge.textContent = val + " / " + maxStars;
                        for (var idx = 0; idx < maxStars; idx++) {
                            var pct = Math.max(0, Math.min(100, (val - idx) * 100));
                            fillLayers[idx].style.width = pct + "%";
                        }
                    }

                    function calcRatingFromPointer(clientX) {
                        var rect = track.getBoundingClientRect();
                        var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                        var raw = ratio * maxStars;
                        var snapped = Math.round(raw / step) * step;
                        var decimals = step < 0.25 ? 1 : 2;
                        return Number(Math.max(step, Math.min(maxStars, snapped)).toFixed(decimals));
                    }

                    var dragging = false;
                    track.onpointerdown = function (e) {
                        if (editMode) return;
                        dragging = true;
                        track.setPointerCapture(e.pointerId);
                        renderStars(calcRatingFromPointer(e.clientX));
                    };
                    track.onpointermove = function (e) {
                        if (!dragging) return;
                        renderStars(calcRatingFromPointer(e.clientX));
                    };
                    track.onpointerup = function () {
                        if (!dragging) return;
                        dragging = false;
                        if ((cfg.ratingTrigger || "release") === "release") {
                            runBulkAction({
                                targetType: "text",
                                actionType: "set",
                                value: String(currentRating),
                                columnMode: cfg.columnMode,
                                columnIndex: cfg.columnIndex,
                                columnHeader: cfg.columnHeader,
                                rowScope: cfg.rowScope
                            });
                        }
                    };

                    row.appendChild(track);
                    row.appendChild(badge);
                    if (cfg.ratingTrigger === "button") {
                        addApplyBtn(function () {
                            runBulkAction({
                                targetType: "text",
                                actionType: "set",
                                value: String(currentRating),
                                columnMode: cfg.columnMode,
                                columnIndex: cfg.columnIndex,
                                columnHeader: cfg.columnHeader,
                                rowScope: cfg.rowScope
                            });
                        });
                    }
                    addClearBtn(function () {
                        renderStars(0);
                        runBulkAction({
                            targetType: "text",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                } else if (type === "checkbox") {
                    var cbLabel = document.createElement("label");
                    cbLabel.className = "mewt-checkbox-label " + accent + " " + round;
                    var cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.className = "mewt-checkbox";
                    var cbSpan = document.createElement("span");
                    cbSpan.textContent = cfg.checkboxLabel || "Mark Complete";
                    cbLabel.appendChild(cb);
                    cbLabel.appendChild(cbSpan);

                    cb.onchange = function () {
                        var chosen = cb.checked ? (cfg.checkedValue || "Yes") : (cfg.uncheckedValue || "");
                        runBulkAction({
                            targetType: cfg.targetInputType || "text",
                            actionType: chosen === "" ? "clear" : "set",
                            value: chosen,
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    };
                    row.appendChild(cbLabel);
                } else if (type === "radio") {
                    var radioGroup = document.createElement("div");
                    radioGroup.className = "mewt-radio-group" + (cfg.radioOrientation === "vertical" ? " mewt-radio-vertical" : "");
                    var radioName = "mewt_radio_" + Math.random().toString(36).slice(2, 8);
                    var rPairs = parseKeyValuePairs(cfg.keyValuePairs);

                    rPairs.forEach(function (pair) {
                        var pill = document.createElement("label");
                        pill.className = "mewt-radio-pill " + round;
                        var rInput = document.createElement("input");
                        rInput.type = "radio";
                        rInput.name = radioName;
                        rInput.value = pair.value;
                        rInput.onchange = function () {
                            if (!rInput.checked) return;
                            runBulkAction({
                                targetType: cfg.targetInputType || "text",
                                actionType: "set",
                                value: pair.value,
                                columnMode: cfg.columnMode,
                                columnIndex: cfg.columnIndex,
                                columnHeader: cfg.columnHeader,
                                rowScope: cfg.rowScope
                            });
                        };
                        pill.appendChild(rInput);
                        pill.appendChild(document.createTextNode(pair.label));
                        radioGroup.appendChild(pill);
                    });

                    row.appendChild(radioGroup);
                    addClearBtn(function () {
                        var checked = radioGroup.querySelector("input:checked");
                        if (checked) checked.checked = false;
                        runBulkAction({
                            targetType: cfg.targetInputType || "text",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                } else if (type === "slider") {
                    var sMin = cfg.numMin != null ? Number(cfg.numMin) : 0;
                    var sMax = cfg.numMax != null ? Number(cfg.numMax) : 100;
                    var sStep = cfg.numStep != null ? Number(cfg.numStep) : 1;
                    var prefix = cfg.sliderPrefix || "";
                    var suffix = cfg.sliderSuffix || "";

                    var sWrap = document.createElement("div");
                    sWrap.className = "mewt-slider-wrap";
                    var slider = document.createElement("input");
                    slider.type = "range";
                    slider.className = "mewt-slider";
                    slider.min = sMin;
                    slider.max = sMax;
                    slider.step = sStep;
                    slider.value = sMin;

                    var sBadge = document.createElement("span");
                    sBadge.className = "mewt-slider-badge " + round;
                    sBadge.textContent = prefix + sMin + suffix;

                    slider.oninput = function () {
                        sBadge.textContent = prefix + slider.value + suffix;
                    };
                    slider.onchange = function () {
                        if ((cfg.sliderTrigger || "release") === "release") {
                            runBulkAction({
                                targetType: "text",
                                actionType: "set",
                                value: String(slider.value),
                                columnMode: cfg.columnMode,
                                columnIndex: cfg.columnIndex,
                                columnHeader: cfg.columnHeader,
                                rowScope: cfg.rowScope
                            });
                        }
                    };

                    sWrap.appendChild(slider);
                    sWrap.appendChild(sBadge);
                    row.appendChild(sWrap);

                    if (cfg.sliderTrigger === "button") {
                        addApplyBtn(function () {
                            runBulkAction({
                                targetType: "text",
                                actionType: "set",
                                value: String(slider.value),
                                columnMode: cfg.columnMode,
                                columnIndex: cfg.columnIndex,
                                columnHeader: cfg.columnHeader,
                                rowScope: cfg.rowScope
                            });
                        });
                    }
                    addClearBtn(function () {
                        slider.value = sMin;
                        sBadge.textContent = prefix + sMin + suffix;
                        runBulkAction({
                            targetType: "text",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                } else if (type === "stepper") {
                    var stMin = cfg.numMin != null ? Number(cfg.numMin) : 0;
                    var stMax = cfg.numMax != null ? Number(cfg.numMax) : 100;
                    var stStep = cfg.numStep != null ? Number(cfg.numStep) : 1;
                    var stInit = cfg.stepperDefault != null ? Number(cfg.stepperDefault) : stMin;

                    var stWrap = document.createElement("div");
                    stWrap.className = "mewt-stepper-wrap " + round;

                    var minusBtn = document.createElement("button");
                    minusBtn.type = "button";
                    minusBtn.className = "mewt-step-btn";
                    minusBtn.textContent = "−";

                    var stInput = document.createElement("input");
                    stInput.type = "number";
                    stInput.className = "mewt-stepper-input";
                    stInput.value = Math.max(stMin, Math.min(stMax, stInit));

                    var plusBtn = document.createElement("button");
                    plusBtn.type = "button";
                    plusBtn.className = "mewt-step-btn";
                    plusBtn.textContent = "+";

                    minusBtn.onclick = function () {
                        var next = (parseFloat(stInput.value) || 0) - stStep;
                        stInput.value = Math.max(stMin, Math.min(stMax, Number(next.toFixed(4))));
                    };
                    plusBtn.onclick = function () {
                        var next = (parseFloat(stInput.value) || 0) + stStep;
                        stInput.value = Math.max(stMin, Math.min(stMax, Number(next.toFixed(4))));
                    };
                    stInput.onkeydown = function (e) {
                        if (e.key === "Enter") {
                            runBulkAction({
                                targetType: "text",
                                actionType: "set",
                                value: String(stInput.value),
                                columnMode: cfg.columnMode,
                                columnIndex: cfg.columnIndex,
                                columnHeader: cfg.columnHeader,
                                rowScope: cfg.rowScope
                            });
                        }
                    };

                    stWrap.appendChild(minusBtn);
                    stWrap.appendChild(stInput);
                    stWrap.appendChild(plusBtn);
                    row.appendChild(stWrap);

                    addApplyBtn(function () {
                        runBulkAction({
                            targetType: "text",
                            actionType: "set",
                            value: String(stInput.value),
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                    addClearBtn(function () {
                        stInput.value = stInit;
                        runBulkAction({
                            targetType: "text",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                } else if (type === "multiselect") {
                    var msWrap = document.createElement("div");
                    msWrap.className = "mewt-multiselect-wrap";
                    var mPairs = parseKeyValuePairs(cfg.keyValuePairs);
                    var selectedVals = [];

                    mPairs.forEach(function (pair) {
                        var chip = document.createElement("button");
                        chip.type = "button";
                        chip.className = "mewt-pill " + round;
                        chip.textContent = pair.label;
                        chip.onclick = function () {
                            var idx = selectedVals.indexOf(pair.value);
                            if (idx === -1) {
                                selectedVals.push(pair.value);
                                chip.className = "mewt-pill mewt-pill-active " + accent + " " + round;
                            } else {
                                selectedVals.splice(idx, 1);
                                chip.className = "mewt-pill " + round;
                            }
                        };
                        msWrap.appendChild(chip);
                    });

                    row.appendChild(msWrap);
                    addApplyBtn(function () {
                        var joined = selectedVals.join(cfg.multiDelimiter != null ? cfg.multiDelimiter : ", ");
                        runBulkAction({
                            targetType: "text",
                            actionType: joined === "" ? "clear" : "set",
                            value: joined,
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                    addClearBtn(function () {
                        selectedVals = [];
                        Array.prototype.slice.call(msWrap.querySelectorAll(".mewt-pill")).forEach(function (c) {
                            c.className = "mewt-pill " + round;
                        });
                        runBulkAction({
                            targetType: "text",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                } else if (type === "stamp") {
                    var stampBtn = document.createElement("button");
                    stampBtn.type = "button";
                    stampBtn.className = "mewt-stamp-btn " + accent + " " + round;
                    stampBtn.textContent = cfg.stampButtonLabel || "Stamp Today";
                    stampBtn.onclick = function () {
                        var val = resolveStampValue(cfg);
                        runBulkAction({
                            targetType: cfg.stampTargetType || "text",
                            actionType: val === "" ? "clear" : "set",
                            value: val,
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    };
                    row.appendChild(stampBtn);
                } else if (type === "color") {
                    var cWrap = document.createElement("div");
                    cWrap.className = "mewt-color-wrap " + round;
                    var cInput = document.createElement("input");
                    cInput.type = "color";
                    cInput.className = "mewt-color-input";
                    cInput.value = cfg.defaultColorHex || "#2196F3";
                    var cHex = document.createElement("span");
                    cHex.className = "mewt-color-hex";
                    cHex.textContent = cInput.value.toUpperCase();

                    cInput.oninput = function () {
                        cHex.textContent = cInput.value.toUpperCase();
                    };

                    cWrap.appendChild(cInput);
                    cWrap.appendChild(cHex);
                    row.appendChild(cWrap);

                    addApplyBtn(function () {
                        runBulkAction({
                            targetType: "text",
                            actionType: "set",
                            value: cInput.value.toUpperCase(),
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                    addClearBtn(function () {
                        runBulkAction({
                            targetType: "text",
                            actionType: "clear",
                            value: "",
                            columnMode: cfg.columnMode,
                            columnIndex: cfg.columnIndex,
                            columnHeader: cfg.columnHeader,
                            rowScope: cfg.rowScope
                        });
                    });
                }

                card.appendChild(row);
                bar.appendChild(card);
            });

            container.appendChild(bar);
            container.appendChild(statusBanner);
            el.appendChild(container);

            return qlik.Promise.resolve();
        }
    };
});
