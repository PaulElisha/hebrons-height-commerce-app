/** @format */
import fs from "node:fs/promises";
import path from "node:path";
const templateCache = new Map<string, string>();

const createTemplateTag = (baseDir: string) => {
 return async (strings: TemplateStringsArray, ...values: any[]) => {
  const targetFile = strings[0].trim();
  const cacheKey = path.join(baseDir, targetFile);

  let template = templateCache.get(cacheKey);
  if (!template) {
   const templatePath = path.join(process.cwd(), cacheKey);
   template = await fs.readFile(templatePath, "utf-8");
   templateCache.set(cacheKey, template);
  }

  const context = Object.assign(
   {},
   ...values.filter((v) => typeof v == "object"),
  );

  return template.replace(/{{(\w+)}}/g, (match, key) => {
   const value = context[key];

   if (key == "firstName" && typeof value == "string") {
    return value.charAt(0).toUpperCase() + value.slice(1);
   }
   return value !== undefined ? String(value) : "";
  });
 };
};

const template = createTemplateTag("./shared/email/template");

export default { template };
