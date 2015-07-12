var canbus = require('canbus');
var serialPort = require("serialport");

var conn = null;
window.count = 0;
var bitRate = null; 

window.onload = function () {
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
    serialPort.list(onGetDevices);

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

var onGetDevices = function (err, devices) {
    deviceListDropdown = $('#deviceListDropdown');

    for (var i=0; i < devices.length; i++) {
        var friendlyName = devices[i].comName.split('/');
        friendlyName = friendlyName[friendlyName.length - 1];

        deviceListDropdown.append('<li><a href="#" data-device-path="' + devices[i].comName + '" class="device-listing">' + friendlyName + '</a></li>')
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
    //Log Table
    $('#msgs').DataTable({
        paging: false,
        info: false,
        searching: false,
        scrollY: "200px",
        order: [[ 0, "desc" ]]
    });

    $('.soloPanel').on('click', function(){
        if($(this).children('.glyphicon-resize-full').hasClass('hidden')) {
            $(this).children('.glyphicon-resize-full').removeClass('hidden');
            $(this).children('.glyphicon-resize-small').addClass('hidden')
        }
        else {
            $(this).children('.glyphicon-resize-full').addClass('hidden');
            $(this).children('.glyphicon-resize-small').removeClass('hidden')
        }

        //showing all elements
        if($(this).parent().parent().parent().parent().hasClass('soloPanel')) {
            $(this).parent().parent().parent().parent().toggleClass('soloPanel', 1000);
            $('.panel').each(function(){
                $(this).removeClass('hidden');
            })
        } else {
            $(this).parent().parent().parent().parent().toggleClass('soloPanel', 1000);
            $('.panel').each(function(){
                if(!$(this).hasClass('soloPanel')) {
                    $(this).toggleClass('hidden');
                }
            })
        }
    });

    $('.collapsePanel').on('click', function(){
        if($(this).children('.glyphicon-chevron-up').hasClass('hidden')) {
            $(this).children('.glyphicon-chevron-up').removeClass('hidden');
            $(this).children('.glyphicon-chevron-down').addClass('hidden')
        }
        else {
            $(this).children('.glyphicon-chevron-up').addClass('hidden');
            $(this).children('.glyphicon-chevron-down').removeClass('hidden')
        }
        
        $(this).parent().parent().parent().parent().children('.panel-body').toggleClass('hidden', 1000);
        $(this).parent().parent().parent().parent().toggleClass('panel-collapse', 1000);
    })
}

var msgsTableCount = 0;
function addToMsgs(Timestamp, ID, Type, B0, B1, B2, B3, B4, B5, B6, B7) {
    var tableMsgs = $('#msgs').DataTable();
    tableMsgs.row.add( [
        msgsTableCount + 1,
        Timestamp,
        ID,
        Type,
        B0,
        B1,
        B2,
        B3,
        B4,
        B5,
        B6,
        B7
    ] ).draw();

    msgsTableCount++;
}
