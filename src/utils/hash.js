// @ironwallaby's string-hash
// https://github.com/darkskyapp/string-hash
const hash = (str) => {
  let hash = 5381;

  let i = str.length;
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return hash >>> 0;
};

export default hash;
