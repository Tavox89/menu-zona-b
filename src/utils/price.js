export const calcSubtotal = items => items.reduce((s,i)=>s+i.lineTotal,0);
