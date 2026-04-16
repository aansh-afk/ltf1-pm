import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, email, password, signIn, setActive, router]);

  return (
    <SafeAreaView className="flex-1 bg-base">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-4"
      >
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-primary text-[28px] font-extrabold tracking-tight">
              Sign In
            </Text>
            <Text className="text-secondary text-[16px]">
              Welcome back to LTF1
            </Text>
          </View>

          {error ? (
            <View className="bg-error/15 border border-error rounded-lg p-3">
              <Text className="text-error text-[14px]">{error}</Text>
            </View>
          ) : null}

          <View className="gap-3">
            <TextInput
              className="bg-card border border-default rounded-lg px-3 text-[16px] text-primary"
              style={{ minHeight: 48 }}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              className="bg-card border border-default rounded-lg px-3 text-[16px] text-primary"
              style={{ minHeight: 48 }}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            className="bg-accent rounded-lg items-center justify-center"
            style={{ minHeight: 48 }}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#F9FAFB" />
            ) : (
              <Text className="text-primary text-[16px] font-semibold">
                Sign In
              </Text>
            )}
          </Pressable>

          <View className="flex-row justify-center gap-1">
            <Text className="text-secondary text-[14px]">
              Don&apos;t have an account?
            </Text>
            <Link href="/(auth)/sign-up">
              <Text className="text-accent text-[14px] font-semibold">
                Sign Up
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
