import { useStellarAuth } from "@/contexts/StellarAuthContext";
import StellarLayout from "@/components/StellarLayout";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Target,
  ClipboardList,
  UserCheck,
  Users,
  BarChart3,
  Award,
  Zap,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";

// ─── FASES DO CICLO ──────────────────────────────────────────────────────────

const FASES = [
  {
    id: 1,
    icone: Target,
    titulo: "Contratação de Metas",
    periodo: "Início do semestre",
    objetivo:
      "Definir as metas individuais do semestre que serão a base para o cálculo de bônus. Metas devem ser específicas, mensuráveis e alinhadas com os objetivos da área.",
    cor: "#1840eb",
    corBg: "#1840eb15",
    corBorda: "#1840eb40",
    gestor: [
      "Alinhar as metas do time com os objetivos estratégicos da área",
      "Contratar individualmente as metas com cada liderado",
      "Garantir que as metas sejam desafiadoras, mas alcançáveis",
      "Registrar as metas formalmente na plataforma",
    ],
    colaborador: [
      "Participar ativamente da construção das próprias metas",
      "Questionar e negociar metas que não reflitam a realidade",
      "Confirmar o entendimento e aceitar o compromisso formalmente",
      "Acompanhar o progresso ao longo do semestre",
    ],
    rh: [
      "Garantir que 100% dos colaboradores tenham metas registradas",
      "Orientar gestores sobre boas práticas de contratação de metas",
      "Auditar a qualidade e desafio das metas definidas",
      "Separar claramente a lógica de bônus da lógica de AVD",
    ],
    destaque:
      "Bônus e AVD são lógicas distintas. O bônus responde se a meta foi batida. O ciclo de performance avalia como a pessoa performou e qual é o seu potencial.",
  },
  {
    id: 2,
    icone: ClipboardList,
    titulo: "Autoavaliação",
    periodo: "Julho/2026",
      objetivo:
        "Cada colaborador e gestor reflete sobre sua própria performance e cultura ao longo do semestre, respondendo 8 perguntas-âncora divididas em dois eixos: Cultura (comportamento/valores) e Performance (entrega/resultado).",
    cor: "#d9f22a",
    corBg: "#d9f22a15",
    corBorda: "#d9f22a40",
    gestor: [
      "Realizar a própria autoavaliação com honestidade e evidências concretas",
      "Responder os 4 critérios de Cultura: Ambição, Sonhar Grande, Accountability, Juntos Somos Mais Fortes",
      "Responder os 4 critérios de Performance: Qualidade, Contribuição, Adaptação, Uso de IA",
      "Adicionar comentários com exemplos reais para cada critério",
    ],
    colaborador: [
      "Realizar a autoavaliação com base em evidências do semestre, não em percepção",
      "Responder os 8 critérios com exemplos concretos no campo de comentário",
      "Ser honesto sobre pontos de desenvolvimento, não apenas sobre pontos fortes",
      "Submeter a avaliação dentro do prazo estabelecido",
    ],
    rh: [
      "Garantir que 100% dos colaboradores e gestores realizem a autoavaliação",
      "Monitorar o progresso de preenchimento em tempo real",
      "Enviar lembretes para quem ainda não iniciou ou não submeteu",
      "Suportar dúvidas sobre os critérios de avaliação",
    ],
    destaque:
      "A autoavaliação não define o posicionamento final no 9-Box. Ela é uma entrada para a conversa com o gestor e para o processo de calibração.",
  },
  {
    id: 3,
    icone: UserCheck,
    titulo: "Avaliação do Líder",
    periodo: "Julho/2026",
    objetivo:
      "O gestor avalia cada um dos seus reports diretos nos mesmos 8 critérios da autoavaliação. O posicionamento no 9-Box é calculado automaticamente pela plataforma com base nas respostas do gestor.",
    cor: "#a855f7",
    corBg: "#a855f715",
    corBorda: "#a855f740",
    gestor: [
      "Avaliar cada liderado com base em evidências observadas ao longo do semestre",
      "Usar o Modo Simulação do 9-Box para testar hipóteses antes de submeter",
      "Adicionar comentários ricos por critério para embasar o feedback",
      "Submeter todas as avaliações antes do prazo de pré-calibração",
    ],
    colaborador: [
      "Aguardar a avaliação do gestor. Nenhuma ação necessária nesta fase",
      "Continuar registrando flash feedbacks e acompanhando o desenvolvimento",
      "Preparar-se para a conversa de devolutiva com o gestor",
    ],
    rh: [
      "Monitorar o progresso das avaliações por gestor e área",
      "Identificar gestores com avaliações pendentes e acionar proativamente",
      "Verificar consistência entre autoavaliação e avaliação do gestor",
      "Preparar o material para a sessão de pré-calibração",
    ],
    destaque:
      "O posicionamento no 9-Box é sempre calculado pelas respostas, nunca por movimentação manual do gestor. A movimentação manual é exclusiva do RH no comitê de calibração.",
  },
  {
    id: 4,
    icone: Users,
    titulo: "Pré-Calibração com N1 e N2",
    periodo: "Agosto/2026",
    objetivo:
      "O RH conduz sessões individuais com cada gestor para revisar os posicionamentos do time antes do comitê coletivo. É o momento de alinhar critérios, identificar inconsistências e preparar o gestor para defender suas avaliações.",
    cor: "#f97316",
    corBg: "#f9731615",
    corBorda: "#f9731640",
    gestor: [
      "Participar da sessão de pré-calibração com o RH",
      "Apresentar e defender os posicionamentos do time com evidências",
      "Revisar posicionamentos que o RH identificar como inconsistentes",
      "Preparar os argumentos para o comitê coletivo de calibração",
    ],
    colaborador: [
      "Não há participação direta nesta fase",
      "Manter o foco na entrega e no desenvolvimento contínuo",
    ],
    rh: [
      "Conduzir sessões individuais de pré-calibração com cada gestor",
      "Questionar posicionamentos que pareçam inflados ou inconsistentes",
      "Garantir que a curva de área de cada time esteja dentro do esperado (10/60/30)",
      "Identificar talentos que precisam de visibilidade no comitê coletivo",
    ],
    destaque:
      "A pré-calibração é o filtro de qualidade antes do comitê. Gestores que chegam sem evidências sólidas comprometem a credibilidade do processo.",
  },
  {
    id: 5,
    icone: BarChart3,
    titulo: "Calibração Coletiva",
    periodo: "Agosto/2026",
    objetivo:
      "Fórum coletivo de visibilidade de talentos. Os gestores apresentam seus times e o RH facilita a discussão para garantir consistência nos critérios, identificar talentos cross-área e alinhar os posicionamentos finais no 9-Box.",
    cor: "#22c55e",
    corBg: "#22c55e15",
    corBorda: "#22c55e40",
    gestor: [
      "Participar do comitê de calibração com o time de gestores",
      "Apresentar os posicionamentos do time e defender com evidências",
      "Contribuir com a visibilidade de talentos de outras áreas que conhece",
      "Aceitar ajustes nos posicionamentos decididos coletivamente",
    ],
    colaborador: [
      "Não há participação direta nesta fase",
      "Os posicionamentos são discutidos sem a presença dos colaboradores",
    ],
    rh: [
      "Criar e gerenciar as salas de comitê de calibração na plataforma",
      "Incluir os gestores participantes em cada sala",
      "Facilitar a discussão garantindo critérios consistentes entre áreas",
      "Realizar ajustes manuais nos posicionamentos do 9-Box quando necessário",
      "Garantir que a curva final da empresa esteja dentro do esperado",
    ],
    destaque:
      "Somente o RH pode mover colaboradores no 9-Box durante o comitê de calibração. Essa movimentação é registrada com nota de justificativa.",
  },
  {
    id: 6,
    icone: Award,
    titulo: "Gestão de Consequências",
    periodo: "Setembro/2026",
    objetivo:
      "Com os posicionamentos finais definidos, o RH e os gestores definem o budget de mérito, promoções e ações de desenvolvimento para cada quadrante. Cada quadrante tem uma gestão de consequência específica.",
    cor: "#eab308",
    corBg: "#eab30815",
    corBorda: "#eab30840",
    gestor: [
      "Receber o posicionamento final do time após a calibração",
      "Usar a IA da plataforma para estruturar o feedback de cada liderado",
      "Preparar a devolutiva individual com base no quadrante e nas evidências",
      "Enviar o relatório de devolutiva para cada colaborador pela plataforma",
    ],
    colaborador: [
      "Aguardar a devolutiva do gestor na plataforma",
      "Visualizar o posicionamento no 9-Box com descrição do quadrante",
      "Entender a gestão de consequência do seu quadrante (mérito, promoção, bônus)",
      "Usar a devolutiva como base para o PDI do próximo semestre",
    ],
    rh: [
      "Definir o budget total de mérito e promoções com a liderança",
      "Garantir que todos os colaboradores recebam a devolutiva",
      "Monitorar o envio das devolutivas pelos gestores",
      "Consolidar as ações de desenvolvimento por quadrante",
    ],
    destaque:
      "A gestão de consequência é por quadrante, não por nota. Q9 e Q8 têm mérito e promoção. Q7 e Q3 têm bônus por meta, mas sem mérito. Q1 não tem bônus.",
  },
  {
    id: 7,
    icone: Zap,
    titulo: "Flash Feedbacks Contínuos",
    periodo: "Durante todo o semestre",
    objetivo:
      "Conversas rápidas e estruturadas entre gestor e colaborador ao longo do semestre. Não substituem a avaliação formal, mas garantem que o desenvolvimento aconteça em tempo real, sem esperar o ciclo anual.",
    cor: "#d9f22a",
    corBg: "#d9f22a10",
    corBorda: "#d9f22a30",
    gestor: [
      "Agendar flash feedbacks regulares com cada liderado conforme periodicidade do quadrante",
      "Formalizar o conteúdo do feedback e o plano de ação na plataforma",
      "Acompanhar o status dos flash feedbacks: realizados, pendentes e atrasados",
      "Usar os flash feedbacks como insumo para a avaliação formal",
    ],
    colaborador: [
      "Agendar flash feedbacks com o gestor quando sentir necessidade",
      "Usar a IA Stella para estruturar a pauta antes de cada reunião",
      "Participar ativamente com exemplos e perguntas concretas",
      "Ter acesso vitalício ao histórico de todos os flash feedbacks realizados",
    ],
    rh: [
      "Monitorar a frequência de flash feedbacks por gestor e time",
      "Identificar gestores com flash feedbacks atrasados ou pendentes",
      "Usar os dados de flash feedbacks como indicador de saúde da liderança",
      "Garantir que a cultura de feedback contínuo seja mantida",
    ],
    destaque:
      "Flash feedbacks atrasados ou não realizados são um sinal de alerta. O RH monitora esse indicador como parte da avaliação da qualidade da liderança.",
    estruturaPauta: [
      { pergunta: "O que está funcionando e precisa continuar?", tempo: "5 min" },
      { pergunta: "Qual é o gap prioritário do próximo trimestre?", tempo: "10 min" },
      { pergunta: "Qual compromisso concreto a pessoa assume?", tempo: "10 min" },
      { pergunta: "O que o gestor vai fazer para viabilizar?", tempo: "5 min" },
    ],
    periodicidadePorQuadrante: [
      { quadrante: "Q9 — Estrela", frequencia: "Mensal", cor: "#22c55e" },
      { quadrante: "Q8 — Talento a Acelerar", frequencia: "Mensal", cor: "#22c55e" },
      { quadrante: "Q7 — Talento Consistente", frequencia: "Bimestral", cor: "#22c55e" },
      { quadrante: "Q6 — Promissor", frequencia: "Bimestral", cor: "#eab308" },
      { quadrante: "Q5 — Mantenedor", frequencia: "Bimestral", cor: "#eab308" },
      { quadrante: "Q4 — Observação", frequencia: "Bimestral", cor: "#eab308" },
      { quadrante: "Q3 — Especialista", frequencia: "Bimestral", cor: "#eab308" },
      { quadrante: "Q2 — Em Desenvolvimento", frequencia: "Mensal", cor: "#ef4444" },
      { quadrante: "Q1 — Crítico", frequencia: "Semanal · Plano de recuperação 30 dias", cor: "#ef4444" },
    ],
  },
];

