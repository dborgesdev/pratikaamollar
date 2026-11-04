import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const localPhp = '.wrangler/qa-php/runtime/php.exe';
const php = process.env.PA_CHILD_PHP || (existsSync(localPhp) ? localPhp : undefined);
test('PHP routing matrix: methods, native paths, callbacks, handoff, guards and loop boundary', {skip: !php && 'Set PA_CHILD_PHP to execute PHP routing tests'}, () => {
 const result = JSON.parse(execFileSync(php, ['-n', 'wordpress/tests/operational-routing.php'], {encoding:'utf8'}));
 assert.ok(result.passed >= 65);
});
