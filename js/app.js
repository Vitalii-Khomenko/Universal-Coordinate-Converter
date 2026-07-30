function appendTextCell(row, value) {
    // Use textContent so imported point IDs cannot inject HTML into result tables.
    const cell = document.createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
}

function appendMapLinkCell(row, lat, lng) {
    const cell = document.createElement('td');
    const link = document.createElement('a');
    link.href = getGoogleMapsLink(lat, lng);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'map-link';
    link.textContent = 'View on Map';
    cell.appendChild(link);
    row.appendChild(cell);
    return cell;
}

function appendDownloadLink(fileName, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function escapeXml(value) {
    // KML is XML, so point IDs need XML escaping before export.
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function getDateStamp() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}${mm}${yyyy}`;
}

function isTxtFile(file) {
    // Some mobile browsers leave file.type empty for local .txt files.
    return file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain';
}

function isMapLibraryReady(showAlert) {
    const ready = typeof window.ol !== 'undefined';
    if (!ready && showAlert) {
        alert('Map visualization is unavailable because the map library did not load. Check your internet connection and reload the page.');
    }
    return ready;
}

const STRICT_DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

function parseStrictDecimal(value) {
    const text = String(value).trim();
    if (!STRICT_DECIMAL_PATTERN.test(text)) return null;
    const number = Number(text);
    return isFinite(number) ? number : null;
}

const IMPORT_MODE_CONFIG = {
    gk: {
        requiresHeight: true,
        firstName: 'Easting',
        secondName: 'Northing',
        isPlausiblePair: (first, second) =>
            first >= 2000000 && first <= 6000000 &&
            second >= 4500000 && second <= 6500000
    },
    sweref: {
        requiresHeight: true,
        firstName: 'Easting',
        secondName: 'Northing',
        isPlausiblePair: (first, second) =>
            first >= 0 && first <= 1500000 &&
            second >= 5000000 && second <= 8000000
    },
    wgs: {
        requiresHeight: false,
        firstName: 'Latitude',
        secondName: 'Longitude',
        isPlausiblePair: (first, second) =>
            first >= 0 && first <= 90 &&
            second >= 0 && second <= 180
    }
};

function cleanCoordinateLine(line) {
    const trimmed = String(line)
        .replace(/^\uFEFF/, '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
        .trim();
    if (!trimmed) return { content: '', kind: 'blank' };
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
        return { content: '', kind: 'comment' };
    }
    const withoutInlineComment = trimmed
        .replace(/\s+#.*$/, '')
        .replace(/\s+\/\/.*$/, '')
        .trim();
    return withoutInlineComment
        ? { content: withoutInlineComment, kind: 'data' }
        : { content: '', kind: 'comment' };
}

function parseCoordinateLine(line, mode, lineNumber) {
    const config = IMPORT_MODE_CONFIG[mode];
    const cleaned = cleanCoordinateLine(line);
    if (cleaned.kind !== 'data') {
        return { skip: true, skipKind: cleaned.kind };
    }
    if (!config) {
        return { error: `Line ${lineNumber}: Unsupported coordinate import mode.` };
    }

    const tokens = cleaned.content.split(/[\s;|]+/).filter(Boolean);
    let coordinateIndex = -1;
    for (let index = 1; index < tokens.length - 1; index++) {
        const first = parseStrictDecimal(tokens[index]);
        const second = parseStrictDecimal(tokens[index + 1]);
        if (first !== null && second !== null && config.isPlausiblePair(first, second)) {
            coordinateIndex = index;
            break;
        }
    }

    // Preserve the legacy standard layout even when coordinates are
    // outside the practical-area ranges used for flexible recognition.
    if (
        coordinateIndex === -1 &&
        tokens.length >= 3 &&
        parseStrictDecimal(tokens[1]) !== null &&
        parseStrictDecimal(tokens[2]) !== null
    ) {
        coordinateIndex = 1;
    }

    if (coordinateIndex === -1) {
        if (tokens.length >= 3) {
            const numericError = getStrictDecimalError(lineNumber, [
                { name: config.firstName, value: tokens[1] },
                { name: config.secondName, value: tokens[2] }
            ]);
            if (numericError) return { error: numericError };
        }
        return {
            error: `Line ${lineNumber}: Could not identify ${config.firstName} and ${config.secondName}.`
        };
    }

    const pointID = tokens.slice(0, coordinateIndex).join(' ').trim();
    if (!pointID) {
        return { error: `Line ${lineNumber}: PointID is missing.` };
    }

    const firstText = tokens[coordinateIndex];
    const secondText = tokens[coordinateIndex + 1];
    let consumedTokens = coordinateIndex + 2;
    let heightText = null;
    let defaultedHeight = false;
    if (config.requiresHeight) {
        if (
            tokens.length > consumedTokens &&
            parseStrictDecimal(tokens[consumedTokens]) !== null
        ) {
            heightText = tokens[consumedTokens];
            consumedTokens++;
        } else {
            heightText = '0.000';
            defaultedHeight = true;
        }
    }

    return {
        pointID,
        firstText,
        secondText,
        firstValue: parseStrictDecimal(firstText),
        secondValue: parseStrictDecimal(secondText),
        heightText,
        heightValue: heightText === null ? null : parseStrictDecimal(heightText),
        defaultedHeight,
        multiPartPointID: coordinateIndex > 1,
        extraFieldCount: Math.max(0, tokens.length - consumedTokens)
    };
}

function normalizeImportedCoordinateText(text, mode) {
    const config = IMPORT_MODE_CONFIG[mode];
    const normalizedLines = [];
    const summary = {
        importedCount: 0,
        blankCount: 0,
        commentCount: 0,
        invalidCount: 0,
        defaultedHeightCount: 0,
        multiPartPointIdCount: 0,
        extraFieldCount: 0
    };

    String(text).split(/\r?\n/).forEach((line, index) => {
        const parsed = parseCoordinateLine(line, mode, index + 1);
        if (parsed.skip) {
            if (parsed.skipKind === 'comment') summary.commentCount++;
            else summary.blankCount++;
            return;
        }
        if (parsed.error) {
            summary.invalidCount++;
            return;
        }

        const fields = [parsed.pointID, parsed.firstText, parsed.secondText];
        if (config.requiresHeight) fields.push(parsed.heightText);
        normalizedLines.push(fields.join('\t'));
        summary.importedCount++;
        if (parsed.defaultedHeight) summary.defaultedHeightCount++;
        if (parsed.multiPartPointID) summary.multiPartPointIdCount++;
        summary.extraFieldCount += parsed.extraFieldCount;
    });

    return { text: normalizedLines.join('\n'), summary };
}

function showImportStatus(statusId, summary) {
    const removedCount = summary.blankCount + summary.commentCount + summary.invalidCount;
    const headline =
        `Imported: ${summary.importedCount} | Removed non-data lines: ${removedCount} | ` +
        `Default heights: ${summary.defaultedHeightCount}`;
    const details = [];
    if (summary.defaultedHeightCount) {
        details.push(`${summary.defaultedHeightCount} row(s) had no height; 0.000 was added.`);
    }
    if (summary.multiPartPointIdCount) {
        details.push(`${summary.multiPartPointIdCount} multi-part point ID(s) were preserved.`);
    }
    if (summary.extraFieldCount) {
        details.push(`${summary.extraFieldCount} trailing field(s) were removed.`);
    }
    if (summary.invalidCount) {
        details.push(`${summary.invalidCount} unrecognized line(s) were removed.`);
    }
    if (!summary.importedCount) {
        setStatus(statusId, 'error', [headline, 'No coordinate records were recognized in the file.']);
        return;
    }
    const type =
        summary.defaultedHeightCount || summary.extraFieldCount || summary.invalidCount
            ? 'warning'
            : 'success';
    setStatus(statusId, type, [headline, ...details]);
}

function getStrictDecimalError(lineNumber, fields) {
    const invalidFields = fields
        .filter(field => parseStrictDecimal(field.value) === null)
        .map(field => field.name);
    if (!invalidFields.length) return '';
    return `Line ${lineNumber}: Invalid numeric field(s): ${invalidFields.join(', ')}. Use digits and one optional decimal point only.`;
}

function clearStatus(statusId) {
    const status = document.getElementById(statusId);
    if (!status) return;
    status.textContent = '';
    status.hidden = true;
    status.className = 'status-message';
}

function setStatus(statusId, type, messages) {
    const status = document.getElementById(statusId);
    if (!status) return;
    const summary = Array.isArray(messages) ? messages[0] : messages;
    const details = Array.isArray(messages) ? messages.slice(1).filter(Boolean) : [];
    if (!summary) {
        clearStatus(statusId);
        return;
    }
    status.textContent = '';
    const summaryNode = document.createElement('div');
    summaryNode.className = 'status-summary';
    summaryNode.textContent = summary;
    status.appendChild(summaryNode);
    if (details.length) {
        const list = document.createElement('ul');
        list.className = 'status-details';
        details.forEach(detail => {
            const item = document.createElement('li');
            item.textContent = detail;
            list.appendChild(item);
        });
        status.appendChild(list);
    }
    status.hidden = false;
    status.className = `status-message ${type}`;
}

function showConversionStatus(statusId, convertedCount, errors, warnings) {
    const summary = `Converted: ${convertedCount} | Errors: ${errors.length} | Warnings: ${warnings.length}`;
    if (errors.length) {
        setStatus(statusId, 'error', [summary, ...errors, ...warnings]);
        return;
    }
    if (warnings.length) {
        setStatus(statusId, 'warning', [summary, ...warnings]);
        return;
    }
    if (convertedCount === 0) {
        setStatus(statusId, 'warning', 'No valid input rows found.');
        return;
    }
    setStatus(statusId, 'success', summary);
}

const resultViewConfig = {
    resultsBody: {
        emptyId: 'gkEmptyState',
        wrapId: 'gkTableWrap',
        countId: 'gkResultCount',
        actionIds: ['copyGkButton', 'saveGkTxtButton']
    },
    wgsResultsBody: {
        emptyId: 'wgsEmptyState',
        wrapId: 'wgsTableWrap',
        countId: 'wgsResultCount',
        actionIds: ['copyWgsButton', 'saveWgsTxtButton']
    },
    swerefResultsBody: {
        emptyId: 'swerefEmptyState',
        wrapId: 'swerefTableWrap',
        countId: 'swerefResultCount',
        actionIds: ['copySwerefButton', 'saveSwerefTxtButton']
    }
};

function updateResultView(bodyId) {
    const config = resultViewConfig[bodyId];
    const body = document.getElementById(bodyId);
    if (!config || !body) return;
    const rowCount = body.querySelectorAll('tr').length;
    const isEmpty = rowCount === 0;
    const emptyState = document.getElementById(config.emptyId);
    const tableWrap = document.getElementById(config.wrapId);
    const resultCount = document.getElementById(config.countId);
    if (emptyState) emptyState.hidden = !isEmpty;
    if (tableWrap) tableWrap.dataset.empty = String(isEmpty);
    if (resultCount) resultCount.textContent = `${rowCount} ${rowCount === 1 ? 'point' : 'points'}`;
    config.actionIds.forEach(actionId => {
        const action = document.getElementById(actionId);
        if (action) action.disabled = isEmpty;
    });
}

function loadCoordinateSample(textareaId, sample, clearFunction) {
    clearFunction();
    const textarea = document.getElementById(textareaId);
    textarea.value = sample;
    textarea.focus();
}

function getTableAsTsv(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return '';
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => {
            const link = cell.querySelector('a');
            const value = link ? link.href : cell.textContent;
            return value.trim().replace(/\s+/g, ' ');
        }).join('\t');
    }).filter(Boolean).join('\n');
}

function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'clipboard-helper';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied ? Promise.resolve() : Promise.reject(new Error('Clipboard copy failed'));
}

function copyResults(tableId, statusId) {
    const text = getTableAsTsv(tableId);
    const dataRows = document.querySelectorAll(`#${tableId} tbody tr`).length;
    if (!dataRows) {
        setStatus(statusId, 'warning', 'No result rows to copy.');
        return;
    }
    copyTextToClipboard(text)
        .then(() => setStatus(statusId, 'success', `Copied ${dataRows} row${dataRows === 1 ? '' : 's'} to clipboard.`))
        .catch(() => setStatus(statusId, 'error', 'Clipboard copy failed. Use Save as TXT instead.'));
}

