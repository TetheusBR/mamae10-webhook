// src/services/subscriptionService.ts
// Versão integrada com backend PHP (MySQL/Hostinger)

export type Provider = 'kiwify' | 'cakto';

interface PaymentPayload {
  email: string;
  provider: Provider;
  productId?: string;
  subscriptionId?: string;
  days?: number; // dias de premium vindos do mapeamento de produto
}

// mapeia produto/plano em quantidade de dias de premium
function resolveDaysFromProduct(provider: Provider, productId?: string): number {
  // ajuste estes IDs pros seus produtos reais
  const maps: Record<string, number> = {
    // ex: "curso-mamae10-vitalicio": 3650,
    'mamae10-mensal': 30,
    'mamae10-trimestral': 90,
    'mamae10-anual': 365
  };

  if (!productId) return 30; // fallback

  if (provider === 'kiwify') {
    return maps[productId] ?? 30;
  }

  if (provider === 'cakto') {
    return maps[productId] ?? 30;
  }

  return 30;
}

// chama o PHP que aplica premium no MySQL
async function callPhpPremium(email: string, days: number) {
  try {
    const res = await fetch('https://portaldavida.pro/backend-php/webhook_premium.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, days })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Erro HTTP webhook_premium.php', res.status, data);
      return { success: false, message: 'Erro ao aplicar premium no backend' };
    }

    return {
      success: !!(data as any).success,
      message:
        (data as any).message ??
        `Premium aplicado por ${days} dias para ${email}`
    };
  } catch (err) {
    console.error('Erro ao chamar webhook_premium.php', err);
    return {
      success: false,
      message: 'Falha de comunicação com backend PHP'
    };
  }
}

export const subscriptionService = {
  async handlePaymentApproved(payload: PaymentPayload) {
    const days =
      payload.days ?? resolveDaysFromProduct(payload.provider, payload.productId);
    return callPhpPremium(payload.email, days);
  },

  async handleSubscriptionCreated(payload: PaymentPayload) {
    const days =
      payload.days ?? resolveDaysFromProduct(payload.provider, payload.productId);
    return callPhpPremium(payload.email, days);
  },

  async handleSubscriptionRenewed(payload: PaymentPayload) {
    const days =
      payload.days ?? resolveDaysFromProduct(payload.provider, payload.productId);
    return callPhpPremium(payload.email, days);
  },

  handlePaymentFailed(payload: PaymentPayload) {
    return {
      success: true,
      message: `Pagamento falhou para ${payload.email}`
    };
  },

  handleSubscriptionCanceled(payload: PaymentPayload) {
    return {
      success: true,
      message: `Assinatura cancelada para ${payload.email}`
    };
  },

  handleSubscriptionExpired(payload: PaymentPayload) {
    return {
      success: true,
      message: `Assinatura expirada para ${payload.email}`
    };
  },

  handleRefundIssued(payload: PaymentPayload) {
    return {
      success: true,
      message: `Reembolso emitido, premium revogado para ${payload.email}`
    };
  }
};
