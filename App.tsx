import {GestureHandlerRootView} from 'react-native-gesture-handler';
import HomeScreen from './src/screens/HomeScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DeletedTasksScreen from './src/screens/DeletedTasksScreen';
import {RootStackParamList} from "./src/navigation/types";



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
      <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
              <Stack.Navigator>
                  <Stack.Screen name='Home' component={HomeScreen} options={{ title: 'Inicio' }}/>
                  <Stack.Screen name='DeletedTasks' component={DeletedTasksScreen} options={{ title: 'Notas Eliminadas' }}/>
              </Stack.Navigator>
          </NavigationContainer>
      </GestureHandlerRootView>
  );
}
