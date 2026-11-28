import { SafeAreaView } from 'react-native-safe-area-context';
import SellerView from '../seller/SellerView';

export default function SellerWorkspace() {
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}><SellerView /></SafeAreaView>;
}
