import * as HID from "node-hid";

// console.log("devices:", HID.devices());

function decrypt(key: number[], data: number[]) {
  const cstate = [0x48, 0x74, 0x65, 0x6d, 0x70, 0x39, 0x39, 0x65];
  const shuffle = [2, 4, 0, 7, 1, 6, 5, 3];

  const phase1 = new Array(shuffle.length);
  shuffle.forEach((o, i) => {
    phase1[o] = data[i];
  });

  const phase2 = new Array(shuffle.length);
  shuffle.forEach((o, i) => {
    phase2[i] = phase1[i] ^ key[i];
  });

  const phase3 = new Array(shuffle.length);
  shuffle.forEach((o, i) => {
    phase3[i] = ((phase2[i] >> 3) | (phase2[(i - 1 + 8) % 8] << 5)) & 0xff;
  });

  const ctmp = new Array(shuffle.length);
  shuffle.forEach((o, i) => {
    ctmp[i] = ((cstate[i] >> 4) | (cstate[i] << 4)) & 0xff;
  });

  const out = new Array(shuffle.length);
  shuffle.forEach((o, i) => {
    out[i] = (0x100 + phase3[i] - ctmp[i]) & 0xff;
  });

  return out;
}

const key = [0xc4, 0xc6, 0xc0, 0x92, 0x40, 0x23, 0xdc, 0x96];

const device = new HID.HID(1241, 41042);

device.on("data", function(data) {
  const decrypted = decrypt(key, data);
  // console.info(data, decrypted);
  const op = decrypted[0];
  const value = (decrypted[1] << 8) | decrypted[2];
  if (op === 0x50) {
    console.info(`CO2 = ${value}`);
  } else if (op === 0x42) {
    console.info(`Temp = ${value / 16.0 - 273.15}`);
  } else {
    // console.info(`Unknown op=${op} val=${value}`);
  }
});

device.on("error", function(error) {
  console.info("error", error);
});

//device.read((err, data) => {
//  console.info("Read=", err, data);
//});

console.info("write=", device.sendFeatureReport([0x0300, ...key]));
