# G8: Recovery Queue (Fila Canônica de Recuperação Priorizada)

Este documento estabelece a fila oficial de correção priorizada da plataforma HR Shoes Commerce, organizada estritamente por **nível de risco operacional, segurança e integridade de dados**, de acordo com as diretrizes da autoinvestigação.

## Critérios de Priorização Rígidos
1. **Segurança & RLS / Isolamento de Tenant**
2. **Perda de Dados & Financeiro / Caixa**
3. **Estoque & Motor Transacional**
4. **Checkout & Processamento de Pedidos**
5. **Funcionalidades Quebradas (Padrão 3 - Desestruturação de DTO)**
6. **Regressões e Duplicações de Código**
7. **Integrações Parciais / Pendentes**
8. **Polimento de UX / Interface Visual**

---

## Fila de Recuperação Priorizada

| Prioridade | Módulo / Domínio | Componente / Arquivo Afetado | Diagnóstico / Problema de Runtime | Ação Necessária | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **P0-1** | **BFF & Rotas Admin** | `admin.catalogo.produtos.$id.tsx` | Quebra de DTO (Padrão 3): `res.data` em vez de `res`. Impossibilita editar produtos no admin. | Remover `.data` e atualizar consumo direto do DTO. | `BLOQUEANDO UI` |
| **P0-2** | **Vitrine Pública (PDP)** | `_store.produto.$slug.tsx` | Quebra de DTO (Padrão 3): `result.data` em vez de `result`. Impossibilita visualizar produtos na vitrine. | Remover `.data` e padronizar consumo direto do DTO. | `BLOQUEANDO UI` |
| **P0-3** | **Movimentos de Estoque**| `admin.estoque.movimentos.tsx` | Erro `Cannot destructure property 'data'`. Tela de controle de estoque do lojista em branco. | Atualizar loader da rota para consumir retorno direto do service. | `BLOQUEANDO UI` |
| **P0-4** | **Alertas de Estoque** | `admin.estoque.alertas.tsx` | Erro `Cannot destructure property 'data'`. Alertas de ruptura inacessíveis. | Atualizar loader da rota para consumir retorno direto do service. | `BLOQUEANDO UI` |
| **P0-5** | **Caixa & PDV** | `admin.caixa.index.tsx` | Quebra por Padrão 3 ao carregar sessão ativa de caixa. Operador não consegue operar o PDV. | Refatorar consumo de `openCashSession` / `getCashSession`. | `BLOQUEANDO UI` |
| **P1-1** | **Editor de Produtos** | `admin.catalogo.produtos.novo.tsx` | Código duplicado com `$id.tsx` e falta de upload inline por variante no primeiro cadastro. | Consolidar componentes compartilhados de formulário. | `DUPLICADO` |
| **P1-2** | **CMS & Builder** | `admin.builder.$documentId.editor.tsx` | Quebra por Padrão 3 no salvamento de blocos e sincronização de dados dinâmicos na vitrine. | Padronizar DTOs e garantir que blocos resolvam produtos por ID. | `PARCIAL` |
| **P2-1** | **Rotas Órfãs** | `src/routes/` (11 rotas órfãs) | Rotas existentes no filesystem mas não mapeadas em `src/lib/routes.ts` nem no menu. | Registrar no menu/routes.ts ou remover com segurança. | `ÓRFÃO` |
| **P2-2** | **Controles Visualmente Simulado**| `admin.relatorios.tsx` | Botão "Exportar Relatório" dispara toast simulado sem download real. | Conectar com gerador de CSV/PDF backend real. | `SIMULADO` |
