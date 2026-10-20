// Ma'lumotlar: arxitektura chizmalaridagi eksplikatsiyalardan
export const RN={d:"Dahliz",o:"Oshxona",m:"Mehmonxona",y:"Yotoqxona",b:"Bolalar xonasi",v:"Vanna",s:"Hojatxona",vs:"Vanna va hojatxona",k:"Omborxona",z:"Zinapoya",bl:"Balkon",t:"Terrasa"};
export const LIVING=new Set(["m","y","b"]), SERVICE=new Set(["d","v","s","vs","k","z"]), OUT=new Set(["bl","t"]);
export const KIND={m:"liv",y:"liv",b:"liv",o:"kit",d:"hall",k:"hall",z:"hall",v:"wet",s:"wet",vs:"wet",bl:"out",t:"out"};
const r2=n=>Math.round(n*100)/100;
function P(s){return s.trim().split(/\s+/).map(t=>{const m=t.match(/^([a-z]+)([\d.]+)$/);return {t:m[1],a:+m[2]}})}
function A(n,s,mir){const rooms=P(s);const area=r2(rooms.filter(r=>r.t!=="t").reduce((x,r)=>x+r.a,0));const ter=r2(rooms.filter(r=>r.t==="t").reduce((x,r)=>x+r.a,0));const rc=Math.max(1,rooms.filter(r=>LIVING.has(r.t)).length);return {n,rooms,mir:!!mir,area,ter,rc}}
const F=(k,label,x)=>Object.assign({k,label},x);
const typ=arr=>[2,3,4].map(f=>F(""+f,f+"-qavat",{apts:arr}));
const repl=(base,arr)=>base.map(a=>arr.find(x=>x.n===a.n)||a);

