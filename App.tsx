import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Image, StyleSheet} from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import DeletedTasksScreen from './src/screens/DeletedTasksScreen';
import {ThemeProvider} from './src/context/ThemeProvider';
import {RootStackParamList} from './src/navigation/types';
// @ts-ignore
import Logo from './assets/Logo_letra_negra.png';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // @ts-ignore
    // @ts-ignore
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
              <NavigationContainer>
                  <Stack.Navigator>
                      <Stack.Screen name='Home'
                                    component={HomeScreen}
                                    options={{
                                        title: 'Inicio',
                                        headerTitle: () => (
                                            <Image
                                                source={Logo}
                                                style={styles.logo}
                                            />
                                        ),
                                        headerTitleAlign: 'center',
                      }}/>
                      <Stack.Screen name='DeletedTasks'
                                    component={DeletedTasksScreen}
                                    options={{
                                        headerTitle: () => (
                                            <Image
                                                source={Logo}
                                                style={styles.logo}
                                            />
                                        ),
                                        headerBackTitle: 'Volver',
                                    }}/>
                  </Stack.Navigator>
              </NavigationContainer>
          </ThemeProvider>
      </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    logo: {
        width: 140,
        height: 40,
        resizeMode: 'contain'
    }
})
