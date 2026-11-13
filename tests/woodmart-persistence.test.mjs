import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const php='.wrangler/qa-php/runtime/php.exe';
test('POST com attachment duplicado: parser PHP descarta o primeiro vídeo antes do save nativo', {skip:!existsSync(php)||!existsSync('.wrangler/woodmart-video-audit/class-main.php')?'Requer runtime PHP e fonte privada auditada':false},()=>{
 const r=JSON.parse(execFileSync(php,['-n','wordpress/tests/woodmart-persistence.php'],{encoding:'utf8'}));
 const failed=r.duplicate_main_valid_gallery_empty;
 assert.equal(failed.raw_video_fields[0].upload_video_id,'100');assert.equal(failed.raw_video_fields[1].upload_video_id,'');assert.equal(failed.raw_occurrences,2);assert.equal(failed.parsed_fields,1);
 assert.equal(JSON.parse(failed.parsed_16068).upload_video_id,'');
 assert.equal(failed.writes,1);assert.equal(failed.after['16068'].upload_video_id,'');
 assert.equal(failed.edit_button_on_reload,false);assert.equal(failed.adapter_videos.length,0);
 for(const key of ['unique_main_valid','duplicate_gallery_valid_last','duplicate_both_synchronized']){assert.equal(r[key].edit_button_on_reload,true);assert.equal(r[key].after['16068'].upload_video_id,'100');assert.equal(r[key].adapter_videos.length,1)}
 assert.equal(r.duplicate_replacement_reverts_to_old.after['16068'].upload_video_id,'100');
 for(const key of ['field_absent_preserves_metadata','wrong_post_type_preserves_metadata']){assert.equal(r[key].writes,0);assert.deepEqual(r[key].after,r[key].before)}
});
