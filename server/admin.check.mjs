import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './index.mjs';

async function fixture(t, options={}) {
  const dataDir=await mkdtemp(join(tmpdir(),'astra-admin-'));
  const server=await createApp({password:'test-only-password-123456',dataDir,secure:false,...options});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(async()=>{await new Promise(r=>server.close(r));await rm(dataDir,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${server.address().port}`;
  const req=(path,method='GET',body,extra={})=>fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',...extra},body:body?JSON.stringify(body):undefined});
  return {req,dataDir,server};
}
test('admin unavailable without a strong configured password; public game still works',async t=>{
  const {req}=await fixture(t,{password:''});
  assert.equal((await req('/api/admin/session')).status,503);assert.equal((await req('/api/config')).status,200);
});
test('requires login and same origin; rejects incorrect credentials',async t=>{
  const {req}=await fixture(t);
  assert.equal((await req('/api/admin/session')).status,401);
  assert.equal((await req('/api/admin/login','POST',{password:'bad'})).status,401);
  assert.equal((await req('/api/admin/login','POST',{password:'test-only-password-123456'},{Origin:'https://evil.example'})).status,403);
});
test('secure session, CSRF, validated atomic persistence, conflict detection, logout',async t=>{
  const {req,dataDir}=await fixture(t);
  const login=await req('/api/admin/login','POST',{password:'test-only-password-123456'});
  assert.equal(login.status,200);const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
  const {csrf}=await login.json(), headers={Cookie:cookie.split(';')[0],'X-CSRF-Token':csrf};
  const state=await (await req('/api/admin/session','GET',undefined,headers)).json();
  const config={...state.config,announcement:'Chào vũ trụ',luckBonus:2,eventEndsAt:Date.now()+60000,overrides:[{category:'auras',id:'aura-0-0',name:'Tia admin',description:'Đã biên tập'}]};
  assert.equal((await req('/api/admin/config','PUT',{config,revision:0},{Cookie:headers.Cookie})).status,403);
  assert.equal((await req('/api/admin/config','PUT',{config:{...config,luckBonus:99},revision:0},headers)).status,400);
  assert.equal((await req('/api/admin/config','PUT',{config,revision:0},headers)).status,200);
  assert.deepEqual(await (await req('/api/config')).json(),config);
  assert.equal((await req('/api/admin/config','PUT',{config,revision:0},headers)).status,409);
  const restarted=await createApp({password:'test-only-password-123456',dataDir,secure:false});
  await new Promise(r=>restarted.listen(0,'127.0.0.1',r));
  try{assert.deepEqual(await (await fetch(`http://127.0.0.1:${restarted.address().port}/api/config`)).json(),config);}finally{await new Promise(r=>restarted.close(r));}
  assert.equal((await req('/api/admin/logout','POST',{},headers)).status,200);
  assert.equal((await req('/api/admin/session','GET',undefined,headers)).status,401);
});
test('rate limits repeated login failures',async t=>{
  const {req}=await fixture(t);
  for(let i=0;i<5;i++)assert.equal((await req('/api/admin/login','POST',{password:'wrong'})).status,401);
  assert.equal((await req('/api/admin/login','POST',{password:'test-only-password-123456'})).status,429);
});
test('production cookie requires HTTPS',async t=>{
  const {req}=await fixture(t,{secure:true,origin:'https://astra.example'});
  const r=await req('/api/admin/login','POST',{password:'test-only-password-123456'},{Origin:'https://astra.example'});assert.match(r.headers.get('set-cookie'),/; Secure/);
});
