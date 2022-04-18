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