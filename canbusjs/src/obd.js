/**
 * @file obd.js
 * @namespace canbusjs
 * Module for sending OBD requests and parsing responses
 */

"use strict";

/**
 * @module obd
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

/** Standard OBD-II modes
 * @property OBD_II_MODES
 * @type Object
 * @final
 */
canbus.obd.OBD_II_MODES = {
    1: "Show Current Data",
    2: "Show Freeze Frame Data",
    3: "Show Stored DTCs",
    4: "Clear DTCs",
    7: "Show Pending DTCs",
    9: "Request Vehicle Information"
}
/** Standard OBD-II PIDs
 * @property OBD_II_PIDS
 * @type Object
 * @final
 */
canbus.obd.OBD_II_PIDS = {
    0x00: "PIDs Supported",
    0x01: "Monitor status since DTCs cleared",
    0x02: "Freeze DTC",
    0x03: "Fuel system status",
    0x04: "Calculated engine load value",
    0x05: "Engine coolant temperature",
    0x06: "Short term fuel % trim—Bank 1",
    0x07: "Long term fuel % trim—Bank 1",
    0x08: "Short term fuel % trim—Bank 2",
    0x09: "Long term fuel % trim—Bank 2",
    0x0A: "Fuel pressure",
    0x0B: "Intake manifold absolute pressure",
    0x0C: "Engine RPM",
    0x0D: "Vehicle speed",
    0x0E: "Timing advance",
    0x0F: "Intake air temperature",
    0x10: "MAF air flow rate",
    0x11: "Throttle position",
    0x12: "Commanded secondary air status",
    0x13: "Oxygen sensors present",
    0x14: "Bank 1, Sensor 1: Oxygen sensor voltage, Short term fuel trim",
    0x15: "Bank 1, Sensor 2: Oxygen sensor voltage, Short term fuel trim",
    0x16: "Bank 1, Sensor 3: Oxygen sensor voltage, Short term fuel trim",
    0x17: "Bank 1, Sensor 4: Oxygen sensor voltage, Short term fuel trim",
    0x18: "Bank 2, Sensor 1: Oxygen sensor voltage, Short term fuel trim",
    0x19: "Bank 2, Sensor 2: Oxygen sensor voltage, Short term fuel trim",
    0x1A: "Bank 2, Sensor 3: Oxygen sensor voltage, Short term fuel trim",
    0x1B: "Bank 2, Sensor 4: Oxygen sensor voltage, Short term fuel trim",
    0x1C "OBD standards this vehicle conforms to",
    0x1D: "Oxygen sensors present",
    0x1E: "Auxiliary input status",
    0x1F: "Run time since engine start",
    0x20: "PIDs supported [21 - 40]",
    0x21: "Distance traveled with malfunction indicator lamp (MIL) on",
    0x22: "Fuel Rail Pressure (relative to manifold vacuum)",
    0x23: "Fuel Rail Pressure (diesel, or gasoline direct inject)",
    0x24: "O2S1_WR_lambda(1): Equivalence Ratio Voltage",
    0x25: "O2S2_WR_lambda(1): Equivalence Ratio Voltage",
    0x26: "O2S3_WR_lambda(1): Equivalence Ratio Voltage",
    0x27: "O2S4_WR_lambda(1): Equivalence Ratio Voltage",
    0x28: "O2S5_WR_lambda(1): Equivalence Ratio Voltage",
    0x29: "O2S6_WR_lambda(1): Equivalence Ratio Voltage",
    0x2A: "O2S7_WR_lambda(1): Equivalence Ratio Voltage",
    0x2B: "O2S8_WR_lambda(1): Equivalence Ratio Voltage",
    0x2C: "Commanded EGR",
    0x2D: "EGR Error",
    0x2E: "Commanded evaporative purge",
    0x2F: "Fuel Level Input",
    0x30: "# of warm-ups since codes cleared",
    0x31: "Distance traveled since codes cleared",
    0x32: "Evap. System Vapor Pressure",
    0x33: "Barometric pressure",
    0x34: "O2S1_WR_lambda(1): Equivalence Ratio Current",
    0x35: "O2S2_WR_lambda(1): Equivalence Ratio Current",
    0x36: "O2S3_WR_lambda(1): Equivalence Ratio Current",
    0x37: "O2S4_WR_lambda(1): Equivalence Ratio Current",
    0x38: "O2S5_WR_lambda(1): Equivalence Ratio Current",
    0x39: "O2S6_WR_lambda(1): Equivalence Ratio Current",
    0x3A: "O2S7_WR_lambda(1): Equivalence Ratio Current",
    0x3B: "O2S8_WR_lambda(1): Equivalence Ratio Current",
    0x3C: "Catalyst Temperature Bank 1, Sensor 1",
    0x3D: "Catalyst Temperature Bank 2, Sensor 1",
    0x3E: "Catalyst Temperature Bank 1, Sensor 2",
    0x3F: "Catalyst Temperature Bank 2, Sensor 2",
    0x40: "PIDs supported [41 - 60]",
    0x41: "Monitor status this drive cycle",
    0x42: "Control module voltage",
    0x43: "Absolute load value",
    0x44: "Fuel/Air commanded equivalence ratio",
    0x45: "Relative throttle position",
    0x46: "Ambient air temperature",
    0x47: "Absolute throttle position B",
    0x48: "Absolute throttle position C",
    0x49: "Accelerator pedal position D",
    0x4A: "Accelerator pedal position E",
    0x4B: "Accelerator pedal position F",
    0x4C: "Commanded throttle actuator",
    0x4D: "Time run with MIL on",
    0x4E: "Time since trouble codes cleared",
    0x4F: "Maximum value for equivalence ratio, oxygen sensor voltage, oxygen sensor current, and intake manifold absolute pressure",
    0x50: "Maximum value for air flow rate from mass air flow sensor",
    0x51: "Fuel Type",
    0x52: "Ethanol fuel %",
    0x53: "Absolute Evap system Vapor Pressure",
    0x54: "Evap system vapor pressure",
    0x55: "Short term secondary oxygen sensor trim bank 1 and bank 3",
    0x56: "Long term secondary oxygen sensor trim bank 1 and bank 3",
    0x57: "Short term secondary oxygen sensor trim bank 2 and bank 4",
    0x58: "Long term secondary oxygen sensor trim bank 2 and bank 4",
    0x59: "Fuel rail pressure (absolute)",
    0x5A: "Relative accelerator pedal position",
    0x5B: "Hybrid battery pack remaining life",
    0x5C: "Engine oil temperature",
    0x5D: "Fuel injection timing",
    0x5E: "Engine fuel rate",
    0x5F: "Emission requirements to which vehicle is designed",
    0x60: "PIDs supported [61 - 80]",
    0x61: "Driver's demand engine - percent torque",
    0x62: "Actual engine - percent torque",
    0x63: "Engine reference torque",
    0x64: "Engine percent torque data",
    0x65: "Auxiliary input / output supported",
    0x66: "Mass air flow sensor",
    0x67: "Engine coolant temperature",
    0x68: "Intake air temperature sensor",
    0x69: "Commanded EGR and EGR Error",
    0x6A: "Commanded Diesel intake air flow control and relative intake air flow position",
    0x6B: "Exhaust gas recirculation temperature",
    0x6C: "Commanded throttle actuator control and relative throttle position",
    0x6D: "Fuel pressure control system",
    0x6E: "Injection pressure control system",
    0x6F: "Turbocharger compressor inlet pressure",
    0x70: "Boost pressure control",
    0x71: "Variable Geometry turbo (VGT) control",
    0x72: "Wastegate control",
    0x73: "Exhaust pressure",
    0x74: "Turbocharger RPM",
    0x75: "Turbocharger temperature",
    0x76: "Turbocharger temperature",
    0x77: "Charge air cooler temperature (CACT)",
    0x78: "Exhaust Gas temperature (EGT) Bank 1",
    0x79: "Exhaust Gas temperature (EGT) Bank 2",
    0x7A: "Diesel particulate filter (DPF)",
    0x7B: "Diesel particulate filter (DPF)",
    0x7C: "Diesel Particulate filter (DPF) temperature",
    0x7D: "NOx NTE control area status",
    0x7E: "PM NTE control area status",
    0x7F: "Engine run time",
    0x80: "PIDs supported [81 - A0]",
    0x81: "Engine run time for Auxiliary Emissions Control Device(AECD)",
    0x82: "Engine run time for Auxiliary Emissions Control Device(AECD)",
    0x83: "NOx sensor",
    0x84: "Manifold surface temperature",
    0x85: "NOx reagent system",
    0x86: "Particulate matter (PM) sensor",
    0x87: "Intake manifold absolute pressure",
    0xA0: "PIDs supported [A1 - C0]",
    0xC0: "PIDs supported [C1 - E0]",
}


/**
 * Sends a request for OBD-II data. If successful, the receivedPayloadCallback
 * will be called with the result.
 * @method sendRequest
 * @param {Number} controllerId CAN ID to use for adressing the controller
 * @param {Number} pid OBD-II PID to request
 */
canbus.obd.prototype.sendRequest = function(controllerId, mode, pid) {
    // set the request data to the mode and PID as two bytes
    var data = [mode, pid];

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
