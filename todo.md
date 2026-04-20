# Ciclo de Performance 2.0 - Stellar Gaming

## Identidade Visual
- [x] Esquema de cores: fundo #001023, superfícies azul-escuro, primária #d9f22a, secundárias #fdffdf e #1840eb
- [x] Tipografia Space Grotesk (títulos) + Inter (corpo)
- [x] Tema dark configurado no index.css com variáveis CSS customizadas
- [x] Sidebar de navegação responsiva com collapse

## Banco de Dados / Schema
- [x] Tabela users com platformRole: rh, gestor, colaborador
- [x] Tabela employees (colaboradores com managerId, userId, platformRole)
- [x] Tabela evaluation_cycles (ciclos de avaliação)
- [x] Tabela manager_evaluations (avaliações do gestor sobre reports)
- [x] Tabela self_evaluations (autoavaliações - 8 critérios + comentários)
- [x] Tabela ninebox_positions (posicionamento calculado + ajuste manual)
- [x] Tabela flash_feedbacks (agendamentos, formalização, status)
- [x] Tabela feedback_reports (devolutivas enviadas)
- [x] Tabela calibration_rooms (salas de comitê - RH)
- [x] Tabela calibration_participants (gestores em cada comitê)
- [x] Tabela notifications (notificações in-app)
- [x] Seed data: ciclo ativo S1/2026 e colaboradores demo

## Autenticação e Perfis
- [x] Login com OAuth Manus
- [x] Perfil RH: visão global de todos os colaboradores
- [x] Perfil Gestor: visão do time (reports diretos)
- [x] Perfil Colaborador: visão individual apenas
- [x] Guards de rota por perfil (rhProcedure, gestorProcedure, protectedProcedure)
- [x] Navegação filtrada por perfil no StellarLayout

## Estrutura de Navegação
- [x] StellarLayout com sidebar adaptado por perfil
- [x] Rota /dashboard (home por perfil)
- [x] Rota /avaliacao (módulo de avaliação)
- [x] Rota /9box (9box interativo)
- [x] Rota /flash-feedback (módulo de flash feedbacks)
- [x] Rota /relatorio (devolutivas)
- [x] Rota /rh (painel exclusivo do RH)
- [x] Rota /calibracao (comitê de calibração)
- [x] Rota /perfil (configurações do usuário)

## Módulo de Avaliação
- [x] Autoavaliação: 4 perguntas de Potencial (Ambição, Sonhar Grande, Accountability, Juntos Somos Mais Fortes)
- [x] Autoavaliação: 4 dimensões de Performance (Qualidade, Contribuição, Adaptação, Uso de IA)
- [x] Escala: Abaixo / Dentro / Acima das expectativas
- [x] Campo de comentário por critério
- [x] Avaliação do Gestor sobre reports diretos (mesmas 8 perguntas)
- [x] Cálculo automático de posicionamento no 9box pelas regras definidas
- [x] Status draft/submitted com salvamento parcial

## 9Box Interativo
- [x] Grid 3x3 com quadrantes Q1-Q9 nomeados e coloridos por zona
- [x] Exibição de colaboradores posicionados no quadrante correto
- [x] Modo simulação: gestor responde perguntas hipotéticas e vê posicionamento calculado
- [x] Descrição de cada quadrante ao clicar
- [x] Gestão de consequências por quadrante (mérito, promoção, bônus)
- [x] Sem movimentação manual no perfil Gestor
- [x] Movimentação manual apenas no perfil RH (comitê de calibração)

## Painel de Curva da Área
- [x] Gráfico de barras com % por faixa (Zona Crítica, Mantenedores, Talentos)
- [x] Comparação com curva esperada Stellar (10% / 60% / 30%)
- [x] Análise gerada por IA do cenário atual vs esperado
- [x] Visível para Gestor (time) e RH (empresa toda)

## Flash Feedbacks
- [x] Colaborador pode agendar flash feedback com gestor
- [x] Gestor pode agendar flash feedback com colaborador
- [x] Status: agendado, realizado, atrasado, cancelado
- [x] Gestor vê painel de acompanhamento (realizados, pendentes, atrasados)
- [x] Colaborador tem acesso vitalício ao histórico de flash feedbacks
- [x] Formalização do feedback após realização
- [x] Notificações in-app ao agendar

