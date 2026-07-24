import { Experience, Skill } from '@/types/resume';

function formatPeriod(startDate?: string, endDate?: string, current?: boolean): string {
  const start = startDate ? formatDate(startDate) : '';
  const end = current ? 'o momento' : endDate ? formatDate(endDate) : '';
  if (start && end) return `de ${start} a ${end}`;
  if (start) return `desde ${start}`;
  return '';
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month] = dateString.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  if (!year || !month) return dateString;
  return `${months[parseInt(month) - 1]}/${year}`;
}

function cleanText(text?: string): string {
  return (text || '').trim().replace(/\s+/g, ' ');
}

const professionPhrases: Record<string, string> = {
  'Administrador': 'Administrar rotinas operacionais, otimizar processos internos e apoiar a gestão estratégica para aumentar a eficiência organizacional.',
  'Advogado': 'Atuar na análise jurídica de casos, elaborar peças processuais e acompanhar demandas legais com foco em resultados e compliance.',
  'Analista de Dados': 'Coletar, tratar e analisar bases de dados para gerar insights acionáveis que apoiem a tomada de decisão e melhores práticas de negócio.',
  'Analista de Marketing': 'Planejar e executar ações de marketing digital, acompanhar métricas de campanhas e otimizar resultados de aquisição e retenção.',
  'Analista de RH': 'Gerenciar processos de recrutamento, seleção e desenvolvimento de pessoas, promovendo uma cultura organizacional saudável e produtiva.',
  'Arquiteto': 'Desenvolver projetos arquitetônicos, coordenar equipes técnicas e acompanhar obras para garantir qualidade e conformidade.',
  'Assistente Administrativo': 'Apoiar rotinas administrativas, organizar documentos e atender demandas internas com agilidade e comprometimento.',
  'Assistente de Recursos Humanos': 'Auxiliar nos processos de RH, organizar currículos, agendar entrevistas e apoiar a integração de colaboradores.',
  'Auxiliar de Escritório': 'Realizar atividades de apoio administrativo, organizar arquivos e contribuir para o bom funcionamento do escritório.',
  'Cientista de Dados': 'Criar modelos preditivos, analisar grandes volumes de dados e transformar informações complexas em insights estratégicos.',
  'Consultor': 'Identificar oportunidades de melhoria, propor soluções estratégicas e acompanhar a implementação de projetos de consultoria.',
  'Contador': 'Gerenciar rotinas contábeis, fiscais e tributárias, garantindo conformidade legal e apoiando a saúde financeira da empresa.',
  'Desenvolvedor Backend': 'Desenvolver e manter APIs e serviços robustos, otimizar performance e garantir escalabilidade de sistemas.',
  'Desenvolvedor Frontend': 'Criar interfaces modernas e responsivas, garantir boa experiência do usuário e integrar com serviços backend.',
  'Desenvolvedor Full Stack': 'Atuar no desenvolvimento completo de aplicações web, desde interfaces até APIs, entregando soluções escaláveis.',
  'Designer Gráfico': 'Criar peças visuais para comunicação digital e impressa, alinhadas à identidade da marca e objetivos de campanha.',
  'Designer UX/UI': 'Projetar experiências e interfaces intuitivas, conduzir pesquisas com usuários e otimizar fluxos de conversão.',
  'Digitador': 'Digitar e revisar documentos com rapidez e precisão, organizar arquivos e apoiar rotinas administrativas.',
  'Editor de Vídeo': 'Editar vídeos para redes sociais, publicidade e conteúdos corporativos, garantindo qualidade visual e narrativa envolvente.',
  'Eletricista': 'Executar instalações, manutenções e reparos elétricos seguindo normas técnicas e padrões de segurança.',
  'Enfermeiro': 'Prestar assistência de enfermagem com humanização, realizar procedimentos técnicos e apoiar a recuperação dos pacientes.',
  'Engenheiro Civil': 'Gerenciar projetos e obras civis, coordenar equipes multidisciplinares e garantir qualidade, prazo e segurança.',
  'Engenheiro de Produção': 'Otimizar processos produtivos, reduzir desperdícios e aumentar a eficiência operacional com foco em resultados.',
  'Engenheiro de Software': 'Projetar arquiteturas de software, liderar soluções técnicas e garantir qualidade em grandes aplicações.',
  'Farmacêutico': 'Dispensar medicamentos, orientar pacientes e colaborar com a equipe multidisciplinar para segurança do uso de fármacos.',
  'Fisioterapeuta': 'Avaliar e tratar pacientes com técnicas fisioterapêuticas, promovendo reabilitação, conforto e qualidade de vida.',
  'Fotógrafo': 'Realizar ensaios fotográficos, coberturas de eventos e produções visuais com criatividade e qualidade técnica.',
  'Gerente Comercial': 'Liderar equipes comerciais, definir estratégias de vendas e impulsionar resultados de receita e expansão de mercado.',
  'Gerente de Projetos': 'Planejar, executar e controlar projetos, gerenciando prazos, custos e equipes para entrega de resultados.',
  'Jornalista': 'Produzir conteúdos jornalísticos para diversas plataformas, pesquisar fatos e apurar informações com ética e precisão.',
  'Médico': 'Realizar atendimentos clínicos, diagnosticar condições e prescrever tratamentos com foco na saúde e bem-estar do paciente.',
  'Nutricionista': 'Elaborar planos alimentares personalizados, promover hábitos saudáveis e acompanhar a evolução dos pacientes.',
  'Operador de Caixa': 'Atender clientes no ponto de venda, operar sistemas de caixa e garantir a precisão das transações financeiras.',
  'Padeiro': 'Preparar pães e produtos de panificação com qualidade, higiene e cumprimento de padrões de produção.',
  'Pedagogo': 'Desenvolver práticas pedagógicas, acompanhar alunos e colaborar para uma educação inclusiva e de qualidade.',
  'Professor': 'Ministrar aulas, planejar conteúdos e avaliar alunos de forma a promover aprendizado significativo.',
  'Psicólogo': 'Realizar atendimentos psicológicos, avaliar demandas emocionais e apoiar o bem-estar e desenvolvimento pessoal.',
  'Recepcionista': 'Atender visitantes e clientes, gerenciar agendas e prestar suporte administrativo na recepção.',
  'Redator': 'Criar textos para blogs, sites, campanhas e peças publicitárias, adaptando o tom à estratégia de comunicação.',
  'Representante Comercial': 'Prospectar clientes, negociar propostas e fechar vendas para expansão da carteira e crescimento da receita.',
  'Secretária': 'Organizar agenda, atender chamadas e apoiar executivos nas rotinas administrativas do dia a dia.',
  'Segurança': 'Monitorar ambientes, prevenir riscos e garantir a segurança de pessoas, bens e instalações.',
  'Técnico de Enfermagem': 'Auxiliar em procedimentos de enfermagem, acompanhar pacientes e manter protocolos de higiene e segurança.',
  'Técnico de Informática': 'Realizar manutenção de computadores, redes e sistemas, prestando suporte técnico aos usuários.',
  'Técnico em Segurança do Trabalho': 'Inspecionar condições de trabalho, promover prevenção de acidentes e garantir conformidade com normas de segurança.',
  'Tradutor': 'Traduzir textos e conteúdos com precisão, respeitando nuances culturais e terminologia de cada área.',
  'Vendedor': 'Atender clientes, apresentar produtos e fechar vendas para atingir metas e fidelizar a base de consumidores.',
  'Vigilante': 'Circular em áreas de vigilância, prevenir incidentes e garantir a ordem e a segurança do patrimônio.',
};

