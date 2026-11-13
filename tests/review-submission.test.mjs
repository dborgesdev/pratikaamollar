import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/load-ts.mjs';
const { reviewPolicy, submitReview, validateReview, ReviewSubmissionError } = await loadTs(new URL('../src/lib/review-submission.ts', import.meta.url));
const policy = { enabled:true, can_submit:true, authenticated:false, email_required:true, rating_enabled:true, rating_required:true, reason:'', challenge:'test-only-token' };
const draft = { rating:'5', comment:'Comentário de QA.', author:'QA', email:'qa@example.test', website:'' };
const signal = new AbortController().signal;

test('formulário valida nota inteira, comentário, identidade e limites UTF-8', () => {
  assert.deepEqual(validateReview(draft, policy), {});
  for (const rating of ['', '0', '6', '2.5']) assert.ok(validateReview({...draft,rating},policy).rating);
  for (const [key,value] of [['comment',' '],['comment','á'.repeat(5001)],['author',''],['email','invalid']]) assert.ok(validateReview({...draft,[key]:value},policy)[key]);
  assert.deepEqual(validateReview({...draft,author:'',email:''},{...policy,authenticated:true}), {});
  assert.deepEqual(validateReview({...draft,email:''},{...policy,email_required:false}), {});
});
test('contexto usa sessão apenas no domínio WordPress e falha fechado em contrato inválido', async () => {
  let sent;
  assert.deepEqual(await reviewPolicy(15675,signal,async(url,options)=>{sent={url,options};return Response.json(policy)}),policy);
  assert.match(sent.url,/^https:\/\/loja\.pratikaamollar\.com\.br\/wp-admin\/admin-ajax.php\?action=pa_review_context&product_id=15675$/);
  assert.equal(sent.options.credentials,'include'); assert.equal(sent.options.cache,'no-store');assert.equal(sent.options.redirect,'error');
  for (const data of [0, {}, {...policy,challenge:undefined}, {...policy,enabled:'yes'}]) await assert.rejects(reviewPolicy(1,signal,async()=>Response.json(data)));
});
test('envio nativo retorna estado real e mantém o mesmo desafio na repetição', async () => {
  for (const status of ['approved','pending']) {
    const bodies=[];
    const fetcher=async(url,options)=>{assert.match(url,/admin-ajax\.php$/);assert.equal(options.credentials,'include');bodies.push(options.body.toString());return Response.json({status});};
    assert.equal(await submitReview(15675,draft,policy,signal,fetcher),status);
    await submitReview(15675,draft,policy,signal,fetcher);
    assert.equal(bodies[0],bodies[1]);const body=new URLSearchParams(bodies[0]);assert.equal(body.get('action'),'pa_review_submit');assert.equal(body.get('product_id'),'15675');assert.equal(body.get('rating'),'5');
  }
});
test('erros de campo e falha de rede não viram sucesso; sem escrita pela Store API', async () => {
  await assert.rejects(submitReview(1,draft,policy,signal,async()=>Response.json({code:'invalid_email',field:'email',message:'E-mail inválido.'},{status:400})),error=>error instanceof ReviewSubmissionError && error.field==='email');
  await assert.rejects(submitReview(1,draft,policy,signal,async()=>{throw new Error('offline')}),/offline/);
  await assert.rejects(submitReview(1,draft,policy,signal,async()=>Response.json({status:'spam'})));
  await assert.rejects(submitReview(1,draft,{...policy,can_submit:false},signal,async()=>{throw new Error('should not send')}),/não está disponível/);
});