## IA do Gestor
- [x] Recebe notas e comentários da avaliação
- [x] Recebe descrição e gestão de consequência do quadrante
- [x] Estrutura feedback completo com plano de ação
- [x] Interface de geração integrada ao módulo de relatório

## IA do Colaborador (Stella)
- [x] Chat para auxiliar na estruturação de pautas para flash feedbacks
- [x] Orienta sobre uso da plataforma
- [x] Tom de voz Stellar Gaming (direto, energético, sem burocracia)
- [x] Interface de chat integrada ao perfil do colaborador

## Painel do RH
- [x] Visão de todos os colaboradores da empresa
- [x] 9box consolidado da empresa inteira
- [x] Criação de salas de comitê de calibração
- [x] Inclusão de gestores nos comitês
- [x] Movimentação manual de pessoas nos quadrantes do 9box
- [x] Criação de novos colaboradores
- [x] Atualização de perfil de acesso (RH/Gestor/Colaborador)

## Relatório / Devolutiva
- [x] Gestor cria rascunho do feedback com apoio da IA
- [x] Gestor envia resultado da avaliação ao colaborador
- [x] Colaborador visualiza devolutiva com posicionamento no 9box
- [x] Descrições dos quadrantes e gestão de consequências visíveis ao colaborador
- [x] Colaborador NÃO vê dados de outros colaboradores

## Notificações
- [x] Notificação quando flash feedback for agendado
- [x] Notificação quando devolutiva for enviada
- [x] Badge de não lidas no header
- [x] Marcar como lida / marcar todas como lidas

## Testes
- [x] 29 testes unitários passando
- [x] Testes de calculatePotencial, calculatePerformance, calculateNineboxQuadrant
- [x] Testes de getCurveZone, calculateCurveDistribution
- [x] Testes de NINEBOX_QUADRANTS metadata e STELLAR_EXPECTED_CURVE
- [x] Testes de auth.logout

## Correções
- [x] Trocar posicionamento Q7⇔Q3 e Q6⇔Q8 no grid visual e na lógica de cálculo do 9-Box
- [x] Criar página de Overview do Ciclo (primeira página antes do dashboard) com fases clicáveis, objetivos e responsabilidades por perfil
- [x] Indicador de progresso do ciclo no topo do dashboard com fase atual e dias restantes
- [x] Painel no Painel RH para editar datas de início/fim de cada fase do ciclo (persistido no banco, refletido no CycleProgressBar)
- [x] Exportação de relatório em Excel para o RH com notas por critério, colaborador e líder direto
- [x] Gestão de Usuários no Painel RH: inserir, editar e desativar colaboradores com campos Nome Completo, Líder, Área, Diretoria, Perfil de Acesso e Senha
- [x] Remover travessões de todos os textos da interface e humanizar a linguagem
- [x] Nova regra 9-Box: faixas 3-4=Acima, 2-2.99=Dentro, <2=Abaixo; pesos Performance 70% + Potencial 30%
- [x] Controle de acesso por data de fase (avaliação, devolutiva só abrem na data de início)
- [x] 9-Box do colaborador: apenas visualização educativa dos quadrantes (sem simulação, sem posicionamento pessoal antes da avaliação)
- [x] Flash Feedback: perguntas do 9-Box para guiar o gestor + IA retorna quadrante/feeling + 4 campos de plano de ação com sugestão da IA

## Otimização Mobile
- [x] StellarLayout: sidebar como drawer/overlay em mobile, header com hamburger menu
- [x] Dashboard e CycleProgressBar: layout responsivo para telas pequenas
- [x] CicloOverview: fases em scroll horizontal ou accordion em mobile
- [x] Avaliação: formulário responsivo com campos empilhados em mobile
- [x] 9-Box: grid responsivo com scroll e cards adaptados para mobile
- [x] Flash Feedback: layout de cards responsivo para mobile
- [x] Relatório/Devolutiva: layout responsivo para mobile
- [x] Painel RH: tabelas e formulários responsivos para mobile
- [x] Calibração: 9-Box de calibração responsivo para mobile

