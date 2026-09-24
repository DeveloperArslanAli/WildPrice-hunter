import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Borders, Shadows } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BrutalButton } from '../components/ui/BrutalButton';
import { authApi } from '../api/endpoints';
import { useAuthStore } from '../store/auth.store';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setAuth } = useAuthStore();
  const layout = useResponsiveLayout();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const { user, tokens } = await authApi.login({ email, password });
      await setAuth(user, tokens);
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ?? 'Invalid credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.mainWrapper, { maxWidth: layout.isTablet ? 480 : '100%' }]}>
            {/* ── Brand Header ────────────────────── */}
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>W</Text>
              </View>
              <Text style={styles.appName}>WILDPRICE HUNTER</Text>
              <Text style={styles.tagline}>FIND IT CHEAPER. EVERYWHERE.</Text>
            </View>

            {/* ── Login Form ──────────────────────── */}
            <View style={styles.form}>
              <Text style={styles.formTitle}>SIGN IN</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.inkLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.inkLight}
                  secureTextEntry
                />
              </View>

              <BrutalButton
                label="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                style={styles.switchLink}
              >
                <Text style={styles.switchText}>
                  NO ACCOUNT?{' '}
                  <Text style={styles.switchHighlight}>CREATE ONE →</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Main')}
                style={styles.guestLink}
              >
                <Text style={styles.guestText}>CONTINUE AS GUEST (5 searches/day)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setAuth } = useAuthStore();
  const layout = useResponsiveLayout();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { user, tokens } = await authApi.register({ displayName, email, password });
      await setAuth(user, tokens);
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error?.response?.data?.message ?? 'Something went wrong.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.mainWrapper, { maxWidth: layout.isTablet ? 480 : '100%' }]}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>W</Text>
              </View>
              <Text style={styles.appName}>WILDPRICE HUNTER</Text>
              <Text style={styles.tagline}>JOIN. SAVE. REPEAT.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.formTitle}>CREATE ACCOUNT</Text>

              {[
                { label: 'NAME', value: displayName, onChange: setDisplayName, placeholder: 'Your display name', type: 'default' },
                { label: 'EMAIL', value: email, onChange: setEmail, placeholder: 'you@example.com', type: 'email-address' },
                { label: 'PASSWORD', value: password, onChange: setPassword, placeholder: '8+ characters', type: 'default', secure: true },
              ].map((field) => (
                <View key={field.label} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.inkLight}
                    keyboardType={field.type as any}
                    autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                    secureTextEntry={field.secure}
                  />
                </View>
              ))}

              <BrutalButton label="Create Account" onPress={handleRegister} loading={loading} fullWidth size="lg" />

              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchLink}>
                <Text style={styles.switchText}>
                  HAVE AN ACCOUNT? <Text style={styles.switchHighlight}>SIGN IN →</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  flex: { flex: 1 },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: Colors.ink,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xxxl,
  },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: Colors.accentRed,
    borderWidth: Borders.width,
    borderColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.accent,
  },
  logoLetter: { fontSize: 40, fontWeight: Typography.black, color: Colors.bgCard },
  appName: { fontSize: Typography.h3, fontWeight: Typography.black, color: Colors.bgCard, letterSpacing: 3 },
  tagline: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.accentGreen, letterSpacing: 2 },
  form: {
    flex: 1,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  formTitle: { fontSize: Typography.h3, fontWeight: Typography.black, color: Colors.ink, letterSpacing: 2, marginBottom: Spacing.sm },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: Typography.label, fontWeight: Typography.bold, color: Colors.inkMuted, letterSpacing: 2 },
  input: {
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.body,
    color: Colors.ink,
    fontWeight: Typography.medium,
    ...Shadows.default,
  },
  switchLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  switchText: { fontSize: Typography.xs, color: Colors.inkMuted, fontWeight: Typography.bold, letterSpacing: 1 },
  switchHighlight: { color: Colors.accentRed, fontWeight: Typography.black },
  guestLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  guestText: { fontSize: Typography.xs, color: Colors.inkMuted, letterSpacing: 1, fontWeight: Typography.medium },
});
