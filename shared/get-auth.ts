/** @format */

/** @format */

import { APIError } from "encore.dev/api";
import { getAuthData } from "encore.dev/internal/codegen/auth";

import { Result } from "../shared/types";

export const getAuth = <T>(): Result<T, APIError> => {
 const authdata = getAuthData<T>();
 if (!authdata) {
  return [null, APIError.unauthenticated("Authentication required")];
 }
 return [authdata, null];
};
