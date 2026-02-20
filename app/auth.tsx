import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { getPin, setPin as savePin, hasPin as checkHasPin } from '@/lib/storage';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [pinExists, setPinExists] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const checkBiometrics = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch {
      setBiometricAvailable(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await checkBiometrics();
      const exists = await checkHasPin();
      setPinExists(exists);
      setLoading(false);
    })();
  }, [checkBiometrics]);

  const authenticateBiometric = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock QuickVault',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAuthenticated();
      } else {
        setShowPinInput(true);
      }
    } catch {
      setShowPinInput(true);
    }
  }, [onAuthenticated]);

  const handlePinSubmit = useCallback(async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!pinExists) {
      if (!isSettingPin) {
        setIsSettingPin(true);
        setConfirmPin(pin);
        setPin('');
        setError('');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match');
        setPin('');
        setIsSettingPin(false);
        setConfirmPin('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await savePin(pin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAuthenticated();
      return;
    }

    const storedPin = await getPin();
    if (pin === storedPin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAuthenticated();
    } else {
      setError('Incorrect PIN');
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [pin, pinExists, isSettingPin, confirmPin, onAuthenticated]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <LinearGradient
        colors={['#0F172A', '#1a1040', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[Colors.accent, Colors.accentDark]}
            style={styles.iconGradient}
          >
            <Ionicons name="shield-checkmark" size={48} color={Colors.white} />
          </LinearGradient>
        </View>
        <Text style={styles.title}>QuickVault</Text>
        <Text style={styles.subtitle}>Your personal offline vault</Text>

        {!showPinInput ? (
          <View style={styles.authActions}>
            {biometricAvailable && (
              <Pressable
                onPress={authenticateBiometric}
                style={({ pressed }) => [styles.biometricButton, pressed && styles.buttonPressed]}
              >
                <Ionicons name="finger-print" size={28} color={Colors.white} />
                <Text style={styles.biometricText}>Unlock with Biometrics</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setShowPinInput(true)}
              style={({ pressed }) => [styles.pinButton, pressed && styles.buttonPressed]}
            >
              <Ionicons name="keypad" size={22} color={Colors.accent} />
              <Text style={styles.pinButtonText}>
                {pinExists ? 'Enter PIN' : 'Set up PIN'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>
              {!pinExists
                ? (isSettingPin ? 'Confirm your PIN' : 'Create a PIN')
                : 'Enter your PIN'}
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={(t) => { setPin(t.replace(/[^0-9]/g, '')); setError(''); }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholder="****"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              onSubmitEditing={handlePinSubmit}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable
              onPress={handlePinSubmit}
              style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.submitText}>
                {!pinExists && !isSettingPin ? 'Next' : 'Unlock'}
              </Text>
            </Pressable>
            {biometricAvailable && (
              <Pressable
                onPress={() => { setShowPinInput(false); setPin(''); setError(''); }}
                style={styles.backButton}
              >
                <Text style={styles.backText}>Use Biometrics Instead</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 48,
  },
  authActions: {
    width: '100%',
    gap: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
  },
  biometricText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  pinButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  pinContainer: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  pinInput: {
    width: '60%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  error: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.danger,
  },
  submitButton: {
    width: '100%',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.accentLight,
  },
});