function isLikelySweref18Area(lat, lng) {
    // EPSG:3011 is useful near Sweden's 18E zone; warn outside this practical range.
    return lat >= 54.5 && lat <= 70.0 && lng >= 16.5 && lng <= 19.5;
}

function getSweref18AreaWarning(lat, lng, lineNumber) {
    if (isLikelySweref18Area(lat, lng)) return '';
    return `Line ${lineNumber}: Coordinate is outside the practical SWEREF99 18 00 area. Result is calculated, but verify it before field use.`;
}

function createSourceToWgsRow(pointID, x, y, height, lat, lng) {
    const row = document.createElement('tr');
    appendTextCell(row, pointID);
    appendTextCell(row, x.toFixed(3));
    appendTextCell(row, y.toFixed(3));
    appendTextCell(row, height.toFixed(3));
    appendTextCell(row, lat.toFixed(6));
    appendTextCell(row, lng.toFixed(6));
    appendMapLinkCell(row, lat, lng);
    return row;
}

function createWgsTargetRow(pointID, lat, lng, easting, northing) {
    const row = document.createElement('tr');
    appendTextCell(row, pointID);
    appendTextCell(row, lat.toFixed(8));
    appendTextCell(row, lng.toFixed(8));
    appendTextCell(row, easting);
    appendTextCell(row, northing);
    return row;
}