// ─── CRITÉRIOS DE AVALIAÇÃO ───────────────────────────────────────────────────

const CRITERIOS_PERFORMANCE = [
  {
    nome: "Qualidade e Consistência",
    pergunta: "Como você avalia a consistência e padrão das entregas?",
    abaixo: "Entregas frequentemente incompletas, com erros recorrentes ou abaixo do padrão esperado para o nível.",
    dentro: "Entregas consistentes, dentro do prazo e com qualidade esperada para o cargo.",
    acima: "Entregas excepcionais, com padrão acima do esperado, que servem de referência para o time.",
  },
  {
    nome: "Contribuição para o Negócio",
    pergunta: "Qual foi o impacto real desta pessoa nos resultados?",
    abaixo: "Dificuldade em conectar o próprio trabalho com os objetivos da área ou da empresa.",
    dentro: "Contribui de forma clara para os resultados da área, com impacto mensurável.",
    acima: "Gera impacto além da própria área, influenciando resultados estratégicos da empresa.",
  },
  {
    nome: "Adaptação e Velocidade",
    pergunta: "Como essa pessoa reagiu às mudanças de prioridade?",
    abaixo: "Resistência a mudanças, dificuldade em se adaptar a novos contextos ou prioridades.",
    dentro: "Adapta-se bem às mudanças, ajusta o ritmo e mantém a qualidade das entregas.",
    acima: "Antecipa mudanças, propõe soluções proativamente e acelera a adaptação do time.",
  },
  {
    nome: "Uso de IA e Automação",
    pergunta: "Esta pessoa usou IA ou automação para melhorar o trabalho?",
    abaixo: "Não utiliza ferramentas de IA ou automação disponíveis, mesmo quando seria esperado.",
    dentro: "Utiliza IA e automação de forma consistente para ganhar eficiência no trabalho.",
    acima: "Lidera pelo exemplo no uso de IA, dissemina boas práticas e eleva o nível do time.",
  },
];

