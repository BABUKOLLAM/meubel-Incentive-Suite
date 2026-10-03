// Appended to the board script by render.test.js with a nine-person live roster in storage (see there).
let __e=0;const BAD=/NaN|undefined|Infinity/;
if(people.length!==9||branches.length!==2||GROUP.companies.length!==2){__e++;console.log('roster build wrong',people.length,branches.length,GROUP.companies.length)}
const co0=GROUP.companies[0].id;
const views=[{level:'group'},{level:'company',co:co0},{level:'branch',co:co0,br:'klm'},{level:'sales'},{level:'total'},{level:'admin'},{level:'settings'}];
['Sales','CRE','Logistics','Back office','Management'].forEach(t=>views.push({level:'team',co:co0,br:'klm',team:t}));
people.forEach(p=>views.push({level:'person',co:p.branch.company.id,br:p.branch.id,team:p.role==='BM'||p.role==='SM'?'Management':p.role,person:p.id}));
const where=s=>(s.match(/.{40}(NaN|undefined|Infinity).{20}/)||[''])[0];
const run=tag=>{setUser('tech@bpropms.com');
  for(const st of views){Object.assign(state,{co:null,br:null,team:null,person:null,lbTab:'Sales'},st);try{render();if(BAD.test(nodes['#view'].innerHTML)){__e++;console.log('live '+tag,st.level,st.team||'',st.person||'',where(nodes['#view'].innerHTML))}}catch(ex){__e++;console.log('live '+tag+' ERR',st.level,st.person||'',ex.message)}}
  for(const t of ['Branches','Sales','CRE','Logistics','Back office','Management']){Object.assign(state,{level:'leaderboard',co:null,br:null,team:null,person:null,lbTab:t});try{render();if(BAD.test(nodes['#view'].innerHTML)){__e++;console.log('live '+tag+' lb',t,where(nodes['#view'].innerHTML))}}catch(ex){__e++;console.log('live lb ERR',t,ex.message)}}
  for(const a of AUDIENCES)for(const c of CADS)for(const [ch] of CHANNELS){Object.assign(state,{level:'messages',co:co0,br:'klm',team:null,person:null,msg:{aud:a.id,cad:c,ch}});try{render();if(BAD.test(nodes['#view'].innerHTML)){__e++;console.log('live '+tag+' msg',a.id,c,ch,where(nodes['#view'].innerHTML))}}catch(ex){__e++;console.log('live msg ERR',a.id,c,ch,ex.message)}}
  const s=allMembers(computeGroup()).map(m=>statementHtml(m,m.brc)).join('');if(BAD.test(s)){__e++;console.log('live '+tag+' statement',where(s))}
  const csv=csvText(PAYOUT_HEADER,payoutRows(computeGroup()));if(BAD.test(csv)){__e++;console.log('live '+tag+' payout csv',where(csv))}};
run('empty');
const NL=String.fromCharCode(10);
const m1=applySource(SOURCES.find(s=>s.id==='targets'),['employee,target','Asha K.,800000','Binu T.,700000','Hari V.,900000'].join(NL));
const m2=applySource(SOURCES.find(s=>s.id==='orders'),['employee,order_no,day,item,list_price,discount_pct,status,deliver_day,pay_day,cancel_day,margin_pct,upsell,cross,review,commitment_ok,cre,offer,reason','Asha K.,KLM-1,2,Sofa,120000,10,paid,5,8,,32,1,0,1,1,Chitra N.,0,','Binu T.,KLM-2,3,Bed,60000,22,booked,9,,,30,0,1,0,1,,0,','Hari V.,CLT-1,4,Table,30000,5,delivered,6,,,35,0,0,1,1,,0,'].join(NL));
const m3=applySource(SOURCES.find(s=>s.id==='attendance'),['employee,day,status','Asha K.,1,p','Asha K.,2,l','Binu T.,1,a'].join(NL));
run('fed');
const k=computeBranch(branches.find(b=>b.id==='klm'));if(!(k.target===1500000&&k.so>0)){__e++;console.log('feeds not applied',k.target,k.so,m1,m2,m3)}
console.log('live roster: '+people.length+' people, '+branches.length+' branches, '+(__e?__e+' problems':'ok'));if(__e)process.exit(1);
