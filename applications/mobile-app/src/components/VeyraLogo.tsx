import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function VeyraLogo() {
  return (
    <View style={styles.container}>
      {/* V-shaped leaf approximation */}
      <Svg width={70} height={45} viewBox="0 0 70 45">
        <Path
          d="M 15 5 C 25 5, 30 20, 35 40 C 25 30, 10 15, 15 5 Z"
          fill="#475947"
        />
        <Path
          d="M 38 15 C 48 10, 55 15, 45 40 C 40 30, 35 25, 38 15 Z"
          fill="#798E63"
        />
        <Path
          d="M 58 5 L 61 12 L 68 15 L 61 18 L 58 25 L 55 18 L 48 15 L 55 12 Z"
          fill="#D4B584"
        />
      </Svg>
      <Text style={styles.title}>Veyra</Text>
      <Text style={styles.subtitle}>Skincare  •  Nutrition  •  Wellness</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#263925',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    fontSize: 48,
    marginTop: -10,
    letterSpacing: -1,
  },
  subtitle: {
    color: '#4A504A',
    fontSize: 10,
    marginTop: 0,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  }
});
