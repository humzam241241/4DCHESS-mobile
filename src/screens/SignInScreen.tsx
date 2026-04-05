import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { COLORS } from '../constants';
import { getSupabase } from '../auth';

type Props = {
  onSignedIn: () => void;
};

export default function SignInScreen({ onSignedIn }: Props) {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      if (!sb) return;

      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'chaturaji' });

      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        console.error('OAuth error:', error);
        setLoading(false);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        // Supabase puts tokens in the fragment
        const fragment = url.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          await sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          onSignedIn();
          return;
        }
      }
    } catch (e) {
      console.error('Sign in error:', e);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Chaturaji</Text>
        <Text style={styles.subtitle}>Four Kings Chess</Text>

        <Text style={styles.desc}>
          Free classic games. Premium features unlocked with one payment.
        </Text>

        <Pressable onPress={signInWithGoogle} style={styles.googleBtn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>&#9823;</Text>
            <Text style={styles.featureText}>Classic 4-player Chaturaji, free forever</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>&#11088;</Text>
            <Text style={styles.featureText}>Premium: Custom themes & board styles</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>&#128081;</Text>
            <Text style={styles.featureText}>Premium: Ranked leaderboard</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#e0d6ff',
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: 20,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    gap: 10,
    marginBottom: 28,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  features: { gap: 12, width: '100%' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  featureText: { fontSize: 13, color: COLORS.textDim, flex: 1 },
});
