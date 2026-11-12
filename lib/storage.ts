import type {Analysis,WishDraft} from './analysis';
export type SavedWish=WishDraft&{id:string;createdAt:string;analysis:Analysis};
const KEY='deseai-demo-wishes-v16';
export function getSavedWishes():SavedWish[]{if(typeof window==='undefined')return[];try{const p=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(p)?p:[]}catch{return[]}}
export function saveWish(w:SavedWish){const previous=getSavedWishes();localStorage.setItem(KEY,JSON.stringify([w,...previous].slice(0,25)))}
export function deleteWish(id:string){localStorage.setItem(KEY,JSON.stringify(getSavedWishes().filter(w=>w.id!==id)))}
const INTEREST='deseai-demo-joined';
export function getInterest():string[]{if(typeof window==='undefined')return[];try{const p=JSON.parse(localStorage.getItem(INTEREST)||'[]');return Array.isArray(p)?p:[]}catch{return[]}}
export function setInterest(id:string,active:boolean){const arr=getInterest().filter(x=>x!==id);if(active)arr.push(id);localStorage.setItem(INTEREST,JSON.stringify(arr))}
