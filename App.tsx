import {GestureHandlerRootView} from 'react-native-gesture-handler';
import HomeScreen from './src/screens/HomeScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DeletedTasksScreen from './src/screens/DeletedTasksScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
              <Stack.Navigator>
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="DeletedTasks" component={DeletedTasksScreen} />
              </Stack.Navigator>
          </NavigationContainer>
      </GestureHandlerRootView>
  );
}
