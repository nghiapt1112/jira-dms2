const { memberConfiguration } = require('../../constants/memberConfiguration')

class StoryPointCalculator {
  static getDefaultStatusFilter() {
    return memberConfiguration.filterDefaults.statusFilter
  }
}

module.exports = StoryPointCalculator 