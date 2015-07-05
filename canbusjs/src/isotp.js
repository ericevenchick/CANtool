/**
 * @file canbus.js
 * @namespace canbusjs
 * Module for encoding and decoding ISOTP format messages
 */

"use strict";

/**
 * @class canbus.isotp
 */

canbus.isotp = function() {
    this._tx_data = null;
}

canbus.isotp.prototype.encodeISOTP = function(id, data, length) {
    var frames = [];
    if (length < 8) {
        // data fits into single frame, create SF
        var sf = new canbus.frame(id);
        // first byte, upper nybble is frame type (0 for SF)
        // lower nybble is data length
        sf.data.push(length);

        // add the payload bytes
        for (var i=0; i < length; i++) {
            sf.data.push(data[i]);
        }

        // DLC is data length plus one for the first byte
        sf.dlc = length + 1;

        // push this one frame to the array and return
        frames.push(sf);
        return frames;
    }

    // frame is too long for single frame
    // create a first frame
    var ff = new canbus.frame(id);

    // set up a counter to keep track of where we are in the payload
    var data_index = 0;

    // first byte, upper nybble is frame type (1 for SF)
    ff.data[0] = 1 << 4;
    // first byte, lower nybble is upper nybble of the length
    ff.data[0] += length >> 8;

    // second byte is lower byte of the length
    ff.data[1] =  length & 0xFF;

    // the rest of this frame (6 bytes) is data
    while (data_index < 6) {
        ff.data[2+data_index] = data[data_index];
        data_index++;
    }

    // set the data length code to the data length
    ff.dlc = ff.data.length;

    // push this frame to the frame array
    frames.push(ff);

    var data_remaining = length - data_index;
    var seq_number = 1;
    while (data_remaining > 0) {
        // create a consecutive frame
        var cf = new canbus.frame(id)
        // first byte, upper nybble is frame type (2 for CF)
        cf.data[0] = 2 << 4;
        // first byte, lower nybble is sequence number
        cf.data[0] += seq_number;

        // remainder is data
        for (var i=0; i < Math.min(data_remaining, 7); i++) {
            cf.data.push(data[data_index])
            data_index++;
        }

        // set the data length code to the data length
        cf.dlc = cf.data.length;

        // caluclate the number of bytes left to send
        data_remaining = length - data_index;
        // increment the sequence number
        seq_number++;

        frames.push(cf);
    }

    return frames;
}


canbus.isotp.prototype.decodeISOTP = function(frames) {
    var data = [];
    var length = 0;
    var seq_number = 0;

    for (var frame_index in frames) {
        var frame = frames[frame_index];
        // get the frame type, upper nybble of first byte
        var frame_type = frame.data[0] >> 4;

        if (frame_type == 0) {
            // single frame, first byte's lower nybble is data length
            length = frame.data[0] & 0x0F;
            for (var i=0; i < length; i++) {
                data.push(frame.data[i+1]);
            }
            return data;
        }

	if (frame_type == 1) {
	    // first frame, first byte's lower nubble is upper nybble of data
	    // length
	    length = (frame.data[0] & 0x0F) << 8;
	    // second byte is lower byte of data length
	    length += frame.data[1];

	    // rest of the frame (6 bytes) is data
	    for (var i=0; i < 6; i++) {
		data.push(frame.data[i+2])
	    }

	    // next frame should have sequence number 1
	    seq_number = 1;
	}

	if (frame_type == 2) {
	    // consecutive frame, lower nybble of first byte is sequence number
	    var recv_seq_number = frame.data[0] & 0x0F;
	    if (recv_seq_number != seq_number) {
		throw "invalid sequence number received!";
	    }

	    // rest of frame is data
	    for (var i=0; i < frame.data.length - 1; i++) {
		data.push(frame.data[i+1]);
	    }

	    // increment and wrap the sequence number
	    seq_number++;
	    seq_number = seq_number % 0x10;
	}
    }
    return data;
}