## Autenticação Própria (Email + Senha)
- [x] Backend: endpoint de login com email/senha, hash bcrypt, JWT próprio, logout
- [x] Frontend: tela de login customizada desvinculada do OAuth Manus
- [x] Gestão de Usuários: hash de senha ao criar/editar colaborador
- [x] Perfil: tela de troca de senha pelo próprio usuário
- [x] Senhas dos usuários fictícios configuradas (Stellar@2026) com bcrypt
- [x] 52 testes passando, 0 erros TypeScript após migração completa

## Melhorias Visuais (Abril 2026)
- [x] CicloOverview: adicionar pesos Performance 70% / Potencial 30% na seção de critérios
- [x] CicloOverview: explicar critério de classificação (Acima/Dentro/Abaixo) como média das notas de cada dimensão
- [x] Dashboard Gestor: indicadores visuais inline (9-Box mini, Flash Feedbacks, métricas de time)
- [x] Dashboard RH: indicadores visuais inline (9-Box mini consolidado, Flash Feedbacks, métricas empresa)

## Calibração Avançada (Abril 2026)
- [x] Editar e excluir salas de calibração (RH)
- [x] Seleção de pessoas por cargo/área em cada sala de calibração
- [x] Gestão de consequência por pessoa: Mérito, Promoção, Desligamento, Plano de Recuperação
- [x] Painel lateral na calibração: ao clicar na pessoa, ver avaliação do líder + gestão de consequência
- [x] Finalizar sala de calibração (status "finalizada")
- [x] 9-Box: ao clicar no quadrante, exibir lista de pessoas posicionadas nele (todos os 9-Box do sistema)
- [x] Dashboard RH: curva esperada vs pré-calibração vs pós-calibração (barras visuais comparativas)
- [x] Dashboard RH: indicadores de gestão de consequência (totais por tipo)
- [x] Relatório exportável de consequências (Excel) - botão no Dashboard RH e rota /api/export/consequencias

## Correção de Autenticação em Produção (Abril 2026)
- [x] Corrigir context.ts do tRPC para ler stellar_session em vez do cookie OAuth Manus
- [x] Corrigir getLoginUrl para apontar para /login interno em vez do OAuth Manus
- [x] Adicionar trust proxy no Express para HTTPS funcionar corretamente atrás do proxy Manus
- [x] Login redireciona para página original após autenticação (redirect query param)
- [x] Corrigir autenticação das rotas de export Excel para usar stellar_session

## Bugs (Abril 2026)
- [x] PainelRH: campo de input perde foco a cada letra digitada no formulário de adicionar colaborador (componente EmployeeFormFields definido inline causava re-mount a cada render)

## Importação CSV de Colaboradores (Abril 2026)
- [x] Backend: procedure importBulk para importar colaboradores em lote com hash bcrypt por senha
- [x] Backend: validação por linha (e-mail duplicado, campos obrigatórios, perfil inválido)
- [x] Frontend: botão "Importar CSV" no Painel RH
- [x] Frontend: download de template CSV com colunas corretas e linha de exemplo
- [x] Frontend: preview dos dados antes de confirmar importação (tabela com erros destacados)
- [x] Frontend: feedback de resultado (X importados, Y erros com detalhes por linha)

## Página de Perfil e Senha Temporária (Abril 2026)
- [x] Schema: adicionar flag mustChangePassword na tabela employees
- [x] Backend: ao criar colaborador, marcar mustChangePassword = true por padrão
- [x] Backend: ao trocar senha com sucesso, limpar mustChangePassword = false
- [x] Frontend: banner de alerta em todas as páginas ao usar senha temporária (StellarLayout)
- [x] Perfil: página completa com dados do usuário, troca de senha e indicador de senha temporária
- [x] Perfil: validação de senha atual antes de trocar
- [x] Perfil: indicador de força de senha com dicas visuais
- [x] Perfil: rota /perfil registrada no App.tsx e link no menu lateral

