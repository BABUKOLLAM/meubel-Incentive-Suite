// Renders every view of index.html under every role with a stub DOM and fails on any exception, NaN or undefined in the output.
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const stub=()=>({innerHTML:'',textContent:'',className:'',value:'',hidden:false,style:{},dataset:{},files:[],addEventListener(){},setAttribute(){},getBoundingClientRect(){return{left:0,width:600}},querySelectorAll(){return[]},querySelector(){return stub()}});
const nodes={};global.nodes=nodes;
global.document={querySelector:s=>nodes[s]||(nodes[s]=stub()),getElementById:id=>nodes['#'+id]||(nodes['#'+id]=stub())};
global.window={scrollTo(){},getSelection(){return{removeAllRanges(){},addRange(){}}}};
global.localStorage={getItem(){return null},setItem(){},removeItem(){}};
global.navigator={clipboard:{writeText:()=>Promise.resolve()}};
const checks=`
const __snap=()=>nodes['#view'].innerHTML;let __errs=0,__n=0;
const __chk=(label)=>{__n++;try{render();const m=__snap().match(/.{40}(NaN|undefined).{20}/);if(m){__errs++;console.log('NaN/undefined',label,m[0])}}catch(e){__errs++;console.log('ERR',label,e.stack.split('\\n').slice(0,3).join(' | '))}};
nodes['#selUser']=Object.assign(nodes['#selUser']||{},{value:'',onchange:null});
for(const u of allUsers().slice(0,12)){setUser(u.email);for(const day of [1,18,31]){asOf=day;
  for(const st of [{level:'group'},{level:'total'},{level:'company',co:'mg'},{level:'branch',co:'mg',br:'klm'},{level:'leaderboard'},{level:'messages'},{level:'settings'},{level:'admin'}]){Object.assign(state,{co:null,br:null,team:null,person:null},st);__chk(u.role+' '+day+' '+st.level)}
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
console.log(__n+' renders, '+__errs+' failures');
if(__errs)process.exit(1);
`;
new Function(js+checks)();
