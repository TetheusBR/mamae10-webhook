// src/services/webhooks/cakto.ts
import express from 'express';
import { subscriptionService } from '../subscriptionService';

export const caktoRouter = express.Router();

/**
 * Webhook da Cakto
 * URL final: https://mamae10-webhook.onrender.com/webhooks/cakto
 * Configure essa URL no painel da Cakto.
 */
caktoRouter.post('/cakto', async (req, res) => {
  console.log('🚀 Webhook Cakto recebido');
  console.log('Headers:', req.headers);
  console.log('Raw body:', JSON.stringify(req.body));

  try {
    // ajuste "event" e "data" conforme o payload real da Cakto
    const event = req.body?.event || req.body?.type;
    const data = req.body?.data || req.body;

    console.log('Event:', event);
    console.log('Data extraída:', data);

    // tenta achar o email em diferentes campos comuns
    const email: string | undefined =
      data?.customer_email ||
      data?.email ||
      data?.buyer_email ||
      data?.client_email;

    // identifica o produto/plano para mapear quantidade de dias
    const productId: string | undefined =
      data?.plan_id ||
      data?.product_id ||
      data?.offer_slug;

    if (!email) {
      console.warn('Webhook Cakto sem e-mail identificável');
      return res
        .status(400)
        .json({ success: false, message: 'Email ausente no webhook da Cakto' });
    }

    let result: { success: boolean; message: string };

    switch (event) {
      case 'payment_approved':
      case 'charge_approved':
        result = await subscriptionService.handlePaymentApproved({
          email,
          provider: 'cakto',
          productId
        });
        break;

      case 'subscription_created':
        result = await subscriptionService.handleSubscriptionCreated({
          email,
          provider: 'cakto',
          productId
        });
        break;

      case 'subscription_renewed':
        result = await subscriptionService.handleSubscriptionRenewed({
          email,
          provider: 'cakto',
          productId
        });
        break;

      case 'payment_failed':
        result = subscriptionService.handlePaymentFailed({
          email,
          provider: 'cakto',
          productId
        });
        break;

      case 'subscription_canceled':
        result = subscriptionService.handleSubscriptionCanceled({
          email,
          provider: 'cakto',
          productId
        });
        break;

      case 'subscription_expired':
        result = subscriptionService.handleSubscriptionExpired({
          email,
          provider: 'cakto',
          productId
        });
        break;

      case 'refund_issued':
        result = subscriptionService.handleRefundIssued({
          email,
          provider: 'cakto',
          productId
        });
        break;

      default:
        console.log('Evento Cakto não tratado, ignorando:', event);
        return res
          .status(200)
          .json({ success: true, message: `Evento ignorado: ${String(event)}` });
    }

    console.log('Processamento Cakto concluído:', result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Erro no webhook Cakto:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Erro interno no webhook Cakto' });
  }
});