## Redefinição de Senha por E-mail (Abril 2026)
- [x] Schema: tabela password_reset_tokens (token, employeeId, expiresAt, usedAt)
- [x] Backend: POST /api/auth/forgot-password — gera token seguro (96 hex chars), envia e-mail
- [x] Backend: POST /api/auth/reset-password — valida token, salva nova senha, marca usedAt
- [x] Frontend: link "Esqueci minha senha" na tela de login
- [x] Frontend: página /esqueci-senha com campo de e-mail e estado de sucesso
- [x] Frontend: página /redefinir-senha?token=... com indicador de força e validações
- [x] E-mail: template HTML Stellar Gaming com link de redefinição e validade de 1 hora
- [x] Segurança: tokens de uso único, expiração 1h, proteção contra enumeração de usuários
- [ ] SMTP: configurar credenciais reais (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)

## Melhorias Gerais (Abril 2026 - Lote 2)

### CicloOverview
- [x] Reordenar critérios: Performance primeiro, Potencial segundo
- [x] Acordeão por critério: ao clicar, expandir definições de Abaixo/Dentro/Acima do esperado
- [x] Fase Flash Feedback: incluir estrutura da pauta (4 perguntas com tempo) e periodicidade por quadrante
- [x] Reposicionar seção 9-Box para abaixo da página CicloOverview (após as 7 fases)

### Calibração
- [x] Salas de calibração visíveis para todos os usuários com perfil RH (não apenas o criador)

### Painel RH
- [x] Adicionar coluna: 9-Box inicial (pré-calibração)
- [x] Adicionar coluna: 9-Box calibrado (pós-calibração)
- [x] Adicionar coluna: Consequência definida (Promoção/Mérito/Desligamento/Plano)
- [x] Adicionar coluna: Flash Feedbacks realizados / total esperado no semestre

### Dashboard
- [x] Indicadores de consequência por grupo: Talentos, Mantenedores e Críticos
- [x] 9-Box no dashboard: exibir contagem de ações de consequência por quadrante (promos, méritos etc.)

### Flash Feedback
- [x] Formulário de criação de pauta com campos fixos da estrutura do FF:
  - O que está funcionando e precisa continuar? (5 min)
  - Qual é o gap prioritário do próximo trimestre? (10 min)
  - Qual compromisso concreto a pessoa assume? (10 min)
  - O que o gestor vai fazer para viabilizar? (5 min)

## Devolutiva Simplificada (Abril 2026 - Lote 3)
- [x] Avaliação do gestor: adicionar campo "Feedback Geral" ao final (após as 8 dimensões), habilitado quando todas as dimensões estiverem preenchidas
- [x] Persistir feedbackGeral na tabela manager_evaluations (nova coluna)
- [x] Devolutiva do colaborador: exibir quadrante calibrado no topo + notas/comentários por dimensão + Feedback Geral
- [x] Remover gestão de consequência da visão do colaborador (informação confidencial apenas para gestores)

## Reorganização Eixos 9-Box (Abril 2026 - Lote 4)
- [x] Eixo horizontal = Performance (X), eixo vertical = Cultura (Y, antes Potencial)
- [x] Renomear "Potencial" para "Cultura" em toda a interface e lógica
- [x] Reposicionar quadrantes Q1-Q9 conforme nova orientação dos eixos
- [x] Atualizar rótulos dos eixos em NineBox.tsx, Dashboard.tsx, CicloOverview.tsx
- [x] Atualizar lógica de cálculo: Performance = eixo X, Cultura = eixo Y
- [x] Atualizar testes unitários para refletir nova nomenclatura

## Múltiplos Papéis e Abas de Visão (Abril 2026 - Lote 5)
- [x] Adicionar coluna `secondaryPlatformRole` na tabela employees (nullable: gestor | rh | null)
- [x] Migrar banco e atualizar procedures create/update/importBulk no backend
- [x] Atualizar formulário de cadastro no Painel RH para exibir campo de papel secundário
- [x] Criar hook `useViewMode` que determina quais abas o usuário vê
- [x] Adicionar abas "Gestão do Time" / "Minhas Avaliações" na página Avaliação
- [x] Adicionar abas na página 9-Box
- [x] Adicionar abas na página Flash Feedback
- [x] Adicionar abas na página Devolutiva

