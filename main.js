var conn = null;

window.onload = function () {
    chrome.serial.getDevices(onGetDevices);
}

var onDeviceClick = function () {
    console.log(this.innerHTML);

    conn = new canbus.slcan(this.innerHTML, function(e) { console.log(e); });
    console.log(conn);
    conn.open();
    f = new canbus.frame(0x7ff);
    setTimeout(function() {
    conn.send(f);}, 1000);
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
