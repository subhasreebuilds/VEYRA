import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthBackground from '../../components/AuthBackground';
import VeyraLogo from '../../components/VeyraLogo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.accessToken) {
        await login(res.data.accessToken, res.data.user || res.data);
        router.replace('/');
      }
    } catch (e: any) {
      console.error('Login Error:', e);
      Alert.alert('Login Failed', e.message || 'Please check your credentials.');
    }
  };

  return (
    <AuthBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoContainer}>
            <VeyraLogo />
          </View>

          <View style={styles.headerContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.title}>Welcome back</Text>
              <Ionicons name="leaf" size={16} color="#4E614C" style={{ marginLeft: 8, marginTop: 6 }} />
            </View>
            <Text style={styles.subtitle}>Your wellness journey{'\n'}continues here.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#606060" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#A4ABA4"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#606060" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A4ABA4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#606060" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Log In</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 120, height: 70 },
  headerContainer: { marginBottom: 30 },
  title: { fontSize: 32, color: '#1A2F22', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 14, color: '#4A504A', lineHeight: 22, marginTop: 4 },
  formContainer: { flex: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#D4CDC3',
    borderRadius: 25,
    marginBottom: 14,
    paddingHorizontal: 20,
    height: 54,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: '100%', fontSize: 14, color: '#1A2F22' },
  eyeIcon: { padding: 5 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24, marginTop: 4 },
  forgotPasswordText: { color: '#1A2F22', fontSize: 12, fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#4E614C',
    borderRadius: 27,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '500', marginRight: 8 },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#6A6F6A', fontSize: 12 },
  footerLink: { color: '#1A2F22', fontSize: 12, fontWeight: 'bold' }
});