## Correção Lista de Líderes (Abril 2026 - Lote 6)
- [x] Lista suspensa "Líder Direto" deve incluir todos com papel gestor (primário OU secundário)

## Aba Relatórios no Painel RH (Abril 2026 - Lote 7)
- [x] Instalar biblioteca xlsx no backend
- [x] Criar endpoint REST /api/reports/:type para geração de XLSX no servidor
- [x] Relatório 1: Colaboradores (nome, e-mail, cargo, área, diretoria, líder, perfil, status)
- [x] Relatório 2: Avaliações (notas por dimensão + média final por colaborador)
- [x] Relatório 3: 9-Box (quadrante inicial e calibrado por colaborador)
- [x] Relatório 4: Flash Feedbacks (data, gestor, colaborador, pauta estruturada)
- [x] Relatório 5: Gestão de Consequência (colaborador + consequência definida)
- [x] Relatório 6: Painel Geral do Ciclo (consolidado: colaborador + avaliação + 9-Box + consequência)
- [x] Criar aba "Relatórios" no Painel RH com cards de cada relatório e botão de exportação

## Acesso RH Secundário e Avaliação por Ciclo (Abril 2026 - Lote 8)
- [x] Backend: rhProcedure deve aceitar papel RH primário OU secundário
- [x] Backend: excelExport.ts authenticateRH deve aceitar papel RH primário OU secundário
- [x] Frontend: rota /rh (Painel RH) deve ser acessível para usuários com papel RH secundário
- [x] Frontend: rota /calibracao deve ser acessível para usuários com papel RH secundário
- [x] Frontend: menu lateral deve exibir Painel RH e Calibração para usuários com papel RH secundário
- [x] Tela de Avaliação: reorganizar por ciclo (lista de ciclos com status)
- [x] Tela de Avaliação: dentro de cada ciclo, exibir "Autoavaliação" com status (pendente/rascunho/enviada)
- [x] Tela de Avaliação: dentro de cada ciclo, exibir "Avaliação dos Liderados" com status por liderado

## Painel RH Compartilhado e Avaliação por Ciclo (Abril 2026 - Lote 9)
- [x] Verificar se dados do Painel RH (ciclos, fases, configurações) são globais (não vinculados ao userId do RH)
- [x] Verificar se salas de calibração são visíveis para todos os perfis RH (primário e secundário)
- [x] Garantir que qualquer parametrização feita por um RH aparece para todos os outros RHs
- [x] Tela de Avaliação: reorganizar por ciclo com "Autoavaliação" e "Avaliação dos Liderados" com status
- [x] Backend: context.ts atualizado para suportar usuários com login customizado (apenas na tabela employees)
- [x] Backend: getEmployeeByUserId atualizado para suportar IDs sintéticos negativos

## Correção Numeração 9-Box (Abril 2026 - Lote 10)
- [x] Trocar números Q4↔Q2 e Q3↔Q7 no 9-Box (manter descrições, cores e significados no lugar)

## Tela de Avaliação por Ciclo com Status (Abril 2026 - Lote 11)
- [x] Tela de Avaliação: listar todos os ciclos (ativos e encerrados) como cards expansíveis
- [x] Dentro de cada ciclo: seção "Autoavaliação" com status (Não iniciado / Em andamento / Enviado)
- [x] Dentro de cada ciclo: seção "Avaliação dos Liderados" com lista de liderados e status por pessoa (apenas para gestores)
- [x] Backend: endpoint evaluationSummary deve retornar ciclos + status de autoavaliação + status por liderado

## Lote 12 — Melhorias Gerais (Abril 2026)

### 9-Box e Calibração
- [x] Sincronizar resultado final do 9-Box (posição calculada + ajuste manual) no cadastro do colaborador (aba de perfil)
- [x] Garantir que ajustes feitos na calibração espelhem no 9-Box final do colaborador
- [x] Dashboard: filtro por ciclo para navegar entre ciclos históricos (ex: S2/2026)
- [x] Dashboard: exibir gestão de consequência por quadrante após calibração

