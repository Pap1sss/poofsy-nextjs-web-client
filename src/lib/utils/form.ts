import { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiValidationError } from "./request";

/**
 * Puts a Laravel 422's field messages on the matching form fields, and anything
 * else (or a non-validation error) on `root`. Returns nothing; use as a mutation's onError.
 */
export const applyApiErrors = <T extends FieldValues>(
  error: Error,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[]
) => {
  if (!(error instanceof ApiValidationError)) {
    setError("root", { message: error.message });
    return;
  }

  let unmatched = false;

  for (const [field, messages] of Object.entries(error.errors)) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { message: messages[0] });
    } else {
      unmatched = true;
    }
  }

  if (unmatched) setError("root", { message: error.message });
};

export const toDecimal = (v: string) =>
  (v
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .match(/^\d*\.?\d{0,2}/) ?? [""])[0];

export const toSignedDecimal = (v: string) => {
  const neg = v.startsWith("-");
  const abs = (v
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .match(/^\d*\.?\d{0,2}/) ?? [""])[0];
  return neg && abs === "" ? "-" : (neg ? "-" : "") + abs;
};

export const toInteger = (v: string) => v.replace(/[^0-9]/g, "");

/**
 * Extracts only the dirty (modified) fields from form data
 *
 * @param allFields - The complete form data
 * @param dirtyFields - The dirtyFields object from formState
 * @returns An object containing only the fields that were modified
 *
 * @example
 * const dirtyData = getDirtyFields(data, form.formState.dirtyFields);
 * mutate(dirtyData); // Only sends modified fields to API
 */
export const getDirtyFields = <T extends FieldValues>(
  allFields: T,
  dirtyFields: Partial<Record<keyof T, boolean | boolean[]>>
): Partial<T> => {
  const changedFieldValues = Object.keys(dirtyFields).reduce((acc, currentField) => {
    const isDirty = Array.isArray(dirtyFields[currentField])
      ? (dirtyFields[currentField] as boolean[]).some((value) => value === true)
      : dirtyFields[currentField] === true;
    if (isDirty) {
      return {
        ...acc,
        [currentField]: allFields[currentField],
      };
    }
    return acc;
  }, {} as Partial<T>);

  return changedFieldValues;
};

type DirtyFieldsValue = boolean | boolean[] | { [key: string]: DirtyFieldsValue };
type NestedDirtyFields<T> = {
  [K in keyof T]?: NonNullable<T[K]> extends unknown[]
    ? boolean | boolean[]
    : NonNullable<T[K]> extends object
      ? NestedDirtyFields<NonNullable<T[K]>> | boolean
      : boolean | boolean[];
};

/**
 * Extracts only the dirty (modified) fields from form data with nested object support
 *
 * @param allFields - The complete form data
 * @param dirtyFields - The dirtyFields object from formState
 * @returns An object containing only the fields that were modified
 *
 * @example
 * const dirtyData = getNestedDirtyFields(data, form.formState.dirtyFields);
 * mutate(dirtyData); // Only sends modified fields to API
 */
export const getNestedDirtyFields = <T extends FieldValues>(
  allFields: T,
  dirtyFields: NestedDirtyFields<T>
): Partial<T> => {
  const changedFieldValues = Object.keys(dirtyFields).reduce((acc, currentField) => {
    const dirtyValue = dirtyFields[currentField as keyof T] as DirtyFieldsValue | undefined;

    if (dirtyValue === undefined) return acc;

    // Handle boolean (simple field is dirty)
    if (dirtyValue === true) {
      return {
        ...acc,
        [currentField]: allFields[currentField],
      };
    }

    // Handle boolean array (array field)
    if (Array.isArray(dirtyValue)) {
      const isDirty = dirtyValue.some((value) => value === true);
      if (isDirty) {
        return {
          ...acc,
          [currentField]: allFields[currentField],
        };
      }
      return acc;
    }

    // Handle nested object
    if (typeof dirtyValue === "object" && dirtyValue !== null) {
      const nestedDirty = getNestedDirtyFields(
        allFields[currentField] as FieldValues,
        dirtyValue as NestedDirtyFields<FieldValues>
      );
      if (Object.keys(nestedDirty).length > 0) {
        return {
          ...acc,
          [currentField]: nestedDirty,
        };
      }
    }

    return acc;
  }, {} as Partial<T>);

  return changedFieldValues;
};