function getProfessionPhrase(profession?: string): string {
  if (!profession) return 'Atuar com dedicação e responsabilidade, contribuindo para os resultados e o crescimento da equipe.';
  return professionPhrases[profession] || `Atuar como ${profession}, contribuindo com conhecimento técnico, proatividade e foco em resultados para o time e a organização.`;
}

export function generateExperienceDescription(
  profession: string,
  company: string,
  startDate?: string,
  endDate?: string,
  current?: boolean,
  rawText?: string
): string {
  const base = cleanText(rawText);
  const period = formatPeriod(startDate, endDate, current);
  const phrase = getProfessionPhrase(profession);
  let text = `${phrase}`;
  if (company) text = text.replace(/\.$/, '') + ` na ${company}.`;
  if (period) text += ` Atuação ${period}.`;
  if (base && base.length > 10) {
    text += ` Destaques incluem ${base.toLowerCase()}.`;
  }
  return text;
}

const degreePhrases: Record<string, string> = {
  'Ensino Médio': 'Formação completa no ensino médio com bases sólidas para ingresso no mercado de trabalho.',
  'Técnico': 'Formação técnica com foco prático e habilidades específicas para atuar de forma operacional na área.',
  'Tecnólogo': 'Graduação tecnológica voltada para aplicação prática e rápida inserção no mercado profissional.',
  'Bacharelado': 'Graduação completa em bacharelado com formação teórica e prática sólida na área escolhida.',
  'Licenciatura': 'Formação em licenciatura preparada para atuar na educação e no desenvolvimento de estudantes.',
  'Pós-graduação': 'Especialização com aprofundamento teórico e prático para atuação diferenciada na área.',
  'MBA': 'MBA com foco em gestão, estratégia e liderança para apoiar a tomada de decisão em negócios.',
  'Mestrado': 'Mestrado com formação acadêmica aprofundada e capacidade de pesquisa e análise crítica.',
  'Doutorado': 'Doutorado com alta especialização e produção acadêmica na área de conhecimento.',
  'Especialização': 'Especialização com foco prático e atualização profissional na área de atuação.',
};

function getDegreePhrase(degree?: string, field?: string): string {
  let base = degree ? degreePhrases[degree] : 'Formação acadêmica com conhecimentos sólidos na área escolhida.';
  if (field) base = base.replace('na área escolhida.', `em ${field}.`).replace('na área.', `em ${field}.`).replace('área de atuação.', `${field}.`);
  return base;
}

export function generateEducationDescription(
  degree: string,
  field: string,
  institution: string,
  startDate?: string,
  endDate?: string,
  current?: boolean,
  rawText?: string
): string {
  let text = getDegreePhrase(degree, field);
  if (institution) {
    text = text.replace(/\.$/, '') + ` na ${institution}.`;
  }
  const period = formatPeriod(startDate, endDate, current);
  if (period) text += ` Período ${period}.`;
  const base = cleanText(rawText);
  if (base && base.length > 10) {
    text += ` ${base}`;
  }
  return text;
}

export function generateProfessionalSummary(
  experience: Experience[],
  skills: Skill[],
  profession?: string
): string {
  if (experience.length === 0) return '';
  const main = experience[0];
  const topSkills = skills.slice(0, 4).map((s) => s.name).join(', ');
  const role = profession || main.position || 'Profissional';
  const expYears = main.startDate ? `${new Date().getFullYear() - parseInt(main.startDate.split('-')[0])}` : 'vários';
  return `${role} com ${expYears} anos de experiência em ${main.company || 'empresas do setor'}, com sólidos conhecimentos em ${topSkills || 'suas áreas de atuação'}. Busca novas oportunidades para aplicar sua expertise, contribuir com resultados e crescer profissionalmente.`;
}
