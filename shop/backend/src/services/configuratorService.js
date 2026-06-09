const Product = require('../models/Product');
const compatibilityRules = require('../compatibility');

class ConfiguratorService {
  /**
   * Returns all products in the given category that are compatible
   * with the current build components.
   */
  async getCompatibleParts(category, currentBuildIds) {
    const currentComponents = await Product.find({ _id: { $in: currentBuildIds } });

    // Map configurator categories to database productType (case-insensitive & mapped)
    const mapCategoryToProductTypes = (cat) => {
      const normalized = (cat || '').toLowerCase().trim();
      const map = {
        cpu: ['CPU'],
        motherboard: ['Motherboard'],
        ram: ['RAM'],
        gpu: ['GPU'],
        storage: ['SSD'],
        case: ['Case'],
        psu: ['PSU'],
        cooling: ['Cooler']
      };
      return map[normalized] || [cat];
    };

    const types = mapCategoryToProductTypes(category);
    const typeQueries = [];
    types.forEach(t => {
      typeQueries.push(t, t.toLowerCase(), t.toUpperCase());
    });

    const allCategoryProducts = await Product.find({
      productType: { $in: [...new Set(typeQueries)] },
      status: 'Published',
      'computed.inStock': true
    });

    return allCategoryProducts.filter(product => {
      return this.checkCompatibility(product, currentComponents).isValid;
    });
  }

  /**
   * Checks a single new component against all existing build components
   * using the modular compatibility rule engine.
   */
  checkCompatibility(newComponent, currentComponents) {
    const errors = [];

    for (const rule of compatibilityRules) {
      const [typeA, typeB] = rule.components;
      const newType = (newComponent.productType || '').toUpperCase();

      // Check if the new component is typeA and we have typeB in the build
      if (newType === typeA) {
        const counterpart = currentComponents.find(c => (c.productType || '').toUpperCase() === typeB);
        if (counterpart) {
          const result = rule.check(newComponent, counterpart);
          if (!result.compatible) {
            errors.push(result.reason);
          }
        }
      }

      // Check the reverse direction
      if (newType === typeB) {
        const counterpart = currentComponents.find(c => (c.productType || '').toUpperCase() === typeA);
        if (counterpart) {
          const result = rule.check(counterpart, newComponent);
          if (!result.compatible) {
            errors.push(result.reason);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates a complete build by checking all components against each other
   * and calculating total power draw.
   */
  async validateBuild(buildIds) {
    const components = await Product.find({ _id: { $in: buildIds } });
    const errors = [];
    const warnings = [];
    let totalTdp = 0;

    // Check every component against all previously checked components
    components.forEach((component, index) => {
      const tdp = component.specifications?.tdp;
      if (tdp && typeof tdp === 'number') {
        totalTdp += tdp;
      }

      const previousComponents = components.slice(0, index);
      const result = this.checkCompatibility(component, previousComponents);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    });

    // PSU wattage warning
    const psu = components.find(c => (c.productType || '').toUpperCase() === 'PSU');
    if (psu) {
      const psuWattage = psu.specifications?.wattage || 0;
      const recommendedWattage = totalTdp + 150;
      if (psuWattage < recommendedWattage) {
        warnings.push(
          `PSU wattage (${psuWattage}W) may be insufficient. ` +
          `Estimated draw: ${totalTdp}W. Recommended: ${recommendedWattage}W+`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalPowerDraw: totalTdp
    };
  }
}

module.exports = new ConfiguratorService();
