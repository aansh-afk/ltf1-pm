import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import * as SecureStore from 'expo-secure-store'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { AuthService } from '../../services/auth'
import { ThemeService } from '../../services/theme'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigation = useNavigation()
  const theme = ThemeService.getTheme()

  // OAuth configuration
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com')
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'LTF1',
  })

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery
  )

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    setIsLoading(true)
    try {
      const result = await AuthService.login(email, password)
      if (result.success) {
        await SecureStore.setItemAsync('auth_token', result.token)
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' as any }],
        })
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials')
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const result = await promptAsync()
    if (result?.type === 'success') {
      const { authentication } = result
      // Handle Google authentication token
      setIsLoading(true)
      try {
        const loginResult = await AuthService.loginWithGoogle(authentication!.accessToken)
        if (loginResult.success) {
          await SecureStore.setItemAsync('auth_token', loginResult.token)
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' as any }],
          })
        }
      } catch (error) {
        Alert.alert('Error', 'Google login failed')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSSOLogin = async () => {
    // Navigate to SSO login
    const ssoUrl = await AuthService.getSSOUrl()
    const result = await WebBrowser.openAuthSessionAsync(ssoUrl, redirectUri)
    
    if (result.type === 'success' && result.url) {
      // Parse the authentication response
      const params = new URLSearchParams(result.url.split('?')[1])
      const token = params.get('token')
      
      if (token) {
        await SecureStore.setItemAsync('auth_token', token)
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' as any }],
        })
      }
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={['#FF00FF', '#00FFFF', '#FFFF00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Text style={styles.logo}>LTF1</Text>
          <Text style={styles.tagline}>Project Management System</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Welcome Back
          </Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.text.secondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.text.secondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: '#FF00FF' }]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.loginButtonText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.text.secondary }]}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }]}
            onPress={handleGoogleLogin}
            disabled={!request}
          >
            <Image
              source={require('../../assets/google-icon.png')}
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { color: theme.colors.text.primary }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }]}
            onPress={handleSSOLogin}
          >
            <Text style={[styles.socialButtonText, { color: theme.colors.text.primary }]}>
              Enterprise SSO Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: '#00FFFF' }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: theme.colors.text.secondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.signupLink, { color: '#FF00FF' }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  gradientHeader: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
    fontFamily: 'SpaceMono',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#000000',
    marginTop: 8,
    fontFamily: 'SpaceMono',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    fontFamily: 'SpaceMono',
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  loginButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  socialButton: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
})