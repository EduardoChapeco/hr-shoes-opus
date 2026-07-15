# BACKLOG CANÔNICO — Ocultações e Remoções

> **REGRA DE OURO:** Nenhuma capacidade apagada, ocultada ou transformada em stub pode ser considerada "concluída" ou "fora de escopo" sem decisão explícita.
> Toda funcionalidade que não representa um fluxo REAL, E2E e auditável está aqui, com status `PENDENTE DE RECONSTRUÇÃO REAL`.
> Uma capacidade só sai daqui quando sua fatia vertical completa for desenhada, implementada, testada e comprovada em produção.

---

## 1. Gestão de Organizações Multi-Tenant 
- **Módulo:** Core / Admin
- **Rota Original:** N/A (foi idealizado no plano, mas não implementado na UI)
- **Origem do Requisito:** Arquitetura Base
- **Atores:** Super Admin
- **Funcionalidades Esperadas:** Criar novas Organizations e Stores de forma dinâmica através de uma interface administrativa.
- **Entidades:** `organizations`, `stores`
- **Integrações:** N/A
- **Estado Atual:** PENDENTE DE RECONSTRUÇÃO REAL
- **Motivo da Remoção:** Sub-utilizado e substituído por trigger estático de "primeiro usuário vira dono". A plataforma finge que o usuário tem uma loja, mas não há tela real para criar/gerenciar múltiplas lojas.
- **Fase Futura:** Expansão de Franquias/Multi-tenant (Fase 3).

## 2. Redefinição de Senha Completa
- **Módulo:** Auth
- **Rota Original:** `/redefinir-senha` (faltante)
- **Origem do Requisito:** UX de Segurança
- **Atores:** Cliente / Admin
- **Funcionalidades Esperadas:** Rota que recebe um access_token do Supabase, valida e permite a digitação de uma nova senha.
- **Entidades:** `auth.users`
- **Estado Atual:** PENDENTE DE RECONSTRUÇÃO REAL (Sendo priorizado AGORA na Fatia Vertical de Auth)
- **Motivo da Remoção:** Tela de "recuperar senha" foi feita, mas a rota de destino do link do e-mail nunca foi criada, tornando a funcionalidade um Stub inoperante.

## 3. Gestão Completa de Estoque (Reservas Reais)
- **Módulo:** Commerce
- **Rota Original:** `/admin/estoque` (Existe como UI, mas sem engine real validada E2E)
- **Origem do Requisito:** Vendas Físico/Digital
- **Atores:** Cliente, Seller
- **Funcionalidades Esperadas:** Quando o item entra no carrinho, subtrair temporariamente o estoque de vitrine via lock. Timeout libera estoque. Compra deduz do reservado.
- **Entidades:** `stock_reservations`, `stock_movements`, `product_variants`
- **Estado Atual:** PENDENTE DE RECONSTRUÇÃO REAL
- **Motivo da Remoção:** A UI existe, mas as regras transacionais de "Race Condition" não foram totalmente acopladas nas regras do SSR Checkout, permitindo teoricamente "Overbooking".

## 4. Integração Real de Webhooks de Pagamento
- **Módulo:** Financeiro / Checkout
- **Rota Original:** API `/api/webhooks/pagarme` (Inexistente)
- **Origem do Requisito:** Pagamento Automatizado (Fase 2)
- **Atores:** Pagar.me, Supabase Edge Functions
- **Funcionalidades Esperadas:** Endpoint seguro e idempotente recebendo o POST do gateway de pagamento, verificando a assinatura criptográfica, atualizando o pedido e movendo status logístico.
- **Estado Atual:** PENDENTE DE RECONSTRUÇÃO REAL
- **Motivo da Remoção:** Foram criados botões manuais (Pix via WhatsApp e "Marcar como Pago") no admin, mas a integração canônica via código/webhook foi empurrada para "Em Breve".

*(Este documento será expandido continuamente conforme outras capacidades fantasma forem mapeadas durante as auditorias sistêmicas)*