// SWEREF99 18 00 to WGS84 conversion functions - Built-in Mathematical Implementation

// WGS84 to SWEREF99 18 00 conversion - Built-in Mathematical Implementation

function convertSwerefToWGS84() {
    const input = document.getElementById('swerefCoordinates').value;
    const lines = input.trim().split('\n');
    const resultsBody = document.getElementById('swerefResultsBody');
    resultsBody.innerHTML = '';
    clearStatus('swerefStatus');

    const errors = [];
    const warnings = [];
    let convertedCount = 0;

    lines.forEach((line, idx) => {
        const parsed = parseCoordinateLine(line, 'sweref', idx + 1);
        if (parsed.skip) return;
        if (parsed.error) {
            errors.push(parsed.error);
            return;
        }
        if (parsed.defaultedHeight) {
            warnings.push(`Line ${idx + 1}: Height was missing; 0.000 was used.`);
        }
        const pointID = parsed.pointID;
        const xNum = parsed.firstValue;
        const yNum = parsed.secondValue;
        const hNum = parsed.heightValue;

        try {
            const { lat, lng } = sweref99ToWGS84(xNum, yNum);

            if (!isFinite(lat) || !isFinite(lng)) {
                errors.push(`Line ${idx+1}: Conversion failed - invalid result`);
                return;
            }

            const warning = getSweref18AreaWarning(lat, lng, idx + 1);
            if (warning) warnings.push(warning);
            resultsBody.appendChild(createSourceToWgsRow(pointID, xNum, yNum, hNum, lat, lng));
            convertedCount++;
        } catch (error) {
            errors.push(`Line ${idx+1}: Error converting coordinates: ${error && error.message ? error.message : error}`);
        }
    });

    showConversionStatus('swerefStatus', convertedCount, errors, warnings);
    updateResultView('swerefResultsBody');

    // Update map if available
    if (map && typeof updateMap === 'function') {
        updateSwerefMap();
    }
}

