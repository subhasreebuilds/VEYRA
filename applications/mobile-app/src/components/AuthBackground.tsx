import React from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function AuthBackground({ children, showBottomText = false }: { children: React.ReactNode, showBottomText?: boolean }) {
  return (
    <View style={styles.container}>
      {/* Top Right Leaves */}
      <View style={styles.topRight}>
        <Svg width={250} height={350} viewBox="0 0 250 350">
          <Path
            d="M 150 -50 C 150 100, 50 150, 20 250 C 80 180, 200 150, 220 0 Z"
            fill="#C9D3C0"
          />
          <Path
            d="M 250 -20 C 220 120, 100 200, 80 320 C 130 250, 270 220, 300 50 Z"
            fill="#DCE2D1"
            opacity={0.7}
          />
        </Svg>
      </View>

      {/* Bottom Left Blobs */}
      <View style={styles.bottomLeft}>
        <Svg width={350} height={250} viewBox="0 0 350 250">
          <Path
            d="M -50 300 C -50 150, 120 200, 250 230 C 300 240, 330 270, 350 300 Z"
            fill="#DCE2D1"
          />
          <Path
            d="M -20 300 C -20 200, 70 230, 150 250 C 180 270, 210 300, 230 300 Z"
            fill="#C9D3C0"
            opacity={0.6}
          />
        </Svg>
      </View>

      {/* Foreground Content */}
      <View style={StyleSheet.absoluteFill}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFE7',
  },
  topRight: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  bottomText: {
    position: 'absolute',
    bottom: 50,
    left: 45,
    transform: [{ rotate: '-10deg' }],
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    color: '#475947',
    fontSize: 15,
    lineHeight: 22,
  }
});
