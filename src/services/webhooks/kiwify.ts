// src/services/webhooks/kiwify.ts
import express from 'express';
import { subscriptionService } from '../subscriptionService';

export const kiwifyRouter = express.Router();

// garante parsing de JSON para esse router
kiwifyRouter.use(express.json());

/**
 * Webhook da Kiwify
 * URL final: https://seu-dominio.com/webhooks/kiwify
 * Configure essa URL no painel da Kiwify.
 */
kiwifyRouter.post('/kiwify', async (req, res) => {
  try {
    // ajuste "event" e "data" conforme o payload real da Kiwify
    const event = req.body?.event || req.body?.type;
    const data = req.body?.data || req.body;

    // tenta achar o email em diferentes campos comuns
    const email: string | undefined =
      data?.buyer_email ||
      data?.email ||
      data?.customer_email ||
      data?.client_email;

    // identifica o produto/plano para mapear quantidade de dias
    const productId: string | undefined =
      data?.product_slug ||
      data?.product_id ||
      data?.offer_slug ||
      data?.plan_id;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Email ausente no webhook da Kiwify' });
    }

    let result: { success: boolean; message: string };

    switch (event) {
      case 'payment_approved':
      case 'charge_approved':
        // pagamento único aprovado
        result = await subscriptionService.handlePaymentApproved({
          email,
          provider: 'kiwify',
          productId
        });
        break;

      case 'subscription_created':
        // início de assinatura
        result = await subscriptionService.handleSubscriptionCreated({
          email,
          provider: 'kiwify',
          productId
        });
        break;

      case 'subscription_renewed':
        // renovação recorrente
        result = await subscriptionService.handleSubscriptionRenewed({
          email,
          provider: 'kiwify',
          productId
        });
        break;

      case 'payment_failed':
        result = subscriptionService.handlePaymentFailed({
          email,
          provider: 'kiwify',
          productId
        });
        break;

      case 'subscription_canceled':
        result = subscriptionService.handleSubscriptionCanceled({
          email,
          provider: 'kiwify',
          productId
        });
        break;

      case 'subscription_expired':
        result = subscriptionService.handleSubscriptionExpired({
          email,
          provider: 'kiwify',
          productId
        });
        break;

      case 'refund_issued':
        result = subscriptionService.handleRefundIssued({
          email,
          provider: 'kiwify',
          productId
        });
        break;

      default:
        // qualquer evento que você não trata explicitamente
        return res
          .status(200)
          .json({ success: true, message: `Evento ignorado: ${String(event)}` });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Erro no webhook Kiwify:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no webhook Kiwify' });
  }
});
