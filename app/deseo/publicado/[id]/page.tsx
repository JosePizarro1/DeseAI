import PublishedWish from '@/components/PublishedWish';
export default async function Publicado({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 return <PublishedWish id={id}/>;
}