function clearSwerefInput() {
    document.getElementById('swerefCoordinates').value = '';
    document.getElementById('swerefResultsBody').innerHTML = '';
    clearStatus('swerefStatus');
    updateResultView('swerefResultsBody');
}

function handleSwerefFileImport(event) {
    importCoordinateTextFile(
        event,
        'sweref',
        'swerefCoordinates',
        'swerefStatus',
        fileName => { lastSwerefImportFileName = fileName; }
    );
}

function saveSwerefToTxt() {
    const rows = document.querySelectorAll('#swerefResultsBody tr');
    if (!rows.length) {
        alert('No data to save.');
        return;
    }

    let content = 'PointID\tEasting_SWEREF99\tNorthing_SWEREF99\tHeight\tLatitude_WGS84\tLongitude_WGS84\n';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            content += `${cells[0].textContent}\t${cells[1].textContent}\t${cells[2].textContent}\t${cells[3].textContent}\t${cells[4].textContent}\t${cells[5].textContent}\n`;
        }
    });

    let fileName = 'sweref99_to_wgs84_results.txt';
    if (lastSwerefImportFileName && lastSwerefImportFileName.toLowerCase().endsWith('.txt')) {
        fileName = lastSwerefImportFileName.replace(/\.txt$/i, '_converted.txt');
    } else {
        fileName = `sweref99_results_${getDateStamp()}.txt`;
    }

    appendDownloadLink(fileName, content, 'text/plain');
}

