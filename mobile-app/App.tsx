import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#000' }}>
      <Text style={{ color:'#fff' }}>WNC Leads Mobile App</Text>
      <StatusBar style="light" />
    </View>
  );
}
