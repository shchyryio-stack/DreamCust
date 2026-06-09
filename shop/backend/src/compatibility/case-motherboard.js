/**
 * Case ↔ Motherboard compatibility rule.
 * Checks that the case supportedMotherboards array includes the motherboard formFactor.
 */
module.exports = {
  components: ['CASE', 'MOTHERBOARD'],
  check(pcCase, motherboard) {
    if (!pcCase.specifications.supportedMotherboards.includes(motherboard.specifications.formFactor)) {
      return { compatible: false, reason: `Case does not support motherboard form factor ${motherboard.specifications.formFactor}. Supported: ${pcCase.specifications.supportedMotherboards.join(', ')}` };
    }
    return { compatible: true };
  }
};
