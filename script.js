const dbRequest = indexedDB.open("RackLocationDB", 1);
dbRequest.onupgradeneeded = function(event) {
    let db = event.target.result;
    if (!db.objectStoreNames.contains("locations")) {
        db.createObjectStore("locations", { keyPath: "id", autoIncrement: true });
    }
};

dbRequest.onsuccess = function(event) {
    console.log("Database opened successfully");
};

function generateCodes() {
    let rack = document.getElementById("rack").value;
    let column = document.getElementById("column").value;
    let level = document.getElementById("level").value;
    let locations = parseInt(document.getElementById("locations").value);
    let picking = document.getElementById("picking").checked;
    let pickingLocations = parseInt(document.getElementById("pickingLocations").value);
    let table = document.getElementById("resultTable");
    
    let db = dbRequest.result;
    let transaction = db.transaction("locations", "readwrite");
    let store = transaction.objectStore("locations");
    
    for (let l = 1; l <= locations; l++) {
        let code = `R${rack}C${column}L${level}S${l}`;
        if (picking) {
            for (let p = 0; p < pickingLocations; p++) {
                let pickCode = code + String.fromCharCode(65 + p);
                addRow(table, rack, column, level, `S${l}`, pickCode);
                store.add({ rack, column, level, slot: `S${l}`, code: pickCode });
            }
        } else {
            addRow(table, rack, column, level, `S${l}`, code);
            store.add({ rack, column, level, slot: `S${l}`, code });
        }
    }
    document.getElementById("rackForm").reset();
    togglePicking();
}

function addRow(table, rack, column, level, slot, code) {
    let row = table.insertRow();
    row.insertCell(0).innerText = "R" + rack;
    row.insertCell(1).innerText = column;
    row.insertCell(2).innerText = level;
    row.insertCell(3).innerText = slot;
    row.insertCell(4).innerText = code;
}

function togglePicking() {
    let pickingContainer = document.getElementById("pickingContainer");
    let pickingCheckbox = document.getElementById("picking");
    pickingContainer.style.display = pickingCheckbox.checked ? "block" : "none";
}

function exportToCSV() {
    let table = document.getElementById("resultTable");
    let rows = table.getElementsByTagName("tr");
    let csvContent = "data:text/csv;charset=utf-8,Rack,Column,Level,Slot,Code Location\n";
    
    for (let row of rows) {
        let cells = row.getElementsByTagName("td");
        let rowData = [];
        for (let cell of cells) {
            rowData.push(cell.innerText);
        }
        csvContent += rowData.join(",") + "\n";
    }
    
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rack_locations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.onload = function() {
    let db = dbRequest.result;
    let transaction = db.transaction("locations", "readonly");
    let store = transaction.objectStore("locations");
    let request = store.getAll();
    
    request.onsuccess = function(event) {
        let table = document.getElementById("resultTable");
        request.result.forEach(entry => {
            addRow(table, entry.rack, entry.column, entry.level, entry.slot, entry.code);
        });
    };
};


