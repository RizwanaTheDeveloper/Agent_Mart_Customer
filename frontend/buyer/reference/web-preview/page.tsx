import type { Metadata } from 'next';
import BuyerStudio from './buyer-studio';
import './buyer.css';

export const metadata: Metadata = {
  title: 'AgentMart · Buyer Studio',
  description: 'Discover properties, build your shortlist and plan your next move.',
};

export default function BuyerPage() {
  return <BuyerStudio />;
}