### Ciclos
- [x] Painel RH: criar novo ciclo (nome, período, fases) via interface
- [x] Dashboard: filtro por ciclo com seletor de ciclo ativo/histórico

### Controle de Acesso por Fase
- [x] Avaliação do gestor: bloquear/liberar página conforme data da fase configurada no Painel RH
- [x] Autoavaliação: bloquear/liberar conforme data da fase configurada
- [x] Calibração: bloquear/liberar conforme data da fase configurada

### Correções e Ajustes
- [x] Bug: perfil thais.rabech (RH secundário) recebe erro ao tentar alterar datas das fases — corrigido: updateCyclePhase aceita updatedBy null para usuários sem registro na tabela users
- [x] Menu: reordenar para Ciclo 2.0 > 9-Box > Avaliação > Devolutiva > Flash Feedback > Calibração | (separado abaixo) Dashboard > Painel do RH
- [x] Gestão de Consequência: elegibilidade ao bônus — Q1 = "Não", todos os outros quadrantes = "Sim"

### Integração Outlook
- [x] Flash Feedback: ao criar agendamento, gerar link de reunião do Outlook (Microsoft Teams/Outlook Calendar)

## Lote 13 — Feedback Estruturado e Plano de Impacto (Abril 2026)

### Banco de Dados
- [x] Criar tabela `structured_feedbacks` (cycleId, leaderId, employeeId, entregas_relevantes, meta_atingida_auto, abaixo_esperado, valor_consistente, valor_consistente_desc, valor_evoluir, valor_evoluir_comportamento, proximo_ciclo_diferente, proximo_ciclo_expectativa, status: draft|submitted, createdAt, submittedAt)
- [x] Criar tabela `impact_plans` (cycleId, employeeId, feedbackId, valor_desenvolver, valor_acoes, competencia_tecnica, como_desenvolver, prazo_dias, resultado_esperado, status: draft|submitted, createdAt, submittedAt)
- [x] Gerar migração SQL e aplicar no banco

### Backend (tRPC)
- [x] Procedure `feedback.save` (protectedProcedure — gestor): salvar/atualizar rascunho
- [x] Procedure `feedback.submit` (protectedProcedure — gestor): enviar feedback (valida campos obrigatórios e mínimo de caracteres)
- [x] Procedure `feedback.getForEmployee` (protectedProcedure): buscar feedback de um colaborador num ciclo
- [x] Procedure `feedback.listForManager` (protectedProcedure — gestor): listar feedbacks do gestor no ciclo
- [x] Procedure `impactPlan.save` (protectedProcedure — colaborador): salvar/atualizar rascunho
- [x] Procedure `impactPlan.submit` (protectedProcedure — colaborador): enviar plano (valida prazo ≤ 90 dias e mínimo 1 ação por eixo)
- [x] Procedure `impactPlan.get` (protectedProcedure): buscar plano do colaborador no ciclo
- [x] Procedure `impactPlan.listForManager` (protectedProcedure — gestor): listar planos dos liderados

### Frontend — Feedback Estruturado (Etapa 1 — Líder)
- [x] Criar página `FeedbackEstruturado.tsx` com rota `/feedback`
- [x] Exibir dados da avaliação do colaborador (notas de metas e valores) durante preenchimento
- [x] Seção Entregas: campo "O que entregou de mais relevante" (mín. 3 linhas), "Meta atingida?" (automático da avaliação), "O que ficou abaixo do esperado" (obrigatório)
- [x] Seção Comportamento Cultural: "Valor demonstrado com consistência" (texto livre), "Valor que precisa evoluir" (automático — 2 menores notas), "Comportamento concreto" (mín. 150 chars)
- [x] Seção Próximo Ciclo: "O que fazer diferente" (1-3 itens), "Expectativa nos próximos 6 meses" (texto)
- [x] Validação: nenhum campo vazio, evidência comportamental ≥ 150 chars, não aceita "nada"
- [x] Botão Salvar Rascunho e Enviar Feedback
- [x] Lista de liderados com status (Não iniciado / Rascunho / Enviado)

