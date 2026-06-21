import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check } from 'lucide-react-native';

import type { AppTheme } from '@/theme/tokens';
import { api } from '@/lib/backend';

type Step = 'phone' | 'code' | 'password' | 'success';

type RenewStartResponse = { renewal_id: string; message: string };
type RenewCompleteResponse = { status: 'renewed' };

function mapRenewalError(e: unknown): string {
  const msg = String((e as Error)?.message ?? '');
  if (/forbidden/i.test(msg)) return 'Invalid admin token.';
  if (/expired|not found|invalid renewal/i.test(msg)) return 'This renewal session expired. Start again.';
  if (/code/i.test(msg)) return 'Invalid code. Check and try again.';
  if (/password/i.test(msg)) return 'Invalid 2FA password.';
  return msg || 'Something went wrong. Try again.';
}

function needsPasswordRetry(e: unknown): boolean {
  return /password/i.test(String((e as Error)?.message ?? ''));
}

export function TelegramRenewalModal({
  visible,
  onClose,
  theme,
  adminToken,
  onRenewed,
  onRequireToken,
}: {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  adminToken: string | null;
  onRenewed: () => void;
  onRequireToken: () => void;
}) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [renewalId, setRenewalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function reset() {
    setStep('phone');
    setPhone('');
    setCode('');
    setPassword('');
    setRenewalId(null);
    setLoading(false);
    setErrorMsg(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleStart() {
    if (!adminToken) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post<RenewStartResponse>(
        '/admin/telegram/renew/start',
        phone ? { phone } : {},
        { headers: { 'x-admin-token': adminToken } },
      );
      setRenewalId(res.renewal_id);
      setStep('code');
    } catch (e) {
      setErrorMsg(mapRenewalError(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!adminToken || !renewalId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.post<RenewCompleteResponse>(
        '/admin/telegram/renew/complete',
        { renewal_id: renewalId, code, ...(step === 'password' ? { password } : {}) },
        { headers: { 'x-admin-token': adminToken } },
      );
      setStep('success');
      onRenewed();
    } catch (e) {
      if (step === 'code' && needsPasswordRetry(e)) {
        setErrorMsg(null);
        setStep('password');
      } else {
        setErrorMsg(mapRenewalError(e));
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: errorMsg ? theme.colors.accentError : theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceStrong,
  };

  function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => ({
          borderRadius: theme.radius.sm,
          paddingVertical: theme.spacing.sm,
          alignItems: 'center',
          backgroundColor: disabled || loading ? theme.colors.border : theme.colors.accentBlue,
          opacity: pressed ? 0.8 : 1,
          marginTop: theme.spacing.sm,
        })}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>{label}</Text>
        )}
      </Pressable>
    );
  }

  let body: React.ReactNode;

  if (!adminToken) {
    body = (
      <View style={{ gap: theme.spacing.sm }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
          Set an admin token before renewing the Telegram session.
        </Text>
        <Pressable
          onPress={() => {
            handleClose();
            onRequireToken();
          }}>
          <Text style={{ ...theme.typography.body, color: theme.colors.accentBlue, fontWeight: '600' }}>
            Set admin token
          </Text>
        </Pressable>
      </View>
    );
  } else if (step === 'phone') {
    body = (
      <View>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted, marginBottom: 6 }}>
          Phone number (optional — uses the configured account if left blank)
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 555 5555"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="phone-pad"
          style={inputStyle}
        />
        <PrimaryButton label="Send code" onPress={handleStart} />
      </View>
    );
  } else if (step === 'code') {
    body = (
      <View>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted, marginBottom: 6 }}>
          Enter the code sent to the Telegram account
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="12345"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="number-pad"
          style={inputStyle}
        />
        <PrimaryButton label="Verify" onPress={handleComplete} disabled={!code.trim()} />
        {errorMsg ? (
          <Pressable onPress={reset} style={{ marginTop: theme.spacing.xs }}>
            <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>Start over</Text>
          </Pressable>
        ) : null}
      </View>
    );
  } else if (step === 'password') {
    body = (
      <View>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted, marginBottom: 6 }}>
          This account has two-factor authentication enabled. Enter the password.
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="2FA password"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          style={inputStyle}
        />
        <PrimaryButton label="Verify" onPress={handleComplete} disabled={!password.trim()} />
        {errorMsg ? (
          <Pressable onPress={reset} style={{ marginTop: theme.spacing.xs }}>
            <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>Start over</Text>
          </Pressable>
        ) : null}
      </View>
    );
  } else {
    body = (
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.accentSuccess,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Check size={22} color="#fff" strokeWidth={3} />
        </View>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>
          Telegram session renewed
        </Text>
        <PrimaryButton label="Done" onPress={handleClose} />
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={handleClose}>
        <Pressable>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderBottomWidth: 0,
              borderColor: theme.colors.border,
              padding: theme.spacing.lg,
              paddingBottom: 40,
              gap: theme.spacing.sm,
            }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>
              Renew Telegram session
            </Text>

            {body}

            {errorMsg ? (
              <Text style={{ ...theme.typography.meta, color: theme.colors.accentError }}>{errorMsg}</Text>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
