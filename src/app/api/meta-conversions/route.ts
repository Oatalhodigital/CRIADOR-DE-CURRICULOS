import { NextRequest, NextResponse } from 'next/server';
import {
  trackMetaLeadServerSide,
  trackMetaInitiateCheckoutServerSide,
  trackMetaPurchaseServerSide,
} from '@/lib/metaConversionsApi';
import { getAppUrl } from '@/lib/email';

/**
 * Rota server-side para disparar eventos da Meta Conversions API.
 * Permite que o frontend dispare eventos server-side quando necessário,
 * complementando o pixel client-side com deduplicação por event_id.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body || {};

    if (!event) {
      return NextResponse.json({ error: 'event é obrigatório.' }, { status: 400 });
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const fbp = request.cookies.get('_fbp')?.value || data?.fbp;
    const fbc = request.cookies.get('_fbc')?.value || data?.fbc;
    const sourceUrl = getAppUrl();

    let result;

    switch (event) {
      case 'Lead':
        result = await trackMetaLeadServerSide({
          email: data?.email,
          phone: data?.phone,
          firstName: data?.firstName,
          lastName: data?.lastName,
          sourceUrl,
          fbp,
          fbc,
          clientIp,
          userAgent,
          eventId: data?.eventId,
        });
        break;

      case 'InitiateCheckout':
        result = await trackMetaInitiateCheckoutServerSide({
          value: data?.value || 0,
          plan: data?.plan || 'unknown',
          sourceUrl,
          fbp,
          fbc,
          clientIp,
          userAgent,
          eventId: data?.eventId,
        });
        break;

      case 'Purchase':
        result = await trackMetaPurchaseServerSide({
          paymentId: data?.paymentId,
          value: data?.value || 0,
          plan: data?.plan,
          paymentMethod: data?.paymentMethod,
          email: data?.email,
          phone: data?.phone,
          sourceUrl,
          fbp,
          fbc,
          clientIp,
          userAgent,
        });
        break;

      default:
        return NextResponse.json({ error: `Evento não suportado: ${event}` }, { status: 400 });
    }

    if (result?.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      console.error('[api/meta-conversions] event failed', { event, error: result?.error });
      return NextResponse.json({ success: false, error: result?.error || 'unknown' }, { status: 200 });
    }
  } catch (err) {
    console.error('[api/meta-conversions] error', err);
    return NextResponse.json({ error: 'Erro ao processar evento.' }, { status: 500 });
  }
}
