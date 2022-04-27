import { e8sInOneICP } from "./Constants";

export const toHexString = (byteArray)  =>{
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
};

export const fromHexString = (hex) => {
    if (hex.substr(0,2) === "0x") hex = hex.substr(2);
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
};

export const toE8s = (number) => {
  return number * e8sInOneICP
}

export const fromE8s = (number) => {
  return number / e8sInOneICP
}

export const shortenHexString = (hexString) => {
  const shortString = `${hexString.slice(0,9)} ... ${hexString.slice(-10)}`
  return shortString
}

export const milisecondsToNanoSeconds = (time) => {
  return time * 1000000;
}

export const nanoSecondsToMiliSeconds = (time) => {
  return Math.floor(time / 1000000);
}