# Auditoria de Microfase — CMS & Perfil de Loja (`perfil-publico` & `perfil-da-loja`)

## FASE 1 — BASELINE DO CICLO

### GIT
- **Branch**: `main`
- **HEAD Commit**: `454410b240ff11a76c8c9abfc120bf3235b3be28` (feat(navigation): fix admin sidebar navigation toggle issues and implement mobile subpage menus)
- **Hash Remoto**: `454410b240ff11a76c8c9abfc120bf3235b3be28`
- **Working Tree**: Clean (`nothing to commit, working tree clean`)

### AMBIENTE
- **Local**: `c:\Users\Excelência Tour SMO\Documents\hr-shoes-opus`
- **Preview / Produção**: `https://eduardochapeco-hr-shoes-opus.pages.dev`
- **Project Ref Supabase**: `hfgnageqkeryxsnwobjc`
- **Projeto Cloudflare**: `hrshoes` (Pages build output dir: `dist`)

---

## FASE 2 — ESCOLHA DA MICROFASE

- **Módulo**: CMS & Perfil de Loja (`perfil-publico` e `perfil-da-loja`)
- **Capacidade**: Evolução do construtor de seções (blocos de texto, meios de pagamento, galeria de fotos, vídeos do YouTube, atendimento online), controle de loja 100% virtual (ocultando mapa e destacando atendimento) e preview reativo de múltiplos blocos e layouts.
- **Rotas**:
  - `src/routes/admin.perfil-publico.tsx` (Admin editor)
  - `src/routes/_store.perfil-da-loja.tsx` (Storefront public page)
- **Actions**:
  - `savePublicProfile` (BFF server function)
- **Tabelas**:
  - `stores` (Persistência no campo JSONB `settings`)
- **Risco**: Médio (envolve a persistência e renderização de formatos estruturados de seções no banco).
- **Motivo da Prioridade**: Expandir a capacidade do editor do perfil público de texto simples para múltiplos layouts (galerias, vídeos, pagamentos), oferecendo a customização premium exigida pelo usuário e implementando a alternância entre loja física com mapa real (Google Maps embed) vs loja virtual com suporte online.

---

## FASE 3 — MAPA COMPLETO DO MÓDULO (Perfil da Loja & CMS)

### Objetivo funcional
Permitir que a lojista customize a página institucional/perfil da loja.
O editor contém abas:
- **Geral**: Nome, telefone, Instagram, endereço (ou switch de loja virtual), horário de funcionamento e logotipo/capa.
- **Horários**: Tabela estruturada de funcionamento por dia da semana e feriados/exceções.
- **Seções**: Criação de blocos dinâmicos de conteúdo de diferentes tipos (Texto, Galeria de Fotos, Vídeos, Canais de Suporte e Meios de Pagamento).
- **Botões**: Links extras para redes sociais ou canais de contato.

O storefront consome o perfil público e reconstrói as seções dinamicamente. Se a loja for virtual, remove os blocos de endereço/mapa e insere o card de "Atendimento Online" prioritário.

---

## FASE 4 — CONEXÃO UI → BANCO

Toda alteração de configuração é acumulada no estado do formulário e enviada na mutação `savePublicProfile`.
Estrutura estendida na coluna `settings` (JSONB) da tabela `stores`:
- `virtual_only`: `boolean` (indica se a loja é 100% virtual).
- `profile_sections`: `array` contendo objetos de seção com:
  - `id`: `string` (identificador único da seção)
  - `title`: `string` (título da seção)
  - `type`: `string` (`text` | `payments` | `gallery` | `video` | `support`)
  - `content`: `string` (se `type` for texto, é a descrição livre; se for estruturado, é o JSON stringificado de imagens, opções de pagamento ou suporte)
  - `icon`: `string` (nome do ícone Lucide)
- `cover_url`, `instagramHandle`, `business_hours_extended`, `holiday_exceptions`, `action_buttons` (já existentes).

---

## FASE 11 — PLANO DE IMPLEMENTAÇÃO

### Causa raiz da simplicidade
Até o momento, as seções do perfil da loja suportavam apenas texto livre e não possuíam layout responsivo ou componentes específicos para mídias, pagamentos ou suporte. O mapa também era exibido mesmo se a loja fosse virtual.

### Correções a executar
1. **[admin.perfil-publico.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/admin.perfil-publico.tsx)**:
   - Importar ícones extras (`Mail`, `Play`, `CreditCard`, `HelpCircle`, `Activity`).
   - Adicionar o switch `virtual_only` na aba Geral e vincular à persistência e ao preview de celular.
   - Refatorar a criação de seções: adicionar campo `Select` de tipo de seção. Roteá-lo para exibir inputs apropriados de mídia, pagamentos, galeria de fotos ou suporte comercial.
   - Atualizar a função `renderSectionContent` do Preview do celular para desenhar as seções ricas dinamicamente.
2. **[_store.perfil-da-loja.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/_store.perfil-da-loja.tsx)**:
   - Importar ícones necessários.
   - Implementar a detecção de `settings.virtual_only` para renderizar `OnlineSupportCard` ao invés de `AddressCard`.
   - Adicionar a renderização rica de seções no storefront através do parser JSON interno da coluna `content` de acordo com o `type` da seção.