const b1=[A(2,"d14.22 o16.69 y17 v3.49 s1.57 bl4.08"),A(3,"d8.9 o21 y19.59 s4.4 bl3.82"),A(4,"d7.92 o22.96 y27.71 s4.4 bl4.35"),A(5,"d8.9 o21 y19.59 s4.4 bl3.82",1),A(6,"d7.92 o22.96 y27.71 s4.4 bl4.35",1),A(7,"d14.22 o16.69 y17 v3.49 s1.57 bl4.08",1),A(8,"d15.72 o22.92 m26.5 y22.67 v2.71 s2.75 bl4.45")];
const b1p=[A(2,"d7.4 o12 y14.7 vs3.74 t34.7"),A(3,"d4.28 o10.87 y15.87 vs3.74 t25.4 t12.7"),A(5,"d10 o14.54 m11.64 y14.45 vs4.69 t34.7"),A(6,"d10 o14.54 m11.64 y14.45 vs4.69 t17.7 t22.9",1)];
const b2=[A(1,"d8.5 o21.7 m19.52 s3.25 bl3.99"),A(2,"d8.8 o24.7 m22.84 s3.51 bl3.76"),A(3,"d12.92 o13.32 m31.5 v2.86 s1.23 bl3.76"),A(4,"d7.55 o23.6 m12.36 v2.86 s1.23 bl3.44"),A(5,"d13.74 o14.75 m21.52 y13.22 s3.9 bl2.57 bl4.31"),A(6,"d10.61 o18.3 m19.65 y30.6 s3.96 bl5.57"),A(7,"d10.19 o16.8 m17.81 y14.71 s4.06 bl4.29")];
const b2p=[A(1,"d20.6 o15.3 m22.9 y15 y12.4 v3.2 s1.7 t68"),A(2,"d9.45 o10 m23.75 y20.45 vs3.45 t76.8"),A(3,"d10.1 o11.9 m19 y16.9 vs4.1 t52.6"),A(4,"d10 o12.3 m16.6 y21.9 vs3.6 t15.2 t18.3")];
const b3=[A(1,"d9.83 o22.95 m14.85 y18.47 v2.94 s1.73 bl3.8"),A(2,"d10.51 o21.76 m25.7 y22.4 v3.18 s1.68 bl3.56 bl3.32"),A(3,"d11.69 o26.24 m20.48 y19.32 v2.95 s1.73 bl7.77"),A(4,"d11.69 o26.24 m20.48 y19.32 v2.95 s1.73 bl7.77",1),A(5,"d10.51 o21.76 m25.7 y22.4 v3.18 s1.68 bl3.56 bl3.32",1),A(6,"d9.83 o22.95 m14.85 y18.47 v2.94 s1.73 bl3.8",1)];
const b3p=[A(1,"d21 o12 m17.9 y10.9 y14.4 y19.8 k2.7 k1.8 vs5.4 t20.2 t20"),A(2,"d12.4 o12.9 m13.6 y15 y14.2 vs4.5 t20.1 t23"),A(3,"d12.4 o12.9 m13.6 y15 y14.2 vs4.5 t20.1 t23",1),A(4,"d21 o12 m17.9 y10.9 y14.4 y19.8 k2.7 k1.8 vs5.4 t20.2 t20",1)];
const b4f1=[A(1,"d10 o12.46 m14.24 y17.47 v2.72 s1.73"),A(2,"d19.63 o16.35 m17 y16.4 v3.03 s2.08"),A(3,"d16.31 o16.16 m19.81 y15.22 b18.66 v2.96 s2.08")];
const b4=[A(1,"d10 o12.46 m14.24 y22.6 v2.72 s1.73 bl3.6"),A(2,"d19.6 o16.3 m21.6 y25 v3 s2.1 bl4.1"),A(3,"d16.31 o20.95 m24.6 y19.75 b18.66 v2.96 s2.08 bl3.73")];
const b4p=[A(1,"d16 o21.4 m22.6 y15.8 y18.35 vs4.75 t29.3 t34.4"),A(2,"d11 o13.9 m19.2 y14 y13.9 v3.1 s1.7 t15.1 t15.4")];
const b5f2=[A(4,"d16 o26.4 m22.22 y24.7 v3.3 s1.73 bl3.43"),A(5,"d26.5 o18.1 m30.1 y25.8 v3 s1.73 bl3.86"),A(6,"d10 o14.55 m23.85 y21 v3 s1.73 bl4.1"),A(7,"d17.25 o25.3 m23.75 y30.5 v3.4 s2.2 k2.25 bl3.9"),A(8,"d10.22 o26.5 y24.8 v3.54 s1.56 bl4"),A(9,"d15.73 o28.43 m27.1 y27.2 y26.6 v3 s1.73 bl4.4 bl4.25"),A(10,"d15.73 o26.4 m27.1 y28.6 y25.9 v3 s1.73 bl4.4 bl4.25"),A(11,"d10.22 o26.5 y24.8 v3.54 s1.56 bl4",1),A(12,"d15.73 o30.5 m25 y29.2 v3 s1.73 bl4.2")];
const b5f3=repl(b5f2,[A(10,"d15.73 o26.4 m28.6 y25.9 v3 s1.73 bl4.4"),A(11,"d10.22 o26.4 m26.7 y24.8 v3.54 s1.56 bl4 bl4.25")]);
const b5f4=repl(b5f2,[A(7,"d26 o25.3 m30.5 y21.24 vs4.28 bl3.9"),A(8,"d10.25 o26.5 y20.3 v3.54 s1.56 bl4"),A(10,"d16.28 o26.4 m23.4 y27.1 y28.6 v3.37 s1.73 bl4.25 bl4.4"),A(12,"d15.3 o30.5 m22.4 y29.2 v3 s1.73 bl4.2")]);
const b5p=[A(4,"d11.85 o9 y12.1 y11.9 k2.25 vs5.1 t26.3"),A(5,"d8.2 o13.6 m18.9 y14.35 vs3.75 t27.3"),A(6,"d14.55 o17.75 m17.4 y18.6 y18.6 vs3.4 k3.2 t25.4 t9.9"),A(7,"d16.8 z5.6 m20 y16.55 y18.9 y15.1 vs3.55 t19 t19"),A(8,"d6.45 o19.7 y15.9 vs5.1 t23.5"),A(9,"d10.4 o20.8 m24 y17.5 v3.2 s1.7 t9.6 t19.3"),A(10,"d14.1 z5.8 m16.8 y14.7 y17.25 vs3.8 k3.3 t8.5 t19"),A(11,"d9.65 o7.8 m20.3 y12 vs3.55 t26.8"),A(12,"d12.85 z5.8 m17.25 y17.3 y14.55 y17.35 vs3.8 k3.2 t16.9 t19.5")];
const b6=[A(1,"d8.8 o19.3 y16.9 vs3.4 bl3.9"),A(2,"d8.8 o21.6 y19.3 vs3.4 bl3.9"),A(3,"d10.2 o19.7 y19.1 v3.55 s1.55 bl3.8"),A(4,"d15 o23.1 m21.3 y17.8 v3.7 s2.4 bl4")];
const b6p=[A(1,"d16.27 o13 m13.36 y13.76 v3.95 s2.51"),A(2,"d15.26 o16.04 m15.11 v3.2 s2.2"),A(3,"d16.4 o13.84 m13.36 y13.76 v3.95 s2.51")];
const b8f2=[A(1,"d17.6 o21.5 m31.3 y26.4 vs4.2 k2.1 bl4.2"),A(2,"d10.22 o26.45 m26.37 y24.8 v3.56 s1.57 bl8.25"),A(3,"d15.73 o30.47 m29.3 y24.37 v3 s1.73 bl4.5")];
const b8f34=[A(1,"d15.73 o30.48 m29.3 y24.37 v3 s1.73 bl4.5"),A(2,"d10.6 o26.45 y24.7 v3 s1.8 bl4"),A(3,"d10.4 o22.85 y26.15 v3 s1.7 bl4.25"),A(4,"d10.55 o17.05 y30.7 v3 s1.7 bl4.2")];

