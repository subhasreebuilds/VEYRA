import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const TOTAL_STEPS = 8;
const COLOR_BG = '#F9F6F0';
const COLOR_PRIMARY = '#2D3A2F';
const COLOR_TEXT = '#1F1916';
const COLOR_MUTED = '#6B5A52';
const COLOR_BORDER = '#E8DCD2';
const COLOR_CARD = '#FFFFFF';

export default function OnboardingScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'PREFER_NOT_TO_SAY',
    height: '',
    weight: '',
    goal: 'MAINTENANCE',
    activityLevel: 'SEDENTARY',
    dietaryPreference: 'NON_VEGETARIAN',
    budget: '50',
    cookingTime: '30',
  });

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    // Validation
    if (step === 5 && (!formData.firstName || !formData.lastName || !formData.age)) {
      Alert.alert('Required', 'Please fill out all required fields.');
      return;
    }
    if (step === 6 && (!formData.height || !formData.weight)) {
      Alert.alert('Required', 'Please fill out height and weight.');
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    } else {
      router.replace('/');
    }
  };

  const handleSkip = () => {
    // Skip features and go straight to Profile form (Step 5)
    setStep(5);
  };

  const handleSubmitProfile = async () => {
    if (!formData.budget || !formData.cookingTime) {
      Alert.alert('Required', 'Please fill out budget and cooking time.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age) || 0,
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        budget: parseFloat(formData.budget) || 0,
        cookingTime: parseInt(formData.cookingTime) || 0,
      };

      await api.put('/profile', payload);
      await refreshUser(); // refresh user context
      setStep(8); // Move to success screen
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // RENDERERS FOR EACH STEP
  // -----------------------------------------------------

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Image source={require('../../../assets/images/onboarding_welcome.jpg')} style={styles.fullImage} resizeMode="cover" />
      <View style={styles.overlayBottom}>
        <Text style={styles.logoTitle}>Veyra</Text>
        <Text style={styles.logoSubtitle}>Skincare • Nutrition • Wellness</Text>
        <Text style={styles.title}>A healthier{"\n"}you, naturally</Text>
        <Text style={styles.subtitle}>Personalized care for your skin, body and mind — all in one place.</Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainerPadding}>
      <Text style={styles.title}>Take care{"\n"}of your skin</Text>
      <Text style={styles.subtitle}>Get AI-powered skin analysis, personalized recommendations and simple routines.</Text>
      
      <View style={styles.graphicContainer}>
        <View style={styles.imageCard}>
          <Image source={require('../../../assets/images/onboarding_skin.jpg')} style={styles.imageCardImg} resizeMode="cover" />
        </View>
        <View style={styles.floatingCardSkin}>
          <Text style={styles.floatingCardTitle}>Skin Health</Text>
          <Text style={styles.floatingCardScore}>82<Text style={styles.floatingCardScoreMax}>/100</Text></Text>
        </View>
        
        <View style={styles.iconRow}>
          <View style={styles.iconItem}><Ionicons name="water-outline" size={24} color={COLOR_PRIMARY} /><Text style={styles.iconText}>Cleanse</Text></View>
          <View style={styles.iconItem}><Ionicons name="sparkles-outline" size={24} color={COLOR_PRIMARY} /><Text style={styles.iconText}>Treat</Text></View>
          <View style={styles.iconItem}><Ionicons name="sunny-outline" size={24} color={COLOR_PRIMARY} /><Text style={styles.iconText}>Protect</Text></View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainerPadding}>
      <Text style={styles.title}>Fuel your{"\n"}body well</Text>
      <Text style={styles.subtitle}>Get personalized diet plans, easy recipes and nutrition tips that fit your lifestyle.</Text>
      
      <View style={styles.graphicContainer}>
        <View style={styles.imageCardCircle}>
          <Image source={require('../../../assets/images/onboarding_nutrition.jpg')} style={styles.imageCardCircleImg} resizeMode="cover" />
        </View>
        <View style={styles.floatingCardNutrition}>
          <View style={styles.nutriItem}><Ionicons name="restaurant-outline" size={20} color={COLOR_PRIMARY} /><Text style={styles.nutriText}>Diet Plans</Text></View>
          <View style={styles.nutriItem}><Ionicons name="nutrition-outline" size={20} color={COLOR_PRIMARY} /><Text style={styles.nutriText}>Recipes</Text></View>
          <View style={styles.nutriItem}><Ionicons name="leaf-outline" size={20} color={COLOR_PRIMARY} /><Text style={styles.nutriText}>Nutrition Tips</Text></View>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainerPadding}>
      <Text style={styles.title}>Feel good{"\n"}inside & out</Text>
      <Text style={styles.subtitle}>Explore wellness, grooming, lifestyle and self-care — because you deserve balance.</Text>
      
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}><Ionicons name="flower-outline" size={32} color={COLOR_PRIMARY} /><Text style={styles.gridText}>Wellness</Text></View>
        <View style={styles.gridItem}><Ionicons name="person-circle-outline" size={32} color={COLOR_PRIMARY} /><Text style={styles.gridText}>Grooming</Text></View>
        <View style={styles.gridItem}><Ionicons name="walk-outline" size={32} color={COLOR_PRIMARY} /><Text style={styles.gridText}>Lifestyle</Text></View>
        <View style={styles.gridItem}><Ionicons name="heart-outline" size={32} color={COLOR_PRIMARY} /><Text style={styles.gridText}>Self Care</Text></View>
      </View>
      
      <View style={styles.handwrittenContainer}>
        <Text style={styles.handwrittenText}>Small steps,{"\n"}big changes 🤍</Text>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Tell us about you</Text>
      <Text style={styles.subtitle}>This helps us personalize your experience and recommendations.</Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputIconWrapper}>
          <Ionicons name="person-outline" size={20} color={COLOR_MUTED} style={styles.inputIcon} />
          <TextInput style={styles.inputFull} placeholder="First Name" value={formData.firstName} onChangeText={t => handleChange('firstName', t)} />
        </View>
      </View>
      <View style={styles.inputGroup}>
        <View style={styles.inputIconWrapper}>
          <Ionicons name="person-outline" size={20} color={COLOR_MUTED} style={styles.inputIcon} />
          <TextInput style={styles.inputFull} placeholder="Last Name" value={formData.lastName} onChangeText={t => handleChange('lastName', t)} />
        </View>
      </View>
      <View style={styles.inputGroup}>
        <View style={styles.inputIconWrapper}>
          <Ionicons name="calendar-outline" size={20} color={COLOR_MUTED} style={styles.inputIcon} />
          <TextInput style={styles.inputFull} placeholder="Age (e.g. 24)" keyboardType="numeric" value={formData.age} onChangeText={t => handleChange('age', t)} />
        </View>
      </View>
      
      <Text style={styles.label}>Gender</Text>
      <View style={styles.pillContainer}>
        {['FEMALE', 'MALE', 'OTHER'].map(g => (
          <TouchableOpacity 
            key={g} 
            style={[styles.pill, formData.gender === g && styles.pillActive]} 
            onPress={() => handleChange('gender', g)}>
            <Text style={[styles.pillText, formData.gender === g && styles.pillTextActive]}>{g.charAt(0) + g.slice(1).toLowerCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{height: 100}} />
    </ScrollView>
  );

  const renderStep6 = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Body & Goals</Text>
      <Text style={styles.subtitle}>Help us set the right targets for your wellness journey.</Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputIconWrapper}>
          <Ionicons name="resize-outline" size={20} color={COLOR_MUTED} style={styles.inputIcon} />
          <TextInput style={styles.inputFull} placeholder="Height (cm)" keyboardType="numeric" value={formData.height} onChangeText={t => handleChange('height', t)} />
        </View>
      </View>
      <View style={styles.inputGroup}>
        <View style={styles.inputIconWrapper}>
          <Ionicons name="scale-outline" size={20} color={COLOR_MUTED} style={styles.inputIcon} />
          <TextInput style={styles.inputFull} placeholder="Weight (kg)" keyboardType="numeric" value={formData.weight} onChangeText={t => handleChange('weight', t)} />
        </View>
      </View>
      
      <Text style={styles.label}>Primary Goal</Text>
      <View style={styles.pillContainer}>
        {['GENERAL_WELLNESS', 'MAINTENANCE', 'WEIGHT_LOSS', 'WEIGHT_GAIN'].map(g => (
          <TouchableOpacity 
            key={g} 
            style={[styles.pillLarge, formData.goal === g && styles.pillActive]} 
            onPress={() => handleChange('goal', g)}>
            <Text style={[styles.pillText, formData.goal === g && styles.pillTextActive]}>{g.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Activity Level</Text>
      <View style={styles.pillContainer}>
        {['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE'].map(a => (
          <TouchableOpacity 
            key={a} 
            style={[styles.pillLarge, formData.activityLevel === a && styles.pillActive]} 
            onPress={() => handleChange('activityLevel', a)}>
            <Text style={[styles.pillText, formData.activityLevel === a && styles.pillTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{height: 100}} />
    </ScrollView>
  );

  const renderStep7 = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Food & Lifestyle</Text>
      <Text style={styles.subtitle}>Tailor your meal plans to your tastes and routine.</Text>
      
      <Text style={styles.label}>Dietary Preference</Text>
      <View style={styles.pillContainer}>
        {['NON_VEGETARIAN', 'VEGETARIAN', 'VEGAN', 'EGGETARIAN'].map(d => (
          <TouchableOpacity 
            key={d} 
            style={[styles.pillLarge, formData.dietaryPreference === d && styles.pillActive]} 
            onPress={() => handleChange('dietaryPreference', d)}>
            <Text style={[styles.pillText, formData.dietaryPreference === d && styles.pillTextActive]}>{d.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputIconWrapper}>
          <Ionicons name="wallet-outline" size={20} color={COLOR_MUTED} style={styles.inputIcon} />
          <TextInput style={styles.inputFull} placeholder="Daily Food Budget ($)" keyboardType="numeric" value={formData.budget} onChangeText={t => handleChange('budget', t)} />
        </View>
      </View>
      <View style={styles.inputGroup}>
        <View style={styles.inputIconWrapper}>
          <Ionicons name="time-outline" size={20} color={COLOR_MUTED} style={styles.inputIcon} />
          <TextInput style={styles.inputFull} placeholder="Cooking Time (min)" keyboardType="numeric" value={formData.cookingTime} onChangeText={t => handleChange('cookingTime', t)} />
        </View>
      </View>
      <View style={{height: 100}} />
    </ScrollView>
  );

  const renderStep8 = () => (
    <View style={styles.stepContainer}>
      <Image source={require('../../../assets/images/onboarding_success.jpg')} style={styles.fullImageSuccess} resizeMode="cover" />
      <View style={styles.overlayCenter}>
        <Text style={styles.logoTitleLarge}>Veyra</Text>
        <Text style={styles.titleCenter}>Your wellness journey{"\n"}starts now</Text>
        <Ionicons name="heart" size={24} color={COLOR_PRIMARY} style={{marginTop: 10}} />
      </View>
    </View>
  );


  // -----------------------------------------------------
  // RENDER MAIN LAYOUT
  // -----------------------------------------------------

  const showHeader = step !== 1 && step !== 8;
  const showDots = step !== 8;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>{step}/{TOTAL_STEPS}</Text>
          {(step >= 2 && step <= 4) && (
            <TouchableOpacity onPress={handleSkip} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}
      {step === 7 && renderStep7()}
      {step === 8 && renderStep8()}

      <View style={[styles.footer, step === 8 ? styles.footerSuccess : null]}>
        {showDots && (
          <View style={styles.dotsContainer}>
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
              <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive]} />
            ))}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={step === 7 ? handleSubmitProfile : handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 1 ? 'Get Started →' : step === 7 ? 'Complete Profile →' : step === 8 ? "Let's Go →" : 'Next →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stepIndicator: {
    fontFamily: 'serif',
    fontSize: 16,
    color: COLOR_TEXT,
    fontWeight: 'bold',
  },
  skipText: {
    fontSize: 14,
    color: COLOR_MUTED,
    fontWeight: '500',
  },
  
  // Step Containers
  stepContainer: {
    flex: 1,
    width: '100%',
  },
  stepContainerPadding: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  
  // Full images (Steps 1 & 8)
  fullImage: {
    width: '100%',
    height: '60%',
    position: 'absolute',
    top: 0,
  },
  fullImageSuccess: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  // Typography
  logoTitle: {
    fontFamily: 'serif',
    fontSize: 48,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
    marginBottom: 4,
    textAlign: 'center',
  },
  logoTitleLarge: {
    fontFamily: 'serif',
    fontSize: 56,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
    marginBottom: 32,
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLOR_MUTED,
    textAlign: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 36,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
    marginBottom: 12,
    lineHeight: 42,
  },
  titleCenter: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    color: COLOR_MUTED,
    lineHeight: 20,
    marginBottom: 40,
  },

  // Graphics (Steps 2-4)
  graphicContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  imageCard: {
    width: 220,
    height: 280,
    borderRadius: 120,
    overflow: 'hidden',
    backgroundColor: '#EAE1D5',
  },
  imageCardImg: {
    width: '100%',
    height: '100%',
  },
  floatingCardSkin: {
    position: 'absolute',
    right: 10,
    top: 100,
    backgroundColor: COLOR_CARD,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  floatingCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLOR_MUTED,
    marginBottom: 4,
  },
  floatingCardScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLOR_PRIMARY,
  },
  floatingCardScoreMax: {
    fontSize: 12,
    color: COLOR_MUTED,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 32,
  },
  iconItem: {
    alignItems: 'center',
  },
  iconText: {
    fontSize: 12,
    marginTop: 8,
    color: COLOR_PRIMARY,
    fontWeight: '500',
  },
  
  imageCardCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    backgroundColor: '#EAE1D5',
  },
  imageCardCircleImg: {
    width: '100%',
    height: '100%',
  },
  floatingCardNutrition: {
    position: 'absolute',
    right: -10,
    top: 40,
    backgroundColor: COLOR_CARD,
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  nutriItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutriText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLOR_TEXT,
  },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    backgroundColor: COLOR_CARD,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  gridText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_TEXT,
  },
  handwrittenContainer: {
    marginTop: 40,
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  handwrittenText: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 20,
    color: COLOR_MUTED,
    transform: [{ rotate: '-5deg' }],
  },

  // Forms (Steps 5-7)
  inputGroup: {
    marginBottom: 16,
  },
  inputIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputFull: {
    flex: 1,
    fontSize: 14,
    color: COLOR_TEXT,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: COLOR_MUTED,
    marginBottom: 12,
    marginTop: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_CARD,
  },
  pillLarge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_CARD,
    minWidth: '47%',
    alignItems: 'center',
  },
  pillActive: {
    borderColor: COLOR_PRIMARY,
    backgroundColor: COLOR_PRIMARY,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_MUTED,
  },
  pillTextActive: {
    color: '#FFF',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 24,
    right: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  footerSuccess: {
    bottom: Platform.OS === 'ios' ? 60 : 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1C8C0',
  },
  dotActive: {
    backgroundColor: COLOR_PRIMARY,
    width: 24,
  },
  nextButton: {
    backgroundColor: COLOR_PRIMARY,
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
