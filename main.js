var conn = null;
window.count = 0;
var bitRate = null; 

window.onload = function () {
    $(document).foundation();
    setupUI();
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

function onReceive(e) {
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
        }

var onGetDevices = function (devicePaths) {
    deviceListDropdown = $('#deviceListDropdown');

    for (var i=0; i < devicePaths.length; i++) {
        var friendlyName = devicePaths[i].path.split('/');
        friendlyName = friendlyName[friendlyName.length - 1];

        deviceListDropdown.append('<li><a href="#" data-device-path="' + devicePaths[i].path + '" class="device-listing">' + friendlyName + '</a></li>')
    }

    $('.device-listing').on('click', function (){
        if (window.onBus) {
            throw "already connected to device!";
        }

        $(this).parent().addClass('active'); 
        $('#selectedDevice').text($(this).text());

        conn = new canbus.slcan($(this).attr('data-device-path'), 4, onReceive);
        window.onBus = true;

        conn.open();
    });
}

//sets up the UI elements on each panel/tool
function setupUI() {
    $('.tool-colapse-expand').on('click', function(){
        if($(this).children('.fi-arrow-up').hasClass('hide')) {
            $(this).children('.fi-arrow-up').removeClass('hide');
            $(this).children('.fi-arrow-down').addClass('hide')
        }
        else {
            $(this).children('.fi-arrow-up').addClass('hide');
            $(this).children('.fi-arrow-down').removeClass('hide')
        }
        
        $(this).parent().parent().parent().parent().children('.tool-body').toggleClass('hide', 1000);
    })
}