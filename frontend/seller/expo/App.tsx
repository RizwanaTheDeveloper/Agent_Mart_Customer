import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SellerView from './src/SellerView';

export default function App() {
  return <SafeAreaProvider><SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f6f7f8' }}><StatusBar style="dark" /><SellerView /></SafeAreaView></SafeAreaProvider>;
}
