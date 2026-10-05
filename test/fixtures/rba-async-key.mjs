// Synthetic protocol data. Deliberately correlated key fields, not game answers.
export function fillAsyncTestKey(key,id,producer,compact){
  for(let i=0;i<key.length;i++)key[i]=(Math.imul(id,1103515245+i*2)^Math.imul(producer+1,2654435761)^i)>>>0;
  key[0]=id;key[1]=producer;
  if(compact){
    for(let i=2;i<=6;i++)key[i]%=7;
    key[7]&=3;key[10]&=31;key[13]&=31;
  }
  return key;
}
export function asyncTestValue(id,producer){return (id+producer*2)%3+1;}
