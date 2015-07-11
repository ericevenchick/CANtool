/**
 * @file obd.js
 * @namespace canbusjs
 * Module for sending OBD requests and parsing responses
 */

"use strict";

/**
 * @module canbus.obd
 */

/**
 * Implementation of the OBD-II protocol over CAN
 * @class canbus.obd
 * @constructor
 * @param {Function} sendFrameCallback Function to be called by OBD protocol
 * when a frame is to be sent. Takes a frame to send as an argument.
 * @param {Function} receivedPayloadCallback Function to be called by OBD
 * protocol when a full payload is received. Takes payload data as an argument.
 */
canbus.obd = function(sendFrameCallback, receivedPayloadCallback) {
    this._isotp = new canbus.isotp(sendFrameCallback, this._recvDataCallback);
    this.receivedPayloadCallback = receivedPayloadCallback
}

/**
 * Sends a request for OBD-II data. If successful, the receivedPayloadCallback
 * will be called with the result.
 * @method sendRequest
 * @param {Number} controllerId CAN ID to use for adressing the controller
 * @param {Number} pid OBD-II PID to request
 */
canbus.obd.prototype.sendRequest = function(controllerId, pid) {
    // set the request data to the PID as a single byte
    // TODO: idk if this is right
    var data = [pid];

    // start the transmission
    this._isotp.startTransmission(controllerId, data);
}

/**
 * Parses a single frame as OBD data.
 * @method parseFrame
 * @param {canbus.frame} frame Frame to parse
 */
canbus.obd.prototype.parseFrame = function(frame) {
    this._isotp.parseFrame(frame);
}

canbus.obd.prototype._recvDataCallback = function(data) {
    console.log('Got OBD-II Data: ' + data);
    // TODO: parse OBD data
}

