// Renders every view of index.html under every role with a stub DOM and fails on any exception, NaN or undefined in the output.
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.match(/<script id="board-src"[^>]*>([\s\S]*?)<\/script>/)[1];
const stub=()=>({innerHTML:'',textContent:'',className:'',value:'',hidden:false,style:{},dataset:{},files:[],addEventListener(){},setAttribute(){},getBoundingClientRect(){return{left:0,width:600}},querySelectorAll(){return[]},querySelector(){return stub()}});
const nodes={};global.nodes=nodes;global.__zcrc=require('zlib').crc32;
global.document={querySelector:s=>nodes[s]||(nodes[s]=stub()),getElementById:id=>nodes['#'+id]||(nodes['#'+id]=stub())};
global.window={scrollTo(){},getSelection(){return{removeAllRanges(){},addRange(){}}}};
global.localStorage={getItem(){return null},setItem(){},removeItem(){}};
global.navigator={clipboard:{writeText:()=>Promise.resolve()}};
const checks=`
const __snap=()=>nodes['#view'].innerHTML;let __errs=0,__n=0;
const __chk=(label)=>{__n++;try{render();const m=__snap().match(/.{40}(NaN|undefined).{20}/);if(m){__errs++;console.log('NaN/undefined',label,m[0])}}catch(e){__errs++;console.log('ERR',label,e.stack.split('\\n').slice(0,3).join(' | '))}};
nodes['#selUser']=Object.assign(nodes['#selUser']||{},{value:'',onchange:null});
for(const u of allUsers().slice(0,12)){setUser(u.email);for(const day of [1,18,31]){asOf=day;
  for(const st of [{level:'group'},{level:'total'},{level:'company',co:'mg'},{level:'branch',co:'mg',br:'klm'},{level:'sales'},{level:'sales',co:'mg',br:'klm'},{level:'reports'},{level:'reports',co:'mg',br:'klm'},{level:'leaderboard'},{level:'messages'},{level:'settings'},{level:'admin'}]){Object.assign(state,{co:null,br:null,team:null,person:null},st);__chk(u.role+' '+day+' '+st.level)}
  for(const t of ['Sales','CRE','Logistics','Back office','Management']){Object.assign(state,{level:'team',co:'mg',br:'klm',team:t,person:null});__chk(u.role+' '+day+' team '+t)}
  for(const p of branches[0].people){Object.assign(state,{level:'person',co:'mg',br:'klm',team:p.role,person:p.id});__chk(u.role+' '+day+' person '+p.role)}}}
setUser('tech@bpropms.com');
for(const day of [1,18,31]){asOf=day;for(const tab of ['Branches','Sales','CRE','Logistics','Back office','Management']){Object.assign(state,{level:'leaderboard',co:null,br:null,team:null,person:null,lbTab:tab});__chk(day+' lb '+tab)}
  for(const a of AUDIENCES)for(const c of CADS)for(const [ch] of CHANNELS){Object.assign(state,{level:'messages',co:'rg',br:'pkd',team:null,person:null,msg:{aud:a.id,cad:c,ch}});__chk(day+' msg '+a.id+' '+c+' '+ch)}
  for(const t of ['policy','adjust','wiring','jobs','close','audit']){Object.assign(state,{level:'admin',adminTab:t,co:null,br:null,team:null,person:null});__chk(day+' admin '+t)}}
// scope enforcement
setUser(allUsers().find(u=>u.role==='bm').email);Object.assign(state,{level:'settings'});enforce(state);if(state.level!=='branch'){__errs++;console.log('BM reached settings')}
setUser(allUsers().find(u=>u.role==='employee').email);Object.assign(state,{level:'group'});enforce(state);if(state.level!=='person'){__errs++;console.log('employee reached group')}
setUser('tech@bpropms.com');asOf=18;
// adjustments and settings round trip
const __sp=branches[0].people.find(p=>p.role==='Sales');const __b0=computeBranch(branches[0]).members.find(m=>m.p===__sp).totalProj;
ADJ.push({id:'t1',date:'2026-10-18',type:'Manual addition',person:__sp.id,amount:1500,ref:'',reason:'test',by:'x',status:'Approved',approver:'x'});
const __b1=computeBranch(branches[0]).members.find(m=>m.p===__sp).totalProj;if(Math.round(__b1-__b0)!==1500){__errs++;console.log('adjustment not applied',__b0,__b1)}
const __cfg=JSON.stringify(currentCfg());POOL.Sales=7000;applyCfg(DEFAULTS);if(JSON.stringify(currentCfg())!==__cfg){__errs++;console.log('settings round trip failed')}
// CSV import
const __m=applySource(SOURCES.find(s=>s.id==='attendance'),'employee,day,status\\n'+__sp.name+',2,a');if(!/1 punches/.test(__m)){__errs++;console.log('csv import failed',__m)}
// badges: every member gets a ladder; earned entries are well formed
const __g=computeGroup(),__rk=rankings(__g);let __bn=0;allMembers(__g).forEach(m=>{const l=badgesFor(m,m.brc,__rk);if(!l.length||l.some(x=>!x.name||!x.icon||typeof x.earned!=='boolean'))__errs++;__bn+=l.filter(x=>x.earned).length});console.log('badges earned across the group: '+__bn);
// stale or edited state is sanitised instead of throwing
const __stale=[[{level:'person',co:'mg',br:'klm',team:'Sales',person:'nobody'},'team'],[{level:'branch',co:'mg',br:'gone'},'company'],[{level:'team',co:'mg',br:'klm',team:'Nope'},'branch'],[{level:'nope'},'group'],[{level:'messages',msg:{aud:'Sales',cad:'yearly',ch:'whatsapp'}},'messages'],[{level:'admin',adminTab:'nope'},'admin']];
for(const [st,want] of __stale){Object.assign(state,{co:null,br:null,team:null,person:null},st);try{enforce(state);render();if(state.level!==want){__errs++;console.log('stale state landed on',state.level,'wanted',want,JSON.stringify(st))}}catch(e){__errs++;console.log('stale state threw',JSON.stringify(st),e.message.slice(0,80))}}
if(state.msg.cad!=='weekly'){__errs++;console.log('bad cadence not reset')}
// history, statements, exports
asOf=31;const __snapM=snapshotMonth(MONTH);if(__snapM.people.length!==people.length||__snapM.branches.length!==branches.length){__errs++;console.log('snapshot incomplete')}
if(__snapM.people.some(x=>!isFinite(x.total)||!isFinite(x.score))||__snapM.branches.some(x=>!isFinite(x.payout)||!isFinite(x.midProj))){__errs++;console.log('snapshot has non-finite numbers')}
HIST.push(__snapM);if(history().length!==25||history()[24].sample||history()[0].key!==keyShift(CAL.key,-24)||observedSpread(history())==null){__errs++;console.log('history or spread failed',history().length)}HIST.pop();
let __sn=0;allMembers(computeGroup()).forEach(m=>{const s=statementHtml(m,m.brc);__sn++;if(!/Total payable/.test(s)||/NaN|undefined/.test(s)){__errs++;console.log('statement problem for',m.p.name,(s.match(/.{30}(NaN|undefined).{20}/)||[''])[0])}});
const __csv=payoutCSV(computeGroup());if(__csv.split('\\n').length!==people.length+1||/NaN|undefined|HYPERLINK|D&D/.test(__csv)){__errs++;console.log('payout csv problem')}
if(csvText(['a'],[['x,"y"']],false)!=='a\\n"x,""y"""'){__errs++;console.log('csv quoting wrong')}
// reports: every row type × period grouping renders clean; subtotals add up to the grand total; the outputs carry the footer
asOf=18;const __recs=rptRecords(),__yrs=rptYears();if(__yrs.length!==3){__errs++;console.log('report years',__yrs)}
for(const type of RPT_TYPES.map(t=>t.id))for(const gran of RPT_GRANS.map(g=>g[0])){Object.assign(state,{level:'reports',co:null,br:null,team:null,person:null,rpt:{type,gran,ms:RPT_MEASURES.map(m=>m.id),years:__yrs,months:[1,2,3,4,5,6,7,8,9,10,11,12],total:true}});__chk('report '+type+' '+gran);
  const R=buildReport(rptSpec(),__recs),q=R.MS.findIndex(m=>m.id==='qty');
  if(q>=0){const sub=R.sections.reduce((s,x)=>s+x.tot[q],0),rows=R.sections.reduce((s,x)=>s+x.rows.reduce((a,r)=>a+r.tot[q],0),0);if(Math.abs(sub-R.grand.tot[q])>1e-6||Math.abs(rows-R.grand.tot[q])>1e-6){__errs++;console.log('report totals do not add up',type,gran,sub,rows,R.grand.tot[q])}}
  for(const id of ['qty','value']){const j=R.MS.findIndex(m=>m.id===id);if(j<0||type==='person'||type==='role')continue;for(const sec of R.sections){const rs=sec.rows.reduce((a,r)=>a+(r.tot[j]||0),0);if(Math.abs(rs-(sec.tot[j]||0))>1e-6*Math.max(1,rs)){__errs++;console.log('section rows do not add up',type,gran,id,sec.l,rs,sec.tot[j])}}}
  const csv=reportCSV(R);if(/NaN|undefined/.test(csv)||!csv.includes('Grand total')||!csv.includes('https://www.drbabu.in')){__errs++;console.log('report csv',type,gran)}}
{const sp={type:'branch',gran:'year',ms:['qty','value'],years:__yrs,months:[1,2,3,4,5,6,7,8,9,10,11,12],total:true};const a=buildReport(sp,__recs),b=buildReport({...sp,type:'product'},__recs),c=buildReport({...sp,type:'seller'},__recs);
  if(Math.abs(a.grand.tot[1]-b.grand.tot[1])>1||Math.abs(a.grand.tot[0]-b.grand.tot[0])>0||Math.abs(a.grand.tot[1]-c.grand.tot[1])>1){__errs++;console.log('branch, product and seller reports disagree',a.grand.tot,b.grand.tot,c.grand.tot)}
  if(a.periods.length!==3||!a.periods.some(p=>p.running)){__errs++;console.log('report periods',a.periods.map(p=>p.l))}
  const z=reportXLSX(a),dv2=new DataView(z.buffer);let off=z.length-22,files=[];if(dv2.getUint32(off,true)!==0x06054b50){__errs++;console.log('xlsx: no end record')}else{let p=dv2.getUint32(off+16,true);for(let i=0;i<dv2.getUint16(off+10,true);i++){const nl=dv2.getUint16(p+28,true),crc=dv2.getUint32(p+16,true),size=dv2.getUint32(p+20,true),lo=dv2.getUint32(p+42,true),name=new TextDecoder().decode(z.slice(p+46,p+46+nl)),data=z.slice(lo+30+dv2.getUint16(lo+26,true),lo+30+dv2.getUint16(lo+26,true)+size);if(crc32(data)!==crc||global.__zcrc(data)!==crc){__errs++;console.log('xlsx crc',name)}files.push([name,new TextDecoder().decode(data)]);p+=46+nl}}
  const f=Object.fromEntries(files);if(!f['xl/worksheets/sheet1.xml']||!/Grand total/.test(f['xl/worksheets/sheet1.xml'])||!/TargetMode="External"/.test(f['xl/worksheets/_rels/sheet1.xml.rels']||'')||!/D&amp;&amp;D by Dr.Babu.B./.test(f['xl/worksheets/sheet1.xml'])){__errs++;console.log('xlsx content',Object.keys(f))}}
{const all12=[1,2,3,4,5,6,7,8,9,10,11,12],base=rptRecords();
  // a close archived before release 1.3 (no key, no per-person volumes, no products) still reports branch value and target
  const old=JSON.parse(JSON.stringify(base.find(r=>r.key===keyShift(CAL.key,-1))));delete old.key;delete old.products;old.people.forEach(p=>{delete p.so;delete p.target;delete p.qty;delete p.br});old.branches.forEach(b=>delete b.qty);
  HIST.push(old);const R1=buildReport({type:'branch',ms:['value','target','qty'],years:[CAL.year],months:[CAL.month],gran:'month',total:false},rptRecords());HIST.pop();
  if(!(R1.grand.cells[0]==null&&R1.grand.cells[1]>0&&R1.grand.cells[2]>0&&R1.notes.some(n=>/before release 1.3/.test(n)))){__errs++;console.log('legacy month report',R1.grand.cells,R1.notes)}
  // a salesperson who moved branch: every branch subtotal still equals its rows
  const moved=JSON.parse(JSON.stringify(base)),p0=moved[moved.length-2].people.find(p=>p.role==='Sales'&&p.br==='klm');p0.br='ekm';p0.branch='Kochi';
  const R2=buildReport({type:'seller',ms:['value'],years:rptYears(),months:all12,gran:'year',total:true},moved);for(const sec of R2.sections){const rs=sec.rows.reduce((a,r)=>a+(r.tot[0]||0),0);if(Math.abs(rs-sec.tot[0])>1){__errs++;console.log('moved seller breaks subtotal',sec.l,rs,sec.tot[0])}}}
{const R=buildReport({type:'branch',ms:['qty','value','ach'],years:rptYears(),months:[1,2,3,4,5,6,7,8,9,10,11,12],gran:'month',total:true},rptRecords()),bs=rptBands(R,14);
  if(bs.reduce((a,b)=>a+b.periods.length,0)!==R.periods.length||bs.filter(b=>b.total).length!==1||!bs[bs.length-1].total||bs.some(b=>b.periods.length*R.MS.length>14)){__errs++;console.log('print bands wrong',bs.map(b=>b.periods.length))}}
{const b=computeBranch(branches[0]),rk=rankings(computeGroup());for(const a of ['BM','MD','HR','Sales','person'])for(const ch of ['email','whatsapp']){const n=buildMessage(a,'weekly',ch,{b,rk,person:b.members[0]}).text.split('www.drbabu.in').length-1;if(n!==(ch==='email'?1:0)){__errs++;console.log('footer count',a,ch,n)}}}
Object.assign(state,{rpt:null});
const __bm=allUsers().find(u=>u.role==='sm');setUser(__bm.email);Object.assign(state,{level:'reports',co:null,br:null,team:null,person:null});enforce(state);if(state.level!=='reports'||state.br!==__bm.br||rptTypes().some(t=>t.id==='person')){__errs++;console.log('sales manager report scope',state.level,state.br)}
setUser('tech@bpropms.com');
// totals rows: the board's main tables carry a grand total
Object.assign(state,{level:'group',co:null,br:null,team:null,person:null});render();if((__snap().match(/class="grand"/g)||[]).length<2||!/Subtotal · Meubel Grande/.test(__snap())){__errs++;console.log('group totals missing')}
Object.assign(state,{level:'branch',co:'mg',br:'klm'});render();if(!/Kollam total/.test(__snap())||!/Subtotal · Sales/.test(__snap())){__errs++;console.log('branch totals missing')}
console.log(__sn+' statements, '+__csv.split('\\n').length+' payout rows');asOf=18;
console.log(__n+' renders, '+__errs+' failures');
if(__errs)process.exit(1);
`;
new Function(js+checks)();
// a 30-day live month: the calendar object must drive every day count and label
global.window.BPRO_CONFIG={month:'2026-11'};
const checks2=`let __e=0;if(DAYS!==30||MONTH!=='November 2026'||MON!=='Nov'||CAL.prev[2]!=='October 2026'){__e++;console.log('calendar wrong',DAYS,MONTH,MON,CAL.prev)}
setUser('tech@bpropms.com');for(const st of [{level:'group'},{level:'sales'},{level:'leaderboard'},{level:'messages'},{level:'person',co:'mg',br:'klm',team:'Sales',person:branches[0].people.find(p=>p.role==='Sales').id}]){Object.assign(state,{co:null,br:null,team:null,person:null},st);try{render();const m=nodes['#view'].innerHTML.match(/.{30}(NaN|undefined|Oct\\b).{20}/);if(m){__e++;console.log('november render',st.level,m[0])}}catch(ex){__e++;console.log('november ERR',st.level,ex.message)}}
const __b=computeBranch(branches[0]);const __t=buildMessage('SM','daily','whatsapp',{b:__b,rk:rankings(computeGroup()),person:null}).text;if(/\\bOct\\b/.test(__t)||!/Nov/.test(__t)){__e++;console.log('november message still says Oct')}
console.log('november month: DAYS '+DAYS+', '+MONTH+', '+(__e?__e+' problems':'ok'));if(__e)process.exit(1);`;
new Function(js+checks2)();
delete global.window.BPRO_CONFIG;
// live roster, no data yet: every view renders without NaN, undefined or Infinity; then three feeds land
{const rosterRows=[['r1','Asha K.','Sales','Kollam','klm','Meubel Grande'],['r2','Binu T.','Sales','Kollam','klm','Meubel Grande'],['r3','Chitra N.','CRE','Kollam','klm','Meubel Grande'],['r4','Deepak S.','Logistics','Kollam','klm','Meubel Grande'],['r5','Elsa M.','Back office','Kollam','klm','Meubel Grande'],['r6','Faisal R.','BM','Kollam','klm','Meubel Grande'],['r7','Gita P.','SM','Kollam','klm','Meubel Grande'],['r8','Hari V.','Sales','Calicut','clt','Royal Group'],['r9','Indu J.','BM','Calicut','clt','Royal Group']].map(([id,name,role,branch,branch_id,company])=>({id,name,role,branch,branch_id,company}));
const store={'mr-roster':rosterRows,'mr-user':'tech@bpropms.com'};
const savedLS=global.localStorage;global.localStorage={getItem:k=>k in store?JSON.stringify(store[k]):null,setItem(k,v){store[k]=JSON.parse(v)},removeItem(k){delete store[k]}};
global.window.BPRO_CONFIG={month:'2026-11'};
new Function(js+require('fs').readFileSync(require('path').join(__dirname,'live-roster.checks.js'),'utf8'))();
global.localStorage=savedLS;delete global.window.BPRO_CONFIG;}
