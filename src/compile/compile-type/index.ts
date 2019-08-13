import { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
import {
  CELAccessor,
  CELCondition,
  CELExpression,
  CELExpressionOperand,
  CELLiteral,
  CELOperators
} from '../cel';

import compileArray from './compile-array';
import compileBoolean from './compile-boolean';
import compileNull from './compile-null';
import compileNumeric from './compile-numeric';
import compileObject from './compile-object';
import compileString from './compile-string';

const compilers = [
  compileBoolean,
  compileNull,
  compileNumeric,
  compileString,
  compileArray,
  compileObject
];

export default function(
  accessor: CELAccessor,
  definition: JSONSchema7,
  isRequired: boolean
): CELExpressionOperand {
  const expression = new CELExpression([], CELOperators.OR);
  const types = Array.isArray(definition.type)
    ? definition.type
    : ([definition.type] as JSONSchema7TypeName[]);

  for (const typeName of types) {
    for (const compiler of compilers) {
      const celOrNull = compiler(accessor, typeName, definition);
      if (celOrNull) expression.operands.push(celOrNull);
    }
  }

  if (isRequired) return expression;

  return new CELCondition(accessor, expression, new CELLiteral(true));
}