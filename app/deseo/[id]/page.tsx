import WishDetailClient from '@/components/WishDetailClient';
export default async function Detalle({params}:{params:Promise<{id:string}>}) {const {id}=await params;return <WishDetailClient id={id}/>;}
