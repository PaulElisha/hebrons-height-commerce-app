/** @format */

// /** @format */

// import { api } from "encore.dev/api";
// import { eq } from "drizzle-orm";

// import { db } from "../../module/auth/db";
// import { account } from "../../schema/auth.ts";
// import { getAuth } from "../../shared/get-auth.ts";
// import { AuthData, Response } from "../../shared/types.ts";

// export const updateUserAccount = api(
//  {
//   expose: true,
//   auth: true,
//   path: "/api/user",
//   method: "PUT",
//  },
//  async () => {
//   const [authdata, error] = getAuth<AuthData>();

//   const [userAccount] = await db
//    .select()
//    .from(account)
//    .where(eq(account.userId, authdata?.userID as string))
//    .limit(1);
//  },
// );
