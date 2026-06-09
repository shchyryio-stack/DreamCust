/**
 * CPU ↔ Motherboard compatibility rule.
 * Checks socket match between CPU and Motherboard.
 */
module.exports = {
  components: ['CPU', 'MOTHERBOARD'],
  check(cpu, motherboard) {
    if (cpu.specifications.socket !== motherboard.specifications.socket) {
      return { compatible: false, reason: `CPU socket ${cpu.specifications.socket} does not match motherboard socket ${motherboard.specifications.socket}` };
    }
    return { compatible: true };
  }
};
