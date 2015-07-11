/**
 * @file isotp.js
 * @namespace canbusjs
 * Module for encoding and decoding ISOTP format messages
 */

"use strict";

/**
 * @module isotp
 */

/**
 * Defines an ISOTP interface
 * @class canbus.isotp
 * @constructor
 * @param {Function} sendFrameCallback Function to be called by ISOTP interface
 * when a frame is to be sent. Takes a frame to send as an argument.
 * @param {Function} receivedPayloadCallback Function to be called by ISOTP
 * interface when a full payload is received. Takes payload data as an argument.
 */
canbus.isotp = function(sendFrameCallback, receivedPayloadCallback) {
    // stores the ID we're transmitting on
    this._tx_id = undefined;
    // stores the data to transmit
    this._tx_data = undefined;
    // stores the index of the next byte to transmit
    this._tx_data_index = undefined;
    // stores the sequence number of the next frame to transmit
    this._tx_seq_number = undefined;
    // stores the block length for transmitting
    this._tx_block_size = 3;
    // stores the seperation time between frames
    this._tx_seperation = undefined;
    // callback function for sending a frame
    this.sendFrameCallback = sendFrameCallback;

    this._rx_data = undefined;
    this._rx_data_index = undefined;
    this._rx_seq_number = undefined;
    this.receivedPayloadCallback = receivedPayloadCallback;
}

/**
 * Returns true if a transmit is currently in progress (data is left to be sent)
 * false otherwise.
 * @method txInProgress
 */
canbus.isotp.prototype.txInProgress = function() {
    return (this._tx_data && (this._tx_data.length - this._tx_data_index) > 0);
}

/**
 * Starts an ISOTP transmission. After calling this, blocks will be sent
 * automatically as Flow Control frames are received
 * @method startTransmission
 * @param {Number} id CAN ID to transmit on
 * @param {Array} data Payload data to transmit
 */
canbus.isotp.prototype.startTransmission = function(id, data) {
    if (data.length < 8) {
        // data fits into single frame, create SF
        var sf = new canbus.frame(id);
        // first byte, upper nybble is frame type (0 for SF)
        // lower nybble is data length
        sf.data.push(data.length);

        // add the payload bytes
        for (var i=0; i < data.length; i++) {
            sf.data.push(data[i]);
        }

        // DLC is data length plus one for the first byte
        sf.dlc = data.length + 1;

        // send this one frame, and we're done
        this.sendFrameCallback(sf);
        return;
    }

    // frame is too long for single frame
    this._tx_id = id;
    // create a first frame
    var ff = new canbus.frame(this._tx_id);

    // set up a counter to keep track of where we are in the payload
    this._tx_data_index = 0;

    // first byte, upper nybble is frame type (1 for SF)
    ff.data[0] = 1 << 4;
    // first byte, lower nybble is upper nybble of the length
    ff.data[0] += data.length >> 8;

    // second byte is lower byte of the length
    ff.data[1] =  data.length & 0xFF;

    // the rest of this frame (6 bytes) is data
    while (this._tx_data_index < 6) {
        ff.data[2+this._tx_data_index] = data[this._tx_data_index];
        this._tx_data_index++;
    }

    // set the data length code to the data length
    ff.dlc = ff.data.length;

    this._tx_seq_number = 1;
    this._tx_data = data;

    // push this frame to the frame array
    this.sendFrameCallback(ff);
}

canbus.isotp.prototype._sendBlock = function() {

    if (!this.txInProgress()) {
        throw "no data to transmit";
    }

    for (var block=0; block < this._tx_block_size; block++) {
        var data_remaining = this._tx_data.length - this._tx_data_index;

        if (data_remaining <= 0) {
            // no more data, we're done
            break;
        }

        // create a consecutive frame
        var cf = new canbus.frame(this._tx_id);
        // first byte, upper nybble is frame type (2 for CF)
        cf.data[0] = 2 << 4;
        // first byte, lower nybble is sequence number
        cf.data[0] += this._tx_seq_number;

        // remainder is data
        for (var i=0; i < Math.min(data_remaining, 7); i++) {
            cf.data.push(this._tx_data[this._tx_data_index])
            this._tx_data_index++;
        }

        // set the data length code to the data length
        cf.dlc = cf.data.length;

        // increment and wrap the sequence number
        this._tx_seq_number++;
	this._tx_seq_number %= 0x10;

	setTimeout(this.sendFrameCallback,
		   this._tx_seperation*block, cf);
    }
}

/**
 * Parses a single frame as ISOTP data.
 * @method parseFrame
 * @param {canbus.frame} frame Frame to parse
 */
canbus.isotp.prototype.parseFrame = function(frame) {
    // get the frame type, upper nybble of first byte
    var frame_type = frame.data[0] >> 4;

    if (frame_type == 0) {
        // single frame, first byte's lower nybble is data length
	var result = [];
        var length = frame.data[0] & 0x0F;

        for (var i=0; i < length; i++) {
            result.push(frame.data[i+1]);
        }

	// all data received, call the callback
	this.receivedPayloadCallback(result);
    }

    if (frame_type == 1) {
        // first frame, first byte's lower nubble is upper nybble of data length
        var length = (frame.data[0] & 0x0F) << 8;
        // second byte is lower byte of data length
        length += frame.data[1];

	// set up the receive data array
	this._rx_data = Array(length);
	this._rx_data_index = 0;

        // rest of the frame (6 bytes) is data
        for (var i=0; i < 6; i++) {
            this._rx_data[this._rx_data_index] = frame.data[i+2]
	    this._rx_data_index++;
        }

        // next frame should have sequence number 1
        this._rx_seq_number = 1;

	// send a flow control frame
	var fc = new canbus.frame(this._tx_id);
	// first byte, upper nybble is type (3 for FC) 
	fc.data[0] = 3 << 4;
	// first byte, lower nybble is flag, 0 for clear to send

	// second byte is block size, 0 for now...
	// TODO: fix it.
	fc.data[1] = 0;

	// third byte is seperation time, set to 10 milliseconds 
	fc.data[2] = 10;

	fc.dlc = 3;
	this.sendFrameCallback(fc);
    }

    if (frame_type == 2) {
        // consecutive frame, lower nybble of first byte is sequence number
        var recv_seq_number = frame.data[0] & 0x0F;
        if (recv_seq_number != this._rx_seq_number) {
            throw "invalid sequence number received!";
        }

        // rest of frame is data
        for (var i=0; i < frame.data.length - 1; i++) {
	    this._rx_data[this._rx_data_index] = frame.data[i+1]
	    this._rx_data_index++;
        }

        // increment and wrap the sequence number
        this._rx_seq_number++;
        this._rx_seq_number %= 0x10;

        if (this._rx_data_index >= this._rx_data.length) {
	    this.receivedPayloadCallback(this._rx_data);
	    // TODO cleanup object
	}
    }

    if (frame_type == 3) {
	// flow control frame

	// second byte is block size
	// block size of zero indicates that all frames should be sent
	if (frame.data[1] == 0) {
	    // set the block size to be the number of frames
	    // TODO: real size
	    this._tx_block_size = 10000;
	} else {
	    // set the block size to the given value
	    this._tx_block_size = frame.data[1];
	}

	// third byte is seperation time
	// TODO: ms and us implementation
	this._tx_seperation = frame.data[2];

	// once a FC frame is received, we should send a block
	this._sendBlock();
	
	// TODO: rest of this...
    }
}