function updateSwerefMap() {
    updateMap();
}

function convertWGS84ToTarget() {
    const targetSystem = document.getElementById('targetSystem').value;
    const input = document.getElementById('wgsCoordinates').value;
    const lines = input.trim().split('\n');
    const resultsBody = document.getElementById('wgsResultsBody');
    resultsBody.innerHTML = '';
    clearStatus('wgsStatus');

    // Update table headers based on target system
    const eastingHeader = document.getElementById('eastingHeader');
    const northingHeader = document.getElementById('northingHeader');
    if (targetSystem === 'sweref99') {
        eastingHeader.textContent = 'Easting (SWEREF99)';
        northingHeader.textContent = 'Northing (SWEREF99)';
    } else {
        eastingHeader.textContent = 'Easting';
        northingHeader.textContent = 'Northing';
    }

    const errors = [];
    const warnings = [];
    let convertedCount = 0;
    lines.forEach((line, idx) => {
        const parsed = parseCoordinateLine(line, 'wgs', idx + 1);
        if (parsed.skip) return;
        if (parsed.error) {
            errors.push(parsed.error);
            return;
        }
        const pointID = parsed.pointID;
        const latNum = parsed.firstValue;
        const lngNum = parsed.secondValue;
        try {
            let result;
            if (targetSystem === 'sweref99') {
                // Convert WGS84 to SWEREF99
                const warning = getSweref18AreaWarning(latNum, lngNum, idx + 1);
                if (warning) warnings.push(warning);
                result = wgs84ToSweref99(latNum, lngNum);
                if (!result || !isFinite(result.x) || !isFinite(result.y)) {
                    errors.push(`Line ${idx+1}: SWEREF99 conversion failed`);
                    return;
                }
                resultsBody.appendChild(createWgsTargetRow(pointID, latNum, lngNum, result.x.toFixed(3), result.y.toFixed(3)));
                convertedCount++;
            } else {
                // Convert WGS84 to GK (existing functionality)
                const pot = wgs2pot(lngNum, latNum);
                if (!pot || !isFinite(pot.lng) || !isFinite(pot.lat)) {
                    errors.push(`Line ${idx+1}: Datum shift failed`);
                    return;
                }
                const gk = Dezimal2GK(pot.lng, pot.lat);
                if (!gk || !gk.r || !gk.h) {
                    errors.push(`Line ${idx+1}: GK conversion failed. The point is outside the Germany-focused GK range used by the app.`);
                    return;
                }
                resultsBody.appendChild(createWgsTargetRow(pointID, latNum, lngNum, gk.r, gk.h));
                convertedCount++;
            }
        } catch (error) {
            errors.push(`Line ${idx+1}: Error converting coordinates: ${error && error.message ? error.message : error}`);
        }
    });
    showConversionStatus('wgsStatus', convertedCount, errors, warnings);
    updateResultView('wgsResultsBody');
    if (map && typeof updateMap === 'function') {
        updateMap();
    }
}

function convertWGS84ToGK() {
    // Legacy function - redirect to new function
    document.getElementById('targetSystem').value = 'gk';
    convertWGS84ToTarget();
}

let map, vectorSource, vectorLayer;

