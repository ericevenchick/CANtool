var conn = null;
window.count = 0;

window.onload = function () {
    window.startTime = Date.now();
    window.onBus = false;

    var txSend = document.getElementById('txSend');
    txSend.addEventListener('click', function(e) {
	e.preventDefault();
        var id = Number(document.getElementById('txId').value);
        var dlc = Number(document.getElementById('txDlc').value);
        var data = [];

	// convert data bytes from text inputs to byte array
        for (var i=0; i < dlc; i++) {
            data.push(Number(document.getElementById('txB' + i).value));
        }

        f = new canbus.frame(id);
        f.dlc = dlc;
        f.data = data;
        conn.send(f);
    });

    chrome.serial.getDevices(onGetDevices);
}

var onDeviceClick = function () {
    if (window.onBus) {
        throw "already connected to device!";
    }

    conn = new canbus.slcan(this.innerHTML, 4, function(e) {
        var table = document.getElementById("msgs");
        var row = table.insertRow(1);
        var countCell = row.insertCell(0);
        var tsCell = row.insertCell(1);
        var idCell = row.insertCell(2);
        var typeCell = row.insertCell(3);
        var dlcCell = row.insertCell(4);

        countCell.innerHTML = window.count;
        idCell.innerHTML = "0x" + e.id.toString(16);
        tsCell.innerHTML = (e.timestamp - window.startTime)/1000;

        // set typestring for data type
        // D = data, R = remote
        if (e.is_remote) {
            var typeStr = "R";
        } else {
            var typeStr = "D";
        }
        if (e.is_ext_id) {
            typeStr += "X";
        }
        typeCell.innerHTML = typeStr;
        dlcCell.innerHTML = e.dlc;
        for (var i=0; i < e.dlc; i++) {
            var byteCell = row.insertCell(5+i);
            byteCell.innerHTML = "0x" + e.data[i].toString(16);
        }

        window.count++;
    });
    window.onBus = true;

    conn.open();
}

var onGetDevices = function (devicePaths) {
    deviceUl = document.getElementById("deviceList");

    deviceList.innerHTML = ""
    for (var i=0; i < devicePaths.length; i++) {
        var li = document.createElement("li");
        var a = document.createElement("a");

        a.href = "#";
        a.onclick = onDeviceClick;
        a.appendChild(document.createTextNode(devicePaths[i].path));

        li.appendChild(a);
        deviceUl.appendChild(li);
    }
}
