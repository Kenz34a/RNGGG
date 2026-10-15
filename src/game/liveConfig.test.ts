import { afterEach, expect, test } from 'vitest';
import { setLiveConfig } from './liveConfig';
import { createState, luckOf } from './engine';
afterEach(()=>setLiveConfig({announcement:'',luckBonus:0,eventEndsAt:0,overrides:[]}));
test('admin event adds luck only before expiry without altering saved upgrades',()=>{
  const state=createState(),now=1800000000000,base=luckOf(state,now);
  setLiveConfig({announcement:'Sự kiện',luckBonus:2,eventEndsAt:now+100,overrides:[]});
  expect(luckOf(state,now)).toBe(base+2);
  expect(luckOf(state,now+100)).toBe(base);
  expect(state.upgrades.luck).toBe(0);
});
