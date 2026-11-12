import { Suspense } from 'react';
import { GmSession, Loading } from '@/components/GmSession';
import CampaignBoard from '@/components/CampaignBoard';
export default function Page() {
  return <Suspense fallback={<Loading />}><GmSession><CampaignBoard /></GmSession></Suspense>;
}