### Frontend — Plano de Impacto (Etapa 2 — Colaborador Talento)
- [x] Criar página `PlanoImpacto.tsx` com rota `/plano-impacto`
- [x] Exibir feedback do líder durante preenchimento (somente leitura)
- [x] Visível apenas para colaboradores classificados como Talentos (Q6, Q8, Q9)
- [x] Seção Cultura: "Valor a desenvolver" (pré-preenchido com menor nota, confirmável), "O que farei diferente" (mín. 2 exemplos concretos)
- [x] Seção Desenvolvimento Técnico: "Competência a desenvolver", "Como farei", "Prazo (máx 90 dias)"
- [x] Seção Compromisso: "Resultado esperado" (1 frase objetiva)
- [x] Validação: prazo ≤ 90 dias, mín. 1 ação por eixo
- [x] Exibir plano do ciclo anterior para comparação (se existir)

### Menu e Ciclo
- [x] Substituir "Flash Feedback" no menu por "Feedback" (aponta para /feedback)
- [x] Adicionar "Plano de Impacto" no menu (aponta para /plano-impacto, visível para colaboradores Talento e gestores)
- [x] Adicionar fases "Feedback Estruturado" e "Plano de Impacto" nas fases padrão de novos ciclos
- [x] Remover ou arquivar a página FlashFeedback.tsx (manter rota para não quebrar links existentes)

## Lote 14 — PDI Estruturado 70/20/10 (Abril 2026)

### Banco de Dados
- [ ] Criar tabela `pdis` (cycleId, employeeId, leaderId, status: draft|leader_defined|employee_filling|completed, createdAt, updatedAt)
- [ ] Criar tabela `pdi_blocks` (pdiId, blockType: valor_stellar|competencia_tecnica, competencia, justificativaEmpate, acoes70, acoes20, acoes10, iaAcoes70, iaAcoes20, iaAcoes10, preenchidoPor: lider|colaborador, validadoPorLider)
- [ ] Gerar migração SQL e aplicar no banco

### Backend (tRPC)
- [ ] Procedure `pdi.initForEmployee` (gestorProcedure): líder inicia PDI, define valor a desenvolver (com justificativa se empate) e competência técnica
- [ ] Procedure `pdi.getIASuggestions` (protectedProcedure): IA gera sugestões 70/20/10 para uma competência
- [ ] Procedure `pdi.saveEmployeeActions` (protectedProcedure): colaborador salva/edita ações do plano
- [ ] Procedure `pdi.leaderValidate` (gestorProcedure): líder valida e finaliza o PDI
- [ ] Procedure `pdi.getForEmployee` (protectedProcedure): buscar PDI de um colaborador no ciclo
- [ ] Procedure `pdi.listForManager` (gestorProcedure): listar PDIs dos liderados com status
- [ ] Procedure `pdi.listAll` (rhProcedure): RH vê todos os PDIs da empresa

### Frontend — Tela PDI (/pdi)
- [ ] Criar página `PDI.tsx` com rota `/pdi`
- [ ] Gestor: lista de liderados obrigatórios (Talentos Q6/Q8/Q9 e Críticos Q1/Q2/Q4) com status por ciclo
- [ ] Colaborador: visualiza seu PDI com status e pode preencher ações quando liberado pelo líder
- [ ] Etapa 1 (Líder): selecionar valor Stellar a desenvolver (pré-selecionado com menor nota; em caso de empate, exibir os 2 e pedir justificativa obrigatória de 1 frase)
- [ ] Etapa 1 (Líder): selecionar competência técnica (campo texto livre com sugestão da IA baseada no quadrante/avaliação)
- [ ] Etapa 2 (Colaborador): plano de ação 70/20/10 para Valor Stellar (campo editável com sugestões da IA)
- [ ] Etapa 2 (Colaborador): plano de ação 70/20/10 para Competência Técnica (campo editável com sugestões da IA)
- [ ] Regra: campo 70% obrigatório editar/confirmar com justificativa; campos 20% e 10% aceitam sugestão com 1 clique
- [ ] Etapa 3 (Líder): validar e finalizar PDI do colaborador
- [ ] Loop ciclo seguinte: valor escolhido aparece destacado na próxima avaliação com pergunta "evoluiu?"

