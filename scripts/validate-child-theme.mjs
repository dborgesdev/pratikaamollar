import {readFileSync,existsSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=resolve('wordpress/pratika-amollar-child');
const files=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())walk(path);else files.push(path)}}
walk(root);
const report={files:files.length,phpLint:[],assetReferences:[],componentChecks:false,officialLogo:false,notes:['Component harness only; no WoodMart or payment integration executed.']};
const php=process.env.PA_CHILD_PHP;
for(const path of files){
 if(/\.(php|css|js|json)$/.test(path)){
  const text=readFileSync(path,'utf8');
  assert.ok(!/[A-Z]:[\\/](?:Users|_dev-projects)/i.test(text),'Local absolute path in '+path);
  if(path.endsWith('.css'))for(const match of text.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)){
   assert.ok(!/^https?:/.test(match[1]),'Remote asset');
   assert.ok(existsSync(resolve(dirname(path),match[1])),'Missing CSS asset '+match[1]);
   report.assetReferences.push(match[1]);
  }
  if(path.endsWith('.php')){
   assert.ok(!/\b(update_option|delete_option|wp_redirect|wp_safe_redirect|remove_all_actions|setcookie|session_start)\s*\(/.test(text),'Unexpected side effect in '+path);
   if(php){execFileSync(php,['-n','-l',path],{stdio:'pipe'});report.phpLint.push(relative(root,path))}
  }
 }
}
assert.match(readFileSync(resolve(root,'style.css'),'utf8'),/^Template: woodmart$/m);
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
assert.equal(hash(resolve(root,'assets/brand/logo-pratika-amollar.png')),hash('public/brand/logo-pratika-amollar.png'));report.officialLogo=true;
const contract=JSON.parse(readFileSync(resolve(root,'inc/parent-contract.json'),'utf8'));assert.equal(contract.reviewed,true);assert.equal(contract.parentVersion,'8.1.1');assert.ok(contract.files['header.php']);assert.ok(contract.files['footer.php']);
if(php){
 const output=execFileSync(php,['-n','wordpress/tests/child-theme.php','check'],{encoding:'utf8'});assert.match(output,/PASS/);
 const html=execFileSync(php,['-n','wordpress/tests/child-theme.php'],{encoding:'utf8'});
 assert.equal((html.match(/<header\b/g)||[]).length,1);assert.equal((html.match(/<footer\b/g)||[]).length,1);
 assert.ok(html.includes('Desenvolvido por Douglas Borges - Smart Local'));assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));
 assert.equal((html.match(/\/categoria\//g)||[]).length,0);assert.equal((html.match(/aria-controls="pa-main-navigation"/g)||[]).length,1);
 assert.ok(!/PA_ASSET_BASE|\bundefined\b|Warning:|Fatal error:/.test(html));
 for(const slug of ['politica-de-privacidade','termos-e-condicoes-de-compra','trocas-devolucoes-e-reembolsos','entrega-e-frete'])assert.ok(html.includes('/'+slug));
 report.componentChecks=true;
}
writeFileSync('docs/child-theme/local-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