function initMap(showAlert = false) {
    if (map) return true;
    if (!isMapLibraryReady(showAlert)) return false;
    vectorSource = new ol.source.Vector();
    vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });
    map = new ol.Map({
        target: 'mapContainer',
        layers: [
            new ol.layer.Tile({ source: new ol.source.OSM() }),
            vectorLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([10.0, 51.0]),
            zoom: 6
        })
    });
    return true;
}

function collectMapPoints() {
    // WGS84 coordinates are read from the visible result tables, including WGS84-to-target inputs.
    const allPoints = [];

    const collectRows = (selector, latIndex, lngIndex, source) => {
        document.querySelectorAll(selector).forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length <= Math.max(latIndex, lngIndex)) return;
            const pointID = cells[0].textContent.trim();
            const lat = parseFloat(cells[latIndex].textContent);
            const lng = parseFloat(cells[lngIndex].textContent);
            if (!isFinite(lat) || !isFinite(lng)) return;
            allPoints.push({ pointID, lat, lng, source });
        });
    };

    collectRows('#resultsBody tr', 4, 5, 'GK');
    collectRows('#swerefResultsBody tr', 4, 5, 'SWEREF99');
    collectRows('#wgsResultsBody tr', 1, 2, 'WGS84');

    return allPoints;
}

function updateMap() {
    if (!map || !vectorSource) return;
    vectorSource.clear();
    const allPoints = collectMapPoints();

    if (allPoints.length > 0) {
        allPoints.forEach(pt => {
            const pointFeature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([pt.lng, pt.lat]))
            });

            // Different colors for different sources
            const color = pt.source === 'SWEREF99' ? '#2196F3' : pt.source === 'WGS84' ? '#607D8B' : '#4CAF50';

            pointFeature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({ color: color }),
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
                })
            }));

            const textFeature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([pt.lng, pt.lat]))
            });
            textFeature.setStyle(new ol.style.Style({
                text: new ol.style.Text({
                    text: pt.pointID,
                    font: 'bold 13px Arial',
                    fill: new ol.style.Fill({ color: '#FF9800' }),
                    stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
                    offsetY: -18
                })
            }));

            vectorSource.addFeature(pointFeature);
            vectorSource.addFeature(textFeature);
        });

        map.getView().setCenter(ol.proj.fromLonLat([allPoints[0].lng, allPoints[0].lat]));
        map.getView().setZoom(13);
    } else {
        map.getView().setCenter(ol.proj.fromLonLat([10.0, 51.0]));
        map.getView().setZoom(6);
    }
}

function clearInput() {
    document.getElementById('coordinates').value = '';
    document.getElementById('resultsBody').innerHTML = '';
    clearStatus('gkStatus');
    updateResultView('resultsBody');
}

function clearWGSInput() {
    document.getElementById('wgsCoordinates').value = '';
    document.getElementById('wgsResultsBody').innerHTML = '';
    clearStatus('wgsStatus');
    updateResultView('wgsResultsBody');
}

function handleWGSFileImport(event) {
    importCoordinateTextFile(
        event,
        'wgs',
        'wgsCoordinates',
        'wgsStatus',
        fileName => { lastWgsImportFileName = fileName; }
    );
}

function saveToTxt() {
    const rows = document.querySelectorAll('#resultsBody tr');
    if (!rows.length) {
        alert('No data to save.');
        return;
    }

    let content = 'PointID\tEasting_GK\tNorthing_GK\tHeight\tLatitude_WGS84\tLongitude_WGS84\n';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            content += `${cells[0].textContent}\t${cells[1].textContent}\t${cells[2].textContent}\t${cells[3].textContent}\t${cells[4].textContent}\t${cells[5].textContent}\n`;
        }
    });

    let fileName = 'gk_to_wgs84_results.txt';
    if (lastGkImportFileName && lastGkImportFileName.toLowerCase().endsWith('.txt')) {
        fileName = lastGkImportFileName.replace(/\.txt$/i, '_converted.txt');
    } else {
        fileName = `gk_results_${getDateStamp()}.txt`;
    }

    appendDownloadLink(fileName, content, 'text/plain');
}

