import {
  JSONSchema7,
  JSONSchema7Type,
  JSONSchema7Array,
} from 'json-schema';

import cel from '../cel';

function createEnumValueGuard(schema: JSONSchema7Type, ref: string): string {
  if (typeof schema === 'object' && schema !== null) {
    return Object.keys(schema).reduce((guard: string, key: string) => {
      const value = Array.isArray(schema) ? schema[parseInt(key, 10)] : (schema as any)[key];
      const valueRef = cel.ref(ref, Array.isArray(schema) ? parseInt(key, 10) : key);
      const valueGuard = typeof value === 'object'
        ? createEnumValueGuard(value, valueRef)
        : cel.calc(valueRef, '==', cel.val(value));

      return cel.calc(guard, '&&', valueGuard);
    }, '');
  }

  return cel.calc(ref, '==', cel.val(schema));
}

function createEnumGuard(declaration: JSONSchema7Type[], ref: string): string {
  return declaration.reduce((guard: string, value: JSONSchema7Type) => {
    return cel.calc(guard, '||', createEnumValueGuard(value, ref));
  }, '');
}

export default function(schema: JSONSchema7, ref: string, strictRef: string) {
  let guard = '';

  if (schema.const) guard = createEnumGuard([schema.const], ref);
  if (schema.enum) guard = cel.calc(guard, '&&', createEnumGuard(schema.enum, ref));

  return guard;
}
