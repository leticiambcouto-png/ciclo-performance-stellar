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
