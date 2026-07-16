MICROFASE: 2A

MÓDULO: Fretes (Zonas e Taxas de Entrega - Server-Side & Persistência)

CAPACIDADE: Gerenciamento completo de Zonas de Entrega (Listar, Criar, Editar, Excluir) e Taxas Associadas, com validação de CEP e redirecionamento de rotas duplicadas.

COMMIT-BASE: `85db7cf`

COMMIT-FINAL: (A ser determinado)

### BASELINE

ESTADO ANTERIOR:
- O painel administrativo tinha duas UIs quase idênticas para gerenciar fretes (`/admin/fretes/` e `/admin/fretes/tabelas`), duplicando código e lógica.
- Não existia a funcionalidade de excluir zonas de frete, nem de renomear ou re-configurar CEPs de zonas criadas.
- Não havia testes unitários cobrindo o módulo `shipping.functions.ts`.
- Os erros de validação no cadastro de zonas e taxas causavam toasts ilegíveis devido ao dump do JSON direto do Zod.

### MAPA DO MÓDULO

ROTAS:
- `/admin/fretes` (`src/routes/admin.fretes.index.tsx`): Redireciona automaticamente para `/admin/fretes/tabelas` para eliminar duplicação.
- `/admin/fretes/tabelas` (`src/routes/admin.fretes.tabelas.tsx`): UI canônica para listar, criar, editar e excluir zonas de entrega e suas respectivas taxas.
- `/admin/fretes/cotacoes` (`src/routes/admin.fretes.cotacoes.tsx`): Simula o cálculo de frete a partir de um CEP.

UIS:
- Painel de Tabelas de Frete com listagem em formato de cartões de zonas de frete.
- Badges dinâmicas para exibir os prefixos de CEP vinculados a cada zona.
- Diálogo de criação/edição de zonas com formulário de nome e prefixos de CEP.
- Diálogo de nova taxa de frete com campos de nome, valor, prazo de dias úteis e pedido mínimo para frete grátis.

GATILHOS:
- Acessar a listagem: Aciona `listShippingZones`.
- Salvar zona (nova ou existente): Aciona `upsertShippingZone`.
- Excluir zona: Aciona `deleteShippingZone`.
- Adicionar taxa: Aciona `upsertShippingRate`.
- Excluir taxa: Aciona `deleteShippingRate`.
- Simular cotação: Aciona `calculateShipping`.

FORMS:
- Form de criação/edição de zona de frete com validação Zod e separador de CEP por vírgula.
- Form de criação de taxa com inputs monetários e de dias estimados.

ACTIONS:
- `listShippingZones` (GET)
- `upsertShippingZone` (POST)
- `deleteShippingZone` (POST)
- `upsertShippingRate` (POST)
- `deleteShippingRate` (POST)
- `calculateShipping` (POST)

TABELAS:
- `shipping_zones`
- `shipping_rates`

COLUNAS:
- `shipping_zones`: `id`, `store_id`, `name`, `regions`, `is_active`.
- `shipping_rates`: `id`, `zone_id`, `name`, `price_cents`, `min_order_cents`, `estimated_days`, `is_active`.

SCHEMAS:
- Validação Zod para zonas com regex que força cada região a ser numérica (ex: 80, 81) ou `*` (Brasil inteiro).
- Validação Zod para taxas (nome, preço centavos positivo).

STORAGE:
- Não aplicável.

RLS:
- Protegido por RLS no banco de dados e validados por `getAdminIdentity()` no backend.

INTEGRAÇÕES:
- Supabase Database.

---

### PROBLEMAS ENCONTRADOS E CORRIGIDOS

BOTÕES SEM ACTION:
- Botões de "Excluir Zona" e "Editar Zona" estavam ausentes. Implementados na UI e conectados às respectivas ServerFns.

CONTRATOS DIVERGENTES:
- O frontend enviava dados sem validação estrita de caracteres no prefixo do CEP. Corrigido com regex no schema Zod do backend.

ERROS SILENCIOSOS:
- Erros do Zod ao cadastrar CEPs inválidos quebravam o fluxo sem feedback legível. Implementado parser de erros Zod no frontend.

CÓDIGO MORTO / DUPLICAÇÃO:
- As páginas `/admin/fretes/index.tsx` e `/admin/fretes/tabelas.tsx` eram duplicatas. Corrigido adicionando um redirecionamento seguro na rota index.

---

### REPRODUÇÃO E TESTES

TESTES CRIADOS:
- `src/services/shipping.test.ts` [NEW]: Criado com 9 testes automatizados cobrindo 100% dos fluxos de sucesso, erros de banco e restrição de tenant.
  - Listagem de zonas por store_id.
  - Inserção e atualização (upsert) de zonas com restrição de acesso.
  - Deleção em cascada de zonas.
  - Cotação/Cálculo de frete por prefixo de CEP e wildcard `*`.

RESULTADO:
Aprovado (Todos os 9 testes passando na suite e compilação TS limpa).