export const BLOCKS=[
 {id:1,tag:"Avtoturargoh · do'kon · penthaus",floors:[F("-1","Podval",{info:[["Avtoturargoh",532.8]],note:"Podval qavatida yer osti avtoturargohi."}),F("1","1-qavat",{info:[["Savdo maydoni",537]],note:"Birinchi qavat to'liq tijorat uchun."}),...typ(b1),F("P","Penthaus",{apts:b1p})]},
 {id:2,tag:"Avtoturargoh · katta terrasalar",floors:[F("-1","Podval",{info:[["Avtoturargoh",494.7]],note:"Podval qavatida yer osti avtoturargohi."}),F("1","1-qavat",{info:[["Savdo maydoni",472.84]],note:"Birinchi qavat tijorat uchun."}),...typ(b2),F("P","Penthaus",{apts:b2p})]},
 {id:3,tag:"Avtoturargoh · 6 ta do'kon",floors:[F("-1","Podval",{info:[["Avtoturargoh",485.2]],note:"Podval qavatida yer osti avtoturargohi."}),F("1","1-qavat",{info:[["Do'kon 1",82.2],["Do'kon 2",43],["Do'kon 3",102.68],["Do'kon 4",102.68],["Do'kon 5",43],["Do'kon 6",82.2]],note:"Birinchi qavatda 6 ta alohida do'kon."}),...typ(b3),F("P","Penthaus",{apts:b3p})]},
 {id:4,tag:"Basseyn · 1-qavatdan xonadon",floors:[F("-1","Podval",{info:[["Basseyn",94.59],["Dam olish zonasi",42.77],["Texnik xona",34],["Texnik xona",61.87]],note:"Podvalda basseyn va dam olish zonasi."}),F("1","1-qavat",{apts:b4f1}),...typ(b4),F("P","Penthaus",{apts:b4p})]},
 {id:5,tag:"Keng xonadonlar · 9 ta penthaus",floors:[F("1","1-qavat",{info:[["Tijorat maydoni",456],["Tijorat maydoni",419]],note:"Birinchi qavat tijorat uchun."}),F("2","2-qavat",{apts:b5f2}),F("3","3-qavat",{apts:b5f3}),F("4","4-qavat",{apts:b5f4}),F("P","Penthaus",{apts:b5p})]},
 {id:6,tag:"Garaj · ixcham xonadonlar",floors:[F("-1","Podval",{info:[["Garaj",177.5]],note:"Podval qavatida garaj."}),F("1","1-qavat",{info:[["Tijorat xonasi",36.77],["Tijorat xonasi",97.7]],note:"Birinchi qavat tijorat uchun."}),...typ(b6),F("P","Penthaus",{apts:b6p})]},
 {id:8,tag:"Avtoturargoh · 100 m² dan katta",floors:[F("-1","Podval",{info:[["Avtoturargoh",309.4]],note:"Podval qavatida yer osti avtoturargohi."}),F("1","1-qavat",{info:[["Savdo maydoni",288.4]],note:"Birinchi qavat tijorat uchun."}),F("2","2-qavat",{apts:b8f2}),F("3","3-qavat",{apts:b8f34}),F("4","4-qavat",{apts:b8f34}),F("P","Penthaus",{apts:[A(1,"d17.6 o16.8 m16.5 y19.2 v4.2 s2.2"),A(2,"d7.39 o17.58 m19.38 y18.58 v3.44"),A(3,"d15.59 o17.4 m16.5 y19.06 v4.23 s2.89")]})]}
];


export const fmtN=n=>n.toFixed(2).replace(".",",");
export const fmt=n=>fmtN(n)+" m²";
export const ALL_APTS=[];BLOCKS.forEach(b=>b.floors.forEach(f=>(f.apts||[]).forEach(a=>ALL_APTS.push(a))));
