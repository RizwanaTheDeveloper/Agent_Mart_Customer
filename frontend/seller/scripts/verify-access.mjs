// Local-only integration checks. Never point these at a hosted database.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
const directory='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const file=readdirSync(directory).find(x=>x.endsWith('.sqlite'));assert.ok(file,'Apply local migrations first.');
const db=new DatabaseSync(join(directory,file));
const base='http://127.0.0.1:5173/api/workspace';
const headers={cookie:'__sites_local_auth=1','content-type':'application/json'};
async function get(){return (await fetch(base,{headers})).json()}
async function post(body){const r=await fetch(base,{method:'POST',headers,body:JSON.stringify(body)});return {status:r.status,data:r.headers.get('content-type')?.includes('application/json')?await r.json():Buffer.from(await r.arrayBuffer())}}
let d=await get();assert.equal(d.user.role,'owner');assert.equal(d.documentEncryptionConfigured,true,'Restart the local dev server after adding .dev.vars.');
const workspace=d.workspace.id,user=d.user.userId;const change=role=>db.prepare('UPDATE seller_members SET role=? WHERE workspace_id=? AND user_id=?').run(role,workspace,user);
const item={title:'Access test property',type:'Plot',purpose:'Sale',price:1000000,area:100,unit:'sq yd',city:'Guntur',village:'Thullur',status:'Available',assignedTo:user,insights:{}};
const made=await post({action:'save',kind:'property',data:item});assert.equal(made.status,200);const pid=made.data.id;let doc;
try{
change('viewer');assert.equal((await post({action:'save',kind:'property',id:pid,version:1,data:item})).status,403);assert.equal((await post({action:'invite',email:'qa@example.invalid',role:'agent'})).status,403);
change('agent');assert.equal((await post({action:'publish',id:pid,version:1,published:true,authorized:true})).status,403);assert.equal((await post({action:'save',kind:'property',id:pid,version:1,data:item})).status,200);
const raw=db.prepare('SELECT payload FROM seller_records WHERE id=?').get(pid);db.prepare('UPDATE seller_records SET payload=? WHERE id=?').run(JSON.stringify({...JSON.parse(raw.payload),assignedTo:'another-agent'}),pid);
d=await get();assert.equal(d.records.some(x=>x.id===pid),false);assert.equal((await post({action:'save',kind:'property',id:pid,version:2,data:item})).status,403);
change('owner');db.prepare('UPDATE seller_records SET payload=? WHERE id=?').run(JSON.stringify({...JSON.parse(raw.payload),assignedTo:user,published:false}),pid);
const bytes=Buffer.from('%PDF-1.4\nSeller Studio QA fixture\n%%EOF');
const upload=await post({action:'document',propertyId:pid,label:'QA title record',filename:'qa-test.pdf',mime:'application/pdf',data:bytes.toString('base64')});assert.equal(upload.status,200,JSON.stringify(upload.data));d=await get();doc=d.records.find(x=>x.kind==='document'&&x.propertyId===pid);assert.ok(doc);assert.ok(doc.iv);assert.notEqual(doc.objectKey,'qa-test.pdf');
const downloaded=await post({action:'download',id:doc.id,version:doc.version});assert.equal(downloaded.status,200);assert.deepEqual(downloaded.data,bytes);
assert.equal((await post({action:'document',propertyId:pid,label:'Bad type',filename:'fake.pdf',mime:'application/pdf',data:Buffer.from('not a PDF').toString('base64')})).status,400);
change('viewer');assert.equal((await post({action:'download',id:doc.id,version:doc.version})).status,403);
change('owner');const other='qa_other_workspace';db.prepare('INSERT OR IGNORE INTO seller_workspaces(id,name,created) VALUES(?,?,?)').run(other,'QA Other Firm',new Date().toISOString());db.prepare('INSERT OR IGNORE INTO seller_records(id,workspace_id,kind,payload,version,created,updated) VALUES(?,?,?,?,1,?,?)').run('qa_foreign_property',other,'property',JSON.stringify(item),new Date().toISOString(),new Date().toISOString());
assert.equal((await post({action:'save',kind:'property',id:'qa_foreign_property',version:1,data:item})).status,404);assert.equal((await get()).records.some(x=>x.id==='qa_foreign_property'),false);
const inv=await post({action:'invite',email:'other@example.invalid',role:'agent'});assert.equal(inv.status,200);assert.equal((await post({action:'join',code:inv.data.code})).status,403);
console.log('PASS: viewer write denial, agent publication denial and assignment isolation, cross-firm isolation, email-bound invite rejection, encrypted document roundtrip, file signature validation and restricted downloads.');
}finally{change('owner');if(doc)await post({action:'delete',id:doc.id,version:doc.version});await post({action:'delete',id:pid,version:2});db.prepare('DELETE FROM seller_records WHERE workspace_id=?').run('qa_other_workspace');db.prepare('DELETE FROM seller_workspaces WHERE id=?').run('qa_other_workspace');db.close()}
