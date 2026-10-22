// Ma'lumotlar: arxitektura chizmalaridagi eksplikatsiyalardan (6 va 8-blok PDF, «Universal Proekt Plyus»).
// Xona kodi + maydon: d Dahliz, o Oshxona, m Mehmonxona, y Yotoqxona, b Bolalar xonasi, v Vanna, s Hojatxona,
// vs Vanna va hojatxona, k Omborxona, z Zinapoya, bl Balkon, t Terrasa. Terrasa umumiy maydonga kirmaydi (chizmadagidek).
export const RN={d:"Dahliz",o:"Oshxona",m:"Mehmonxona",y:"Yotoqxona",b:"Bolalar xonasi",v:"Vanna",s:"Hojatxona",vs:"Vanna va hojatxona",k:"Omborxona",z:"Zinapoya",bl:"Balkon",t:"Terrasa"};
export const LIVING=new Set(["m","y","b"]);
export const KIND={m:"liv",y:"liv",b:"liv",o:"kit",d:"hall",k:"hall",z:"hall",v:"wet",s:"wet",vs:"wet",bl:"out",t:"out"};
const r2=n=>Math.round(n*100)/100;
function P(s){return s.trim().split(/\s+/).map(t=>{const m=t.match(/^([a-z]+)([\d.]+)$/);return {t:m[1],a:+m[2]}})}
function A(n,s){const rooms=P(s);const area=r2(rooms.filter(r=>r.t!=="t").reduce((x,r)=>x+r.a,0));const ter=r2(rooms.filter(r=>r.t==="t").reduce((x,r)=>x+r.a,0));const rc=Math.max(1,rooms.filter(r=>LIVING.has(r.t)).length);return {n,rooms,area,ter,rc}}
// pg — shu qavat chizmasi PDF'ning nechanchi varag'ida (rejalar rasmi scripts/plans.py bilan shundan olinadi)
const F=(k,label,pg,x)=>Object.assign({k,label,pg},x);
const same=(pgs,apts)=>[2,3,4].map((f,i)=>F(""+f,f+"-qavat",pgs[i],{apts}));

const b6=[A(1,"d8.8 o19.3 y16.9 vs3.4 bl3.9"),A(2,"d8.8 o21.6 y19.3 vs3.4 bl3.9"),A(3,"d10.2 o19.7 y19.1 v3.55 s1.55 bl3.8"),A(4,"d15 o23.1 m21.3 y17.8 v3.7 s2.4 bl4")];
// 1-xonadon jadvali chizmada 3-xonadondan nusxa ko'chirilgan; maydonlar rejadagi xona yorliqlaridan olindi
const b6p=[A(1,"d14.3 o10.75 m17.2 y12.7 k2.6 vs4.5"),A(2,"d15.26 o16.04 m15.11 v3.2 s2.2"),A(3,"d16.4 o13.84 m13.36 y13.76 v3.95 s2.51")];
const b8f2=[A(1,"d17.6 o21.5 m31.3 y26.4 vs4.2 k2.1 bl4.2"),A(2,"d10.22 o26.45 m26.37 y24.8 v3.56 s1.57 bl8.25"),A(3,"d15.73 o30.47 m29.3 y24.37 v3 s1.73 bl4.5")];
const b8f34=[A(1,"d15.73 o30.48 m29.3 y24.37 v3 s1.73 bl4.5"),A(2,"d10.6 o26.45 y24.7 v3 s1.8 bl4"),A(3,"d10.4 o22.85 y26.15 v3 s1.7 bl4.25"),A(4,"d10.55 o17.05 y30.7 v3 s1.7 bl4.2")];
const b8p=[A(1,"d15.59 o17.4 m16.5 y19.06 v4.23 s2.89"),A(2,"d7.39 o17.58 m19.38 y18.58 v3.44"),A(3,"d17.6 o16.8 m16.5 y19.2 v4.2 s2.2")];

const park=(pg,a)=>F("-1","Podval",pg,{info:[["Avtoturargoh",a]],note:"Yer osti avtoturargohi."});
export const BLOCKS=[
 {id:6,tag:"Garaj · ixcham xonadonlar",floors:[F("-1","Podval",1,{info:[["Garaj",177.5]],note:"Podval qavatida garaj."}),F("1","1-qavat",2,{info:[["Tijorat xonasi",36.77],["Tijorat xonasi",97.7]],note:"Birinchi qavat tijorat uchun."}),...same([3,4,5],b6),F("P","Penthaus",6,{apts:b6p})]},
 {id:8,tag:"Avtoturargoh · 100 m² dan katta",floors:[park(1,309.4),F("1","1-qavat",2,{info:[["Savdo maydoni",288.4]],note:"Birinchi qavat tijorat uchun."}),F("2","2-qavat",3,{apts:b8f2}),F("3","3-qavat",4,{apts:b8f34}),F("4","4-qavat",5,{apts:b8f34}),F("P","Penthaus",6,{apts:b8p})]}
];

export const fmtN=n=>n.toFixed(2).replace(".",",");
export const fmt=n=>fmtN(n)+" m²";
export const ALL_APTS=[];BLOCKS.forEach(b=>b.floors.forEach(f=>(f.apts||[]).forEach(a=>ALL_APTS.push(a))));
