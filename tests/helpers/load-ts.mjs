import ts from 'typescript';
import { readFileSync } from 'node:fs';
const modules = new Map();
export async function loadTs(file) {
  const url = file instanceof URL ? file : new URL(file, import.meta.url);
  function compile(target) {
    if (modules.has(target.href)) return modules.get(target.href);
    let code = ts.transpileModule(readFileSync(target, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    code = code.replace(/from ['"](\.[^'"]+)['"]/g, (_, path) => 'from ' + JSON.stringify(compile(new URL(/\.tsx?$/.test(path) ? path : path + '.ts', target))));
    const data = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64'); modules.set(target.href, data); return data;
  }
  return import(compile(url));
}
