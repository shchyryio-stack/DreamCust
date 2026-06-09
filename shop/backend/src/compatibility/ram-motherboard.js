/**
 * RAM ↔ Motherboard compatibility rule.
 * Checks memory type match between RAM and Motherboard.
 */
module.exports = {
  components: ['RAM', 'MOTHERBOARD'],
  check(ram, motherboard) {
    if (ram.specifications.generation !== motherboard.specifications.memoryType) {
      return { compatible: false, reason: `RAM type ${ram.specifications.generation} does not match motherboard memory type ${motherboard.specifications.memoryType}` };
    }
    return { compatible: true };
  }
};
