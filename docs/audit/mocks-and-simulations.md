# Auditoria Forense — Mocks e Simulações (`docs/audit/mocks-and-simulations.md`)

Este documento lista todas as simulações, dados fictícios (fixtures) e comportamentos cenográficos remanescentes nas telas e lógica da Hr Shoes.

## 1. Dados e Fixtures Estáticos no Frontend

- **Stories Públicos**: A visualização de stories em `/stories` e `/admin/stories` exibe mídias locais ou gravadas de URLs placeholder para demonstração. Não há integração com bucket e agendamento real de publicações.
- **Match Time (Swipe)**: A tela `/match-time` (tinder de calçados) usa arrays estáticos de produtos ou lógica local de "curtidas" armazenadas no estado React, sem persistir de forma consistente na tabela `customer_credits` ou histórico de curtidas de leads.
- **Gráficos e Indicadores de Visão Geral**: O dashboard principal `/admin` exibe alguns KPIs agregados de vendas de hoje/mês, mas o cálculo de "caixa aberto" e "caixa fechado" simula a gaveta física sem integrar as transações de cartão de débito/crédito vindas do e-commerce.

## 2. Operações e Integrações Simuladas

- **Cálculo de Frete**: O simulador `/admin/fretes/cotacoes` ou calculadoras públicas simulam o frete usando prefixos de CEP mockados (ex: prefixo `80` ou `81` na tabela de testes) ou fallback grátis, sem contingência de APIs de transportadoras.
- **Checkout Manual e Confirmações**: O processo de finalização de compra permite uploads de comprovantes Pix e ativação de toasts de sucesso instantâneos antes da real validação por um operador de retaguarda financeira. O processamento de webhook em `api.webhooks.pagarme.ts` simula a recepção de eventos de pagamento sem validar a assinatura real da Pagar.me contra ataque de spoofing.
- **Telemetria de Analytics**: O novo componente `<GlobalPopupRenderer />` dispara visualizações com `setTimeout` sem confirmar a real atenção visual do usuário (apenas scroll parcial na viewport).

## 3. Fallbacks de Erro e Silenciadores

- **Controle de Tenant e Organizações**: Diversos loaders operam buscando a primeira loja disponível com `.limit(1)` ou `.single()` em vez de filtrar estritamente o `store_id` associado ao subdomínio ou sub-contexto logado da cliente (Risco de Store Spoofing).
