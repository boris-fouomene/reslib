/** Symbol markers for identifying rule decorators (survives minification) */

export const VALIDATOR_RULE_MARKERS = {
  nested: Symbol.for('validatorNestedRuleMarker'),
  oneOf: Symbol.for('validatorOneOfRuleMarker'),
  allOf: Symbol.for('validatorAllOfRuleMarker'),
  arrayOf: Symbol.for('validatorArrayOfRuleMarker'),
  optional: Symbol.for('validatorOptionalRuleMarker'),
  empty: Symbol.for('validatorEmptyRuleMarker'),
  nullable: Symbol.for('validatorNullableRuleMarker'),
  ruleName: Symbol.for('validatorRuleNameMarker'),
};
