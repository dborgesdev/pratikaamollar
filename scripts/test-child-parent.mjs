import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const php=process.env.PA_CHILD_PHP;
if(!php)throw Error('Set PA_CHILD_PHP to a local PHP executable.');
const parent=resolve('.wrangler/woodmart-source/woodmart');
const fixture=mkdtempSync(resolve('.wrangler/parent-shell-test-'));
const contract=JSON.parse(readFileSync('wordpress/pratika-amollar-child/inc/parent-contract.json','utf8'));
for(const path of Object.keys(contract.files)){
 const target=resolve(fixture,path);mkdirSync(dirname(target),{recursive:true});
 writeFileSync(target,readFileSync(resolve(parent,path),'utf8').replaceAll('\r\n','\n'));
}
const results=[];
function run(mode,source=parent){
 const output=execFileSync(php,['-n','wordpress/tests/child-parent-shell.php',mode],{encoding:'utf8',env:{...process.env,PA_CHILD_PARENT:source}}).trim();
 if(output!=='PASS '+mode)throw Error(output);
 results.push({mode,passed:true});console.log(output);
}
for(const mode of ['normal','admin','ajax','pjax','maintenance','early'])run(mode);
run('line-endings',fixture);
writeFileSync(resolve(fixture,'header.php'),readFileSync(resolve(fixture,'header.php'),'utf8')+'\n<!-- drift -->');
run('tampered',fixture);
writeFileSync('docs/child-theme/parent-shell-tests.json',JSON.stringify({parentVersion:contract.parentVersion,kind:'Real parent layout functions with isolated WordPress API stubs; no database, checkout or gateway execution',results},null,2)+'\n');
