// Code from fairlo site to calculate the personal number checksum
function calculateChecksum(str: string) {
    let sum = 0;
    str += "";
    for (let i = 0, l = str.length; i < l; i++) {
      let v = parseInt(str[i]);
      v *= 2 - i % 2;
      if (v > 9) {
        v -= 9;
      }
      sum += v;
    }
    return Math.ceil(sum / 10) * 10 - sum;
};

export { calculateChecksum }