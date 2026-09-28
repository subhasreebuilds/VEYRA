import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import Svg, { Circle } from 'react-native-svg';

const COLOR_BG = '#F9F6F0';
const COLOR_PRIMARY = '#2D3A2F';
const COLOR_TEXT = '#1F1916';
const COLOR_MUTED = '#6B5A52';
const COLOR_CARD = '#FFFFFF';
const COLOR_ACCENT = '#EAE1D5';

export default function DashboardScreen() {
  const { user, profile } = useAuth();
  
  // Mocked state for checklist
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Morning skincare routine', completed: true },
    { id: 2, title: 'Drink water (2/8 glasses)', completed: false },
    { id: 3, title: 'Evening skincare routine', completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const CircularProgress = ({ progress }: { progress: number }) => {
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.progressRingContainer}>
        <Svg width={size} height={size}>
          <Circle
            stroke="#D1D6CC"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke={COLOR_PRIMARY}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressScore}>{progress}</Text>
          <Text style={styles.progressMax}>/100</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>Veyra</Text>
            <Ionicons name="leaf" size={16} color="#708264" style={{ marginLeft: 2, marginTop: -10 }} />
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications" size={24} color={COLOR_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Image source={require('../../../../assets/images/dash_leaf_bg.jpg')} style={styles.bgLeaf} resizeMode="contain" />
          <Text style={styles.greetingText}>Good morning,</Text>
          <Text style={styles.nameText}>{profile?.firstName || 'Beautiful'} 🌺</Text>
          <Text style={styles.subtitleText}>Let's take care of you today.</Text>
        </View>

        {/* Skin Health Card */}
        <View style={styles.skinCard}>
          <Text style={styles.skinCardTitle}>Your Skin Health</Text>
          
          <View style={styles.skinCardBody}>
            <CircularProgress progress={82} />
            
            <View style={styles.skinCardInfo}>
              <Text style={styles.skinStatus}>Looking good!</Text>
              <Text style={styles.skinType}>Combination Skin</Text>
              
              <TouchableOpacity style={styles.viewAnalysisBtn}>
                <Text style={styles.viewAnalysisText}>View Analysis →</Text>
              </TouchableOpacity>
            </View>
            
            <Image 
              source={require('../../../../assets/images/dash_face_portrait.jpg')} 
              style={styles.skinCardFace} 
              resizeMode="cover" 
            />
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your recommendations</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsScroll} contentContainerStyle={styles.recsContent}>
          <View style={styles.recCard}>
            <View style={styles.recIconWrap}><Ionicons name="water-outline" size={24} color={COLOR_PRIMARY} /></View>
            <Text style={styles.recTitle}>Skincare</Text>
            <Text style={styles.recDesc}>Personalized for your skin</Text>
          </View>
          <View style={styles.recCard}>
            <View style={styles.recIconWrap}><Ionicons name="restaurant-outline" size={24} color={COLOR_PRIMARY} /></View>
            <Text style={styles.recTitle}>Nutrition</Text>
            <Text style={styles.recDesc}>Fuel your wellness</Text>
          </View>
          <View style={styles.recCard}>
            <View style={styles.recIconWrap}><Ionicons name="cut-outline" size={24} color={COLOR_PRIMARY} /></View>
            <Text style={styles.recTitle}>Grooming</Text>
            <Text style={styles.recDesc}>Look & feel your best</Text>
          </View>
          <View style={styles.recCard}>
            <View style={styles.recIconWrap}><Ionicons name="body-outline" size={24} color={COLOR_PRIMARY} /></View>
            <Text style={styles.recTitle}>Lifestyle</Text>
            <Text style={styles.recDesc}>Better habits for you</Text>
          </View>
        </ScrollView>

        {/* Today's Veyra (Checklist) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Veyra</Text>
        </View>
        
        <View style={styles.checklistContainer}>
          {tasks.map(task => (
            <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => toggleTask(task.id)}>
              <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                {task.completed && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>{task.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1C8C0" />
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={{height: 100}} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_BG,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
  },
  logoText: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
  },
  
  greetingContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    position: 'relative',
    zIndex: 1,
  },
  bgLeaf: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 250,
    height: 250,
    opacity: 0.9,
    zIndex: -1,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  nameText: {
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
    marginVertical: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: COLOR_MUTED,
    fontWeight: '500',
  },

  skinCard: {
    marginHorizontal: 24,
    marginTop: 32,
    backgroundColor: '#F3ECE1',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  skinCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLOR_PRIMARY,
    marginBottom: 16,
  },
  skinCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRingContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressScore: {
    fontSize: 28,
    fontWeight: '800',
    color: COLOR_PRIMARY,
  },
  progressMax: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_MUTED,
  },
  skinCardInfo: {
    marginLeft: 16,
    flex: 1,
    zIndex: 1,
  },
  skinStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#436B50',
    marginBottom: 4,
  },
  skinType: {
    fontSize: 12,
    color: COLOR_MUTED,
    marginBottom: 12,
  },
  viewAnalysisBtn: {
    backgroundColor: '#5C6C52',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  viewAnalysisText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  skinCardFace: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 160,
    height: 160,
    opacity: 0.9,
    borderRadius: 80,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
  },
  seeAllText: {
    fontSize: 12,
    color: COLOR_MUTED,
    fontWeight: '600',
  },

  recsScroll: {
    paddingLeft: 24,
  },
  recsContent: {
    paddingRight: 48,
    gap: 12,
  },
  recCard: {
    backgroundColor: COLOR_CARD,
    width: 110,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  recIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3ECE1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 9,
    color: COLOR_MUTED,
    textAlign: 'center',
  },

  checklistContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_CARD,
    padding: 16,
    borderRadius: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1C8C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxCompleted: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_PRIMARY,
  },
  taskTitleCompleted: {
    color: COLOR_MUTED,
    textDecorationLine: 'line-through',
  }
});