function saveWGS84ToTxt() {
    const rows = document.querySelectorAll('#wgsResultsBody tr');
    if (!rows.length) {
        alert('No data to save.');
        return;
    }

    const targetSystem = document.getElementById('targetSystem').value;
    let content;

    if (targetSystem === 'sweref99') {
        content = 'PointID\tLatitude_WGS84\tLongitude_WGS84\tEasting_SWEREF99\tNorthing_SWEREF99\n';
    } else {
        content = 'PointID\tLatitude_WGS84\tLongitude_WGS84\tEasting_GK\tNorthing_GK\n';
    }

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            content += `${cells[0].textContent}\t${cells[1].textContent}\t${cells[2].textContent}\t${cells[3].textContent}\t${cells[4].textContent}\n`;
        }
    });

    let fileName;
    if (targetSystem === 'sweref99') {
        fileName = 'wgs84_to_sweref99_results.txt';
    } else {
        fileName = 'wgs84_to_gk_results.txt';
    }

    if (lastWgsImportFileName && lastWgsImportFileName.toLowerCase().endsWith('.txt')) {
        const systemSuffix = targetSystem === 'sweref99' ? '_sweref99' : '_gk';
        fileName = lastWgsImportFileName.replace(/\.txt$/i, `${systemSuffix}_converted.txt`);
    } else {
        const systemSuffix = targetSystem === 'sweref99' ? '_sweref99' : '_gk';
        fileName = `wgs84${systemSuffix}_results_${getDateStamp()}.txt`;
    }

    appendDownloadLink(fileName, content, 'text/plain');
}

function convertCoordinates() {
    const input = document.getElementById('coordinates').value;
    const lines = input.trim().split('\n');
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';
    clearStatus('gkStatus');
    const errors = [];
    const warnings = [];
    let convertedCount = 0;
    lines.forEach((line, idx) => {
        const parsed = parseCoordinateLine(line, 'gk', idx + 1);
        if (parsed.skip) return;
        if (parsed.error) {
            errors.push(parsed.error);
            return;
        }
        if (parsed.defaultedHeight) {
            warnings.push(`Line ${idx + 1}: Height was missing; 0.000 was used.`);
        }
        const pointID = parsed.pointID;
        const xNum = parsed.firstValue;
        const yNum = parsed.secondValue;
        const hNum = parsed.heightValue;
        try {
            const { lat, lng } = gk2geo(xNum, yNum);
            resultsBody.appendChild(createSourceToWgsRow(pointID, xNum, yNum, hNum, lat, lng));
            convertedCount++;
        } catch (error) {
            errors.push(`Line ${idx+1}: Error converting coordinates: ${error && error.message ? error.message : error}`);
        }
    });
    showConversionStatus('gkStatus', convertedCount, errors, warnings);
    updateResultView('resultsBody');
    if (map && typeof updateMap === 'function') {
        updateMap();
    }
}

function getGoogleMapsLink(lat, lon) {
    return `https://maps.google.com/?q=${lat},${lon}`;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.hidden = true;
    });
    const selectedPanel = document.getElementById(tabId);
    selectedPanel.classList.add('active');
    selectedPanel.hidden = false;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');
        }
    });
    if (tabId === 'map') {
        if (initMap(true)) {
            requestAnimationFrame(() => {
                map.updateSize();
                updateMap();
            });
        }
    }
}

let lastGkImportFileName = null;
let lastWgsImportFileName = null;
let lastSwerefImportFileName = null;

function importCoordinateTextFile(event, mode, textareaId, statusId, rememberFileName) {
    const file = event.target.files[0];
    if (!file) return;
    if (!isTxtFile(file)) {
        alert('Please select a text file (.txt)');
        event.target.value = '';
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size: 5MB');
        event.target.value = '';
        return;
    }
    rememberFileName(file.name);
    const reader = new FileReader();
    reader.onload = function(e) {
        const normalized = normalizeImportedCoordinateText(e.target.result, mode);
        document.getElementById(textareaId).value = normalized.text;
        showImportStatus(statusId, normalized.summary);
    };
    reader.onerror = function() {
        alert('Error reading file');
        event.target.value = '';
    };
    reader.readAsText(file);
    event.target.value = '';
}

function handleFileImport(event) {
    importCoordinateTextFile(
        event,
        'gk',
        'coordinates',
        'gkStatus',
        fileName => { lastGkImportFileName = fileName; }
    );
}

