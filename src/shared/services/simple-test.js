const { memberConfiguration } = require('../../constants/memberConfiguration')

class SimpleCalculator {
  static test() {
    return 'test'
  }
  
  static getDefaultStatusFilter() {
    return memberConfiguration.filterDefaults.statusFilter
  }
}

module.exports = SimpleCalculator 