const CRITERIOS_POTENCIAL = [
  {
    nome: "Ambição",
    pergunta: "Como essa pessoa expandiu sua entrega além do que foi solicitado?",
    abaixo: "Faz apenas o que é solicitado, sem buscar ir além ou assumir novos desafios.",
    dentro: "Demonstra iniciativa e busca expandir suas responsabilidades de forma consistente.",
    acima: "Constantemente assume desafios maiores, cria oportunidades e inspira o time a ir além.",
  },
  {
    nome: "Sonhar Grande",
    pergunta: "Que evidência existe de que essa pessoa desafiou o status quo?",
    abaixo: "Tende a aceitar o status quo sem questionar ou propor melhorias.",
    dentro: "Questiona processos e propõe melhorias com base em visão de longo prazo.",
    acima: "Desafia o status quo com frequência, propõe inovações que geram impacto real.",
  },
  {
    nome: "Accountability",
    pergunta: "Como essa pessoa lidou com um erro ou falha?",
    abaixo: "Dificuldade em assumir responsabilidade por erros, tende a externalizar causas.",
    dentro: "Assume responsabilidade pelos próprios resultados, aprende com os erros.",
    acima: "Modelo de accountability: assume, aprende, corrige e compartilha aprendizados com o time.",
  },
  {
    nome: "Juntos Somos Mais Fortes",
    pergunta: "Como essa pessoa contribuiu para além de sua própria área?",
    abaixo: "Foco excessivo no próprio escopo, com pouca colaboração cross-funcional.",
    dentro: "Colabora ativamente com outras áreas, contribui para objetivos coletivos.",
    acima: "Referência em colaboração, cria pontes entre áreas e potencializa resultados coletivos.",
  },
];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function CicloOverview() {
  const { user } = useStellarAuth();
  const [, navigate] = useLocation();
  const [faseSelecionada, setFaseSelecionada] = useState<number | null>(1);
  const [criteriosExpandidos, setCriteriosExpandidos] = useState<Record<string, boolean>>({});
  const platformRole = (user as any)?.platformRole ?? "colaborador";

  const fase = FASES.find((f) => f.id === faseSelecionada);

  const roleLabel: Record<string, string> = {
    gestor: "Gestor",
    colaborador: "Colaborador",
    rh: "RH",
  };

  const roleColor: Record<string, string> = {
    gestor: "#1840eb",
    colaborador: "#d9f22a",
    rh: "#a855f7",
  };

  const toggleCriterio = (key: string) => {
    setCriteriosExpandidos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const CriterioCard = ({
    criterio,
    cor,
    corBorda,
    prefix,
  }: {
    criterio: { nome: string; pergunta: string; abaixo: string; dentro: string; acima: string };
    cor: string;
    corBorda: string;
    prefix: string;
  }) => {
    const key = `${prefix}-${criterio.nome}`;
    const aberto = !!criteriosExpandidos[key];
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "#001023", border: `1px solid ${aberto ? corBorda : "#0a3060"}` }}
      >
        <button
          className="w-full flex items-center justify-between p-3 text-left transition-all"
          onClick={() => toggleCriterio(key)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold mb-0.5" style={{ color: cor }}>
              {criterio.nome}
            </p>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>
              {criterio.pergunta}
            </p>
          </div>
          <ChevronDown
            size={14}
            className="flex-shrink-0 ml-2 transition-transform"
            style={{ color: cor, transform: aberto ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {aberto && (
          <div className="px-3 pb-3 space-y-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#ef444415", border: "1px solid #ef444430" }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#ef4444" }}>Abaixo do esperado</p>
              <p className="text-xs" style={{ color: "#8aa3c0" }}>{criterio.abaixo}</p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#eab30815", border: "1px solid #eab30830" }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#eab308" }}>Dentro do esperado</p>
              <p className="text-xs" style={{ color: "#8aa3c0" }}>{criterio.dentro}</p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#22c55e15", border: "1px solid #22c55e30" }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#22c55e" }}>Acima do esperado</p>
              <p className="text-xs" style={{ color: "#8aa3c0" }}>{criterio.acima}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <StellarLayout title="Ciclo de Performance 2.0">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 sm:p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #001830 0%, #001023 60%, #0a0820 100%)",
            border: "1px solid #0a3060",
          }}
        >
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: "#d9f22a", transform: "translate(30%, -30%)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-5 pointer-events-none"
            style={{ background: "#1840eb", transform: "translate(-30%, 30%)" }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: "#d9f22a20", color: "#d9f22a", border: "1px solid #d9f22a40" }}
              >
                Ciclo S1/2026
              </div>
              <div
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40" }}
              >
                Ativo · Encerra em 31/07/2026
              </div>
            </div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight"
              style={{ color: "#fdffdf" }}
            >
              Ciclo de Performance 2.0
              <span style={{ color: "#d9f22a" }}> Stellar Gaming</span>
            </h1>
            <p className="text-base max-w-2xl mb-6" style={{ color: "#8aa3c0" }}>
              Aqui a performance é medida com critério, não com intenção. Sete fases estruturadas para garantir que as pessoas certas sejam reconhecidas, desenvolvidas e aceleradas. As decisões são tomadas com dados, não com feeling.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Fases do ciclo", valor: "7" },
                { label: "Critérios de avaliação", valor: "8" },
                { label: "Curva esperada de talentos", valor: "30%" },
                { label: "Curva esperada críticos", valor: "10%" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}
                >
                  <p className="text-2xl font-black" style={{ color: "#d9f22a" }}>{s.valor}</p>
                  <p className="text-xs" style={{ color: "#8aa3c0" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Separação Bônus vs AVD ─────────────────────────────────────────── */}
        <div
          className="rounded-xl p-5 flex flex-col md:flex-row gap-4"
          style={{ backgroundColor: "#001830", border: "1px solid #0a3060" }}
        >
          <div className="flex-1 p-4 rounded-xl" style={{ backgroundColor: "#1840eb10", border: "1px solid #1840eb30" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#7ba7ff" }}>Bônus</p>
            <p className="text-sm font-semibold mb-1" style={{ color: "#fdffdf" }}>Responde se a meta foi batida</p>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>
              Calculado com base na meta contratada no início do semestre. Lógica binária: bateu ou não bateu.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center text-2xl font-black" style={{ color: "#0a3060" }}>
            ≠
          </div>
          <div className="flex-1 p-4 rounded-xl" style={{ backgroundColor: "#d9f22a10", border: "1px solid #d9f22a30" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#d9f22a" }}>AVD: Ciclo de Performance</p>
            <p className="text-sm font-semibold mb-1" style={{ color: "#fdffdf" }}>Avalia como a pessoa performou e qual é a sua cultura</p>
            <p className="text-xs" style={{ color: "#8aa3c0" }}>
              Medido em dois eixos independentes: Cultura (comportamento/valores) e Performance (entrega/resultado).
            </p>
          </div>
        </div>

        {/* ── Fases do Ciclo ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#fdffdf" }}>
            As 7 Fases do Ciclo
          </h2>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Lista de fases */}
            <div className="flex flex-col gap-2 lg:w-72 flex-shrink-0">
              {FASES.map((f, idx) => {
                const Icon = f.icone;
                const ativa = faseSelecionada === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFaseSelecionada(ativa ? null : f.id)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: ativa ? f.corBg : "#001830",
                      border: `1px solid ${ativa ? f.cor : "#0a3060"}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: ativa ? `${f.cor}25` : "#001023",
                        border: `1px solid ${ativa ? f.cor : "#0a3060"}`,
                      }}
                    >
                      <Icon size={16} style={{ color: ativa ? f.cor : "#8aa3c0" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-tight truncate" style={{ color: ativa ? f.cor : "#fdffdf" }}>
                        {idx + 1}. {f.titulo}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#8aa3c0" }}>{f.periodo}</p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="flex-shrink-0 transition-transform"
                      style={{ color: ativa ? f.cor : "#0a3060", transform: ativa ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Detalhe da fase selecionada */}
            {fase && (
              <div
                className="flex-1 rounded-2xl p-6 space-y-5"
                style={{ backgroundColor: "#001830", border: `1px solid ${fase.corBorda}` }}
              >
                {/* Cabeçalho */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: fase.corBg, border: `1px solid ${fase.corBorda}` }}
                  >
                    <fase.icone size={22} style={{ color: fase.cor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: fase.cor }}>
                        Fase {fase.id}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: fase.corBg, color: fase.cor, border: `1px solid ${fase.corBorda}` }}
                      >
                        {fase.periodo}
                      </span>
                    </div>
                    <h3 className="text-xl font-black" style={{ color: "#fdffdf" }}>{fase.titulo}</h3>
                  </div>
                </div>

                {/* Objetivo */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#8aa3c0" }}>
                    Objetivo da Fase
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#fdffdf" }}>{fase.objetivo}</p>
                </div>

                {/* Responsabilidades por perfil */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["gestor", "colaborador", "rh"] as const).map((role) => {
                    const items = fase[role];
                    const isMyRole = platformRole === role;
                    return (
                      <div
                        key={role}
                        className="p-4 rounded-xl relative"
                        style={{
                          backgroundColor: isMyRole ? `${roleColor[role]}10` : "#001023",
                          border: `1px solid ${isMyRole ? roleColor[role] + "40" : "#0a3060"}`,
                        }}
                      >
                        {isMyRole && (
                          <div
                            className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{
                              backgroundColor: `${roleColor[role]}20`,
                              color: roleColor[role],
                              border: `1px solid ${roleColor[role]}40`,
                            }}
                          >
                            Você
                          </div>
                        )}
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: roleColor[role] }}>
                          {roleLabel[role]}
                        </p>
                        <ul className="space-y-2">
                          {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: roleColor[role] + "80" }} />
                              <span className="text-xs leading-relaxed" style={{ color: "#8aa3c0" }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Estrutura da pauta — apenas Fase 7 */}
                {"estruturaPauta" in fase && (fase as any).estruturaPauta && (
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: "#001023", border: "1px solid #d9f22a30" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d9f22a" }}>
                      Estrutura da Pauta (30 min)
                    </p>
                    <div className="space-y-2">
                      {(fase as any).estruturaPauta.map((item: { pergunta: string; tempo: string }, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{ backgroundColor: "#d9f22a08", border: "1px solid #d9f22a20" }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
                            style={{ backgroundColor: "#d9f22a20", color: "#d9f22a" }}
                          >
                            {i + 1}
                          </div>
                          <p className="flex-1 text-xs" style={{ color: "#fdffdf" }}>{item.pergunta}</p>
                          <div
                            className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#d9f22a15", border: "1px solid #d9f22a30" }}
                          >
                            <Clock size={10} style={{ color: "#d9f22a" }} />
                            <span className="text-xs font-bold" style={{ color: "#d9f22a" }}>{item.tempo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Periodicidade por quadrante — apenas Fase 7 */}
                {"periodicidadePorQuadrante" in fase && (fase as any).periodicidadePorQuadrante && (
                  <div className="p-4 rounded-xl" style={{ backgroundColor: "#001023", border: "1px solid #0a3060" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8aa3c0" }}>
                      Periodicidade por Quadrante do 9-Box
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(fase as any).periodicidadePorQuadrante.map((item: { quadrante: string; frequencia: string; cor: string }, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ backgroundColor: `${item.cor}08`, border: `1px solid ${item.cor}25` }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }} />
                            <span className="text-xs font-semibold" style={{ color: "#fdffdf" }}>{item.quadrante}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={10} style={{ color: item.cor }} />
                            <span className="text-xs font-bold" style={{ color: item.cor }}>{item.frequencia}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Destaque */}
                <div
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ backgroundColor: `${fase.cor}10`, border: `1px solid ${fase.cor}30` }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black"
                    style={{ backgroundColor: `${fase.cor}25`, color: fase.cor }}
                  >
                    !
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#fdffdf" }}>{fase.destaque}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Critérios de Avaliação ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "#fdffdf" }}>
            Os 8 Critérios de Avaliação
          </h2>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#d9f22a15", border: "1px solid #d9f22a40", color: "#d9f22a" }}
            >
              <span className="text-base font-black">70%</span>
              <span>Performance</span>
            </div>
            <span style={{ color: "#0a3060" }}>+</span>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#1840eb15", border: "1px solid #1840eb40", color: "#7ba7ff" }}
            >
              <span className="text-base font-black">30%</span>
              <span>Cultura</span>
            </div>
            <span style={{ color: "#0a3060" }}>=</span>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#00102310", border: "1px solid #0a3060", color: "#8aa3c0" }}
            >
              Posicionamento no 9-Box
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: "#8aa3c0" }}>
            Clique em cada critério para ver as definições de Abaixo, Dentro e Acima do esperado.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance — PRIMEIRO */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#001830", border: "1px solid #d9f22a40" }}>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#d9f22a" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#d9f22a" }}>
                    Eixo de Performance: Entrega &amp; Resultado
                  </p>
                </div>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#d9f22a20", color: "#d9f22a", border: "1px solid #d9f22a40" }}
                >
                  Peso 70%
                </span>
              </div>
              <div className="space-y-2">
                {CRITERIOS_PERFORMANCE.map((c, i) => (
                  <CriterioCard key={i} criterio={c} cor="#d9f22a" corBorda="#d9f22a40" prefix="perf" />
                ))}
              </div>
              <div
                className="mt-3 p-3 rounded-xl text-xs space-y-2"
                style={{ backgroundColor: "#d9f22a10", color: "#d9f22a", border: "1px solid #d9f22a20" }}
              >
                <p><strong>Como é calculado:</strong> A média das notas dos 4 critérios de Performance define o nível do eixo.</p>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#d9f22a20" }}>
                    <p className="font-black text-sm" style={{ color: "#d9f22a" }}>Alta</p>
                    <p className="text-xs" style={{ color: "#d9f22a99" }}>Média 3 a 4</p>
                  </div>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#d9f22a15" }}>
                    <p className="font-black text-sm" style={{ color: "#d9f22a" }}>Média</p>
                    <p className="text-xs" style={{ color: "#d9f22a99" }}>Média 2 a 2,99</p>
                  </div>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#d9f22a10" }}>
                    <p className="font-black text-sm" style={{ color: "#d9f22a" }}>Baixa</p>
                    <p className="text-xs" style={{ color: "#d9f22a99" }}>Média abaixo de 2</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "#d9f22a80" }}>Abaixo = 1 ponto · Dentro = 2 pontos · Acima = 3 pontos</p>
              </div>
            </div>

            {/* Cultura — SEGUNDO */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#001830", border: "1px solid #1840eb40" }}>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#1840eb" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7ba7ff" }}>
                    Eixo de Cultura: Comportamento &amp; Valores
                  </p>
                </div>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#1840eb20", color: "#7ba7ff", border: "1px solid #1840eb40" }}
                >
                  Peso 30%
                </span>
              </div>
              <div className="space-y-2">
                {CRITERIOS_POTENCIAL.map((c, i) => (
                  <CriterioCard key={i} criterio={c} cor="#7ba7ff" corBorda="#1840eb40" prefix="pot" />
                ))}
              </div>
              <div
                className="mt-3 p-3 rounded-xl text-xs space-y-2"
                style={{ backgroundColor: "#1840eb10", color: "#7ba7ff", border: "1px solid #1840eb20" }}
              >
                <p><strong>Como é calculado:</strong> A média das notas dos 4 critérios de Cultura define o nível do eixo.</p>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#1840eb20" }}>
                    <p className="font-black text-sm" style={{ color: "#7ba7ff" }}>Alto</p>
                    <p className="text-xs" style={{ color: "#7ba7ff99" }}>Média 3 a 4</p>
                  </div>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#1840eb15" }}>
                    <p className="font-black text-sm" style={{ color: "#7ba7ff" }}>Médio</p>
                    <p className="text-xs" style={{ color: "#7ba7ff99" }}>Média 2 a 2,99</p>
                  </div>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#1840eb10" }}>
                    <p className="font-black text-sm" style={{ color: "#7ba7ff" }}>Baixo</p>
                    <p className="text-xs" style={{ color: "#7ba7ff99" }}>Média abaixo de 2</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "#7ba7ff80" }}>Abaixo = 1 ponto · Dentro = 2 pontos · Acima = 3 pontos</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: "#001830", border: "1px solid #d9f22a30" }}
        >
          <div>
            <p className="text-base font-bold" style={{ color: "#fdffdf" }}>Pronto para começar?</p>
            <p className="text-sm" style={{ color: "#8aa3c0" }}>
              {platformRole === "colaborador"
                ? "Acesse o dashboard para fazer sua autoavaliação e agendar flash feedbacks."
                : platformRole === "gestor"
                ? "Acesse o dashboard para avaliar seu time e acompanhar o ciclo."
                : "Acesse o painel do RH para monitorar o ciclo e gerenciar os comitês de calibração."}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all flex-shrink-0"
            style={{ backgroundColor: "#d9f22a", color: "#001023" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#c8e020"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d9f22a"; }}
          >
            Ir para o Dashboard
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </StellarLayout>
  );
}
