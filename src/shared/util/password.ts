/** @format */

import Env from "@/env.ts";
import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
 return bcrypt.hash(password, Env.SALT);
};

export const comparePassword = async (password: string, hashPassword: string) =>
 bcrypt.compare(password, hashPassword);
