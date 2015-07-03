var conn = null;

window.onload = function () {
    window.startTime = Date.now();
    window.onBus = false;

    var openDeviceList = document.getElementById('openDeviceList');
    openDeviceList.addEventListener('click', function() {
        chrome.app.window.create('devicelist.html',
                                 {'width':300, 'height': 300});
    });

    var txForm = document.getElementById('txForm');
    txForm.addEventListener('submit', function() {
        var id = Number(document.getElementById('txId').value);
        var dlc = Number(document.getElementById('txDlc').value);
        var data = [];
        for (var i=0; i < dlc; i++) {
            data.push(Number(document.getElementById('txB' + i).value));
            console.log(data);
        }

        f = new canbus.frame(id);
        f.dlc = dlc;
        f.data = data;
        conn.send(f);
        return false;
    });
}
