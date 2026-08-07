import { NextResponse } from 'next/server';
import { getLeadsForReengagement, markReengagementSent } from '@/lib/postgres';
import { sendEmailWithRetry, getFromEmail, getAppUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

const STAGES = [
  {
    id: 'resume' as const,
    subject: 'Seu currículo está quase pronto — volte e termine em poucos minutos',
    content: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Não deixe seu currículo na metade!</h2>
        <p>Olá ${name || ''},</p>
        <p>Você começou a criar seu currículo com a gente e está a poucos cliques de terminar. Nosso gerador com IA já preenche as seções mais importantes para você.</p>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${getAppUrl()}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Continuar meu currículo</a>
        </p>
        <p style="font-size: 12px; color: #6b7280;">
          Este e-mail foi enviado porque você concordou em receber comunicações. Para não receber mais, responda pedindo o descadastro.
        </p>
      </div>
    `,
  },
  {
    id: 'survey' as const,
    subject: 'O que impediu você de finalizar seu currículo?',
    content: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Queremos entender</h2>
        <p>Olá ${name || ''},</p>
        <p>Notamos que você não finalizou seu currículo. Conta pra gente rapidamente o que aconteceu? Sua resposta nos ajuda muito a melhorar.</p>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${getAppUrl()}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Responder em 1 clique</a>
        </p>
        <p style="font-size: 12px; color: #6b7280;">
          Respondeu? Ótimo. Ainda dá tempo de voltar e terminar quando quiser. Para descadastro, responda este e-mail pedindo remoção.
        </p>
      </div>
    `,
  },
];

export async function GET() {
  const start = Date.now();
  const results: { stage: string; sent: number; failed: number }[] = [];

  for (const stage of STAGES) {
    const leads = await getLeadsForReengagement(stage.id, 100);
    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      try {
        const result = await sendEmailWithRetry({
          from: getFromEmail(),
          to: lead.email,
          subject: stage.subject,
          html: stage.content(lead.name),
        });

        if (result.success) {
          await markReengagementSent(lead.id, stage.id, true);
          sent++;
        } else {
          await markReengagementSent(lead.id, stage.id, false);
          failed++;
        }
      } catch (err) {
        console.error('[cron/reengagement] unexpected error', { leadId: lead.id, stage: stage.id, err });
        failed++;
      }
    }

    results.push({ stage: stage.id, sent, failed });
  }

  console.log('[cron/reengagement] finished', {
    durationMs: Date.now() - start,
    results,
  });

  return NextResponse.json({ ok: true, results });
}