function exportKML() {
    // KML uses all WGS84 coordinates currently present in the result tables.
    const allPoints = collectMapPoints();

    if (!allPoints.length) {
        alert('No points to export.');
        return;
    }

    let kml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    kml += `<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n`;

    allPoints.forEach(point => {
        kml += `<Placemark>\n`;
        kml += `<name>${escapeXml(point.pointID)}</name>\n`;
        kml += `<Point><coordinates>${point.lng},${point.lat},0</coordinates></Point>\n`;
        kml += `</Placemark>\n`;
    });

    kml += `</Document>\n</kml>`;

    let fileName = 'points.kml';
    const sourceFileName = lastGkImportFileName || lastSwerefImportFileName || lastWgsImportFileName;
    if (sourceFileName && sourceFileName.toLowerCase().endsWith('.txt')) {
        fileName = sourceFileName.replace(/\.txt$/i, '.kml');
    } else {
        fileName = `${getDateStamp()}.kml`;
    }

    appendDownloadLink(fileName, kml, 'application/vnd.google-earth.kml+xml');
}

function setupEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        tab.addEventListener('keydown', event => {
            const tabs = Array.from(document.querySelectorAll('.tab'));
            const currentIndex = tabs.indexOf(event.currentTarget);
            let nextIndex = currentIndex;
            if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
            if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = tabs.length - 1;
            if (nextIndex !== currentIndex) {
                event.preventDefault();
                tabs[nextIndex].focus();
                switchTab(tabs[nextIndex].dataset.tab);
            }
        });
    });

    document.getElementById('convertGkButton').addEventListener('click', convertCoordinates);
    document.getElementById('loadGkSampleButton').addEventListener('click', () => {
        loadCoordinateSample('coordinates', '1029 3568189.267 5657692.868 321.609', clearInput);
    });
    document.getElementById('clearGkButton').addEventListener('click', clearInput);
    document.getElementById('importGkButton').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('saveGkTxtButton').addEventListener('click', saveToTxt);
    document.getElementById('copyGkButton').addEventListener('click', () => copyResults('resultsTable', 'gkStatus'));
    document.getElementById('fileInput').addEventListener('change', handleFileImport);

    document.getElementById('convertWgsButton').addEventListener('click', convertWGS84ToTarget);
    document.getElementById('loadWgsSampleButton').addEventListener('click', () => {
        loadCoordinateSample(
            'wgsCoordinates',
            '1029 51.05031687 9.971396507\n1030 55.12345678 18.98765432',
            clearWGSInput
        );
    });
    document.getElementById('clearWgsButton').addEventListener('click', clearWGSInput);
    document.getElementById('importWgsButton').addEventListener('click', () => document.getElementById('wgsFileInput').click());
    document.getElementById('saveWgsTxtButton').addEventListener('click', saveWGS84ToTxt);
    document.getElementById('copyWgsButton').addEventListener('click', () => copyResults('wgsResultsTable', 'wgsStatus'));
    document.getElementById('wgsFileInput').addEventListener('change', handleWGSFileImport);

    document.getElementById('convertSwerefButton').addEventListener('click', convertSwerefToWGS84);
    document.getElementById('loadSwerefSampleButton').addEventListener('click', () => {
        loadCoordinateSample('swerefCoordinates', '1029 153905.093 6579354.449 0.000', clearSwerefInput);
    });
    document.getElementById('clearSwerefButton').addEventListener('click', clearSwerefInput);
    document.getElementById('importSwerefButton').addEventListener('click', () => document.getElementById('swerefFileInput').click());
    document.getElementById('saveSwerefTxtButton').addEventListener('click', saveSwerefToTxt);
    document.getElementById('copySwerefButton').addEventListener('click', () => copyResults('swerefResultsTable', 'swerefStatus'));
    document.getElementById('swerefFileInput').addEventListener('change', handleSwerefFileImport);

    document.getElementById('exportKmlButton').addEventListener('click', exportKML);

    Object.keys(resultViewConfig).forEach(updateResultView);
}

document.addEventListener('DOMContentLoaded', setupEventListeners);
