import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLOR_PRIMARY = '#2D3A2F';
const COLOR_MUTED = '#A09289';
const COLOR_BG = '#F9F6F0';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 20 }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        // Define icons and labels
        let iconName: any = 'home';
        let label = '';
        
        if (route.name === 'index') { iconName = 'home'; label = 'Home'; }
        else if (route.name === 'skin') { iconName = 'sparkles'; label = 'Skin'; }
        else if (route.name === 'fab') { iconName = 'add'; label = ''; }
        else if (route.name === 'wellness') { iconName = 'leaf'; label = 'Wellness'; }
        else if (route.name === 'me') { iconName = 'person'; label = 'Me'; }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? COLOR_PRIMARY : COLOR_MUTED;
        
        // FAB (Center button)
        if (route.name === 'fab') {
          return (
            <TouchableOpacity key={index} onPress={() => console.log('FAB Pressed')} style={styles.fabContainer}>
              <View style={styles.fabButton}>
                <Ionicons name="add" size={32} color="#FFF" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={index} onPress={onPress} style={styles.tabItem}>
            <Ionicons name={isFocused ? iconName : `${iconName}-outline`} size={24} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="skin" />
      <Tabs.Screen name="fab" />
      <Tabs.Screen name="wellness" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: COLOR_BG,
    borderTopWidth: 1,
    borderTopColor: '#E8DCD2',
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -15 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  }
});
