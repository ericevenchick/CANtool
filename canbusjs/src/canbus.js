"use strict";


// top level variable for canbus library
var canbus = {};

// can frame
canbus.frame = function(id) {
    this.id = id;
    this.dlc = null;
    this.data = [];
    this.is_ext_id = false;
    this.is_remote = false;
}

// slcan interface
canbus.slcan = function(dev_str, recvFrameCallback) {
    this.dev_str = dev_str;
    this.conn = null;

    // variables to hold the incomming string until it terminates
    this._recv_count = 0;
    this._recv_str = "";

    // callback for received frames
    this.recvFrameCallback = recvFrameCallback;
}

// slcan constants
canbus.slcan.STD_ID_LEN = 3;
canbus.slcan.EXT_ID_LEN = 8;

canbus.slcan.prototype.open = function() {
    this.conn = chrome.serial.connect(this.dev_str, {},
                                      this._serialOpenCallback.bind(this));
    chrome.serial.onReceive.addListener(this._serialRecvCallback.bind(this));
}

canbus.slcan.prototype._serialOpenCallback = function(conn) {
    if (!conn) {
        console.log('failed to connect to device ' + this.dev_str);
        return;
    }

    this.conn = conn;
    console.log('connected to device ' + this.dev_str);
    chrome.serial.flush(conn.connectionId, function(){});
}

canbus.slcan.prototype._serialRecvCallback = function(received) {
    var data = new Uint8Array(received.data);

    // receive the characters and append to the received string
    for (var i = 0; i < data.length; i++) {
        // convert to byte
        var char = String.fromCharCode(data[i]);
        this._recv_count++;
        // check if character terminates string
        if (char == '\r') {
            var tmp = this._recv_str;
            // reset the string and counters
            this._recv_str = "";
            this._recv_count = 0;

            // call the handler
            var frame = this._parseFrame(tmp);
	    this.recvFrameCallback(frame);
        } else {
            this._recv_str += char;
        }
    }
}

canbus.slcan.prototype._parseFrame = function(str) {
    var is_ext_id;
    var is_remote;
    var id;
    var dlc;
    var data = []

    // get frame type from first character
    if (str[0] === 't') {
        is_ext_id = false;
        is_remote = false;
    } else if (str[0] === 'r') {
        is_ext_id = false;
        is_remote = true;
    } else if (str[0] === 'T') {
        is_ext_id = true;
        is_remote = false;
    } else if (str[0] === 'R') {
        is_ext_id = true;
        is_remote = true;
    } else {
        throw "Invalid slcand frame! (bad frame type char)";
    }

    // slice the correct number of bits depending on id length
    id = (is_ext_id ? str.substr(1, canbus.slcan.EXT_ID_LEN) :
          str.substr(1, canbus.slcan.STD_ID_LEN));
    // convert from hex string to number
    console.log(id);
    id = Number("0x" + id);
    if (isNaN(id)) {
        throw "Invalid ID value";
    }


    // data length code is single digit after id
    dlc = (is_ext_id ? str.substr(1 + canbus.slcan.EXT_ID_LEN, 1) :
           str.substr(1 + canbus.slcan.STD_ID_LEN, 1));
    dlc = Number(dlc);
    console.log(dlc);
    // check dlc is valid
    if (isNaN(dlc) || dlc < 0 || dlc > 8) {
        throw "Invalid DLC value"
    }

    for (var i = 0; i < dlc; i++) {
        // compute the position of the first char of the byte to read
        var pos = (is_ext_id ? (2 + canbus.slcan.EXT_ID_LEN + i * 2) :
                   (2 + canbus.slcan.STD_ID_LEN + i * 2));
        var b = Number("0x" + str.substr(pos, 2));
        if (isNaN(b)) {
            throw "Invalid data byte at position " + i;
        }
	data.push(b);
    }

    var res = new canbus.frame(id)
    res.id_ext_id = is_ext_id;
    res.is_remote = is_remote;
    res.dlc = dlc;
    res.data = data;

    return res;
}
