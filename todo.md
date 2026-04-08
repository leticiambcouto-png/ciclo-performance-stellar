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
