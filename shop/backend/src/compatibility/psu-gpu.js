/**
 * PSU ↔ GPU compatibility rule.
 * Checks that PSU wattage is sufficient for GPU TDP (with 150W headroom).
 */
module.exports = {
  components: ['PSU', 'GPU'],
  check(psu, gpu) {
    const requiredWattage = gpu.specifications.tdp + 150;
    if (psu.specifications.wattage < requiredWattage) {
      return { compatible: false, reason: `PSU wattage ${psu.specifications.wattage}W is insufficient for GPU TDP ${gpu.specifications.tdp}W (requires at least ${requiredWattage}W with 150W headroom)` };
    }
    return { compatible: true };
  }
};