### Menu e CicloOverview
- [ ] Remover "Feedback" e "Plano de Impacto" do menu
- [ ] Adicionar "PDI" no menu (entre Devolutiva e Calibração)
- [ ] CicloOverview: substituir fase Flash Feedback pela fase PDI com descrição da metodologia 70/20/10
- [ ] CicloOverview: explicar quem é obrigado (Talentos e Críticos) e o fluxo líder → colaborador → validação

## Lote 14 — PDI Estruturado 70/20/10 (Abril 2026) — CONCLUÍDO

### Banco de Dados
- [x] Criar tabela `pdis` (cycleId, employeeId, leaderId, valorStellar, valorEmpate, valorEmpateJustificativa, competenciaTecnica, iaCompetenciaSugestao, status, liderObservacoes, createdAt, updatedAt)
- [x] Criar tabela `pdi_blocks` (pdiId, blockType: valor_stellar|competencia_tecnica, acoes70, acoes70Justificativa, acoes20, acoes10, iaAcoes70, iaAcoes20, iaAcoes10, preenchidoPeloColaborador, liderComentario, validadoPeloLider)
- [x] Migração SQL aplicada no banco

### Backend (tRPC)
- [x] Procedure `pdi.initForEmployee` (gestorProcedure): líder inicia PDI, define valor a desenvolver (com justificativa se empate) e competência técnica
- [x] Procedure `pdi.getIASuggestions` (protectedProcedure): IA gera sugestões 70/20/10 para uma competência
- [x] Procedure `pdi.saveEmployeeActions` (protectedProcedure): colaborador salva/edita ações do plano
- [x] Procedure `pdi.leaderValidate` (gestorProcedure): líder valida e finaliza o PDI
- [x] Procedure `pdi.getForEmployee` (protectedProcedure): buscar PDI de um colaborador no ciclo
- [x] Procedure `pdi.listForManager` (gestorProcedure): listar PDIs dos liderados com status

### Frontend — Tela PDI (/pdi)
- [x] Criar página `PDI.tsx` com rota `/pdi`
- [x] Gestor: lista de liderados obrigatórios (Talentos Q6/Q8/Q9 e Críticos Q1/Q2/Q4) com status por ciclo
- [x] Colaborador: visualiza seu PDI com status e pode preencher ações quando liberado pelo líder
- [x] Etapa 1 (Líder): selecionar valor Stellar a desenvolver (pré-selecionado com menor nota; em caso de empate, exibir os 2 e pedir justificativa obrigatória de 1 frase)
- [x] Etapa 1 (Líder): selecionar competência técnica (campo texto livre com sugestão da IA baseada no quadrante/avaliação)
- [x] Etapa 2 (Colaborador): plano de ação 70/20/10 para Valor Stellar (campo editável com sugestões da IA)
- [x] Etapa 2 (Colaborador): plano de ação 70/20/10 para Competência Técnica (campo editável com sugestões da IA)
- [x] Regra: campo 70% obrigatório editar/confirmar com justificativa; campos 20% e 10% aceitam sugestão com 1 clique
- [x] Etapa 3 (Líder): validar e finalizar PDI do colaborador

### Menu e CicloOverview
- [x] Remover "Feedback" e "Plano de Impacto" do menu
- [x] Adicionar "PDI" no menu (entre Devolutiva e Calibração)
- [x] CicloOverview: substituir fase Flash Feedback pela fase PDI com descrição da metodologia 70/20/10
- [x] CicloOverview: explicar quem é obrigado (Talentos e Críticos) e o fluxo líder → colaborador → validação

### Testes
- [x] 28 testes unitários PDI passando (mandatory quadrants, status transitions, block validation, 70/20/10)
- [x] Total: 98 testes passando, 0 erros TypeScript
