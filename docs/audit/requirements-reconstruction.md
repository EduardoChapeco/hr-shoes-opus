# G1: Requirements Reconstruction

Este documento reconstrói as exigências reais do PROMPT MESTRE e de ciclos anteriores, dividindo as intenções em requisitos concretos, rastreáveis e verificáveis. Nenhuma destas exigências foi completamente sanada nas iterações anteriores de forma end-to-end.

## Módulo: Catálogo & Produtos

REQ-PRODUCT-001  
**Descrição:** Produto pode possuir variações baseadas em múltiplos atributos (Ex: Cor e Tamanho). A combinação cartesiana gera as variantes (SKUs).  
**Status Atual:** Parcial. A tela `novo.tsx` possui lógica defasada em relação à `$id.tsx`.  
**Microfase Responsável:** M-CATALOG-01

REQ-PRODUCT-002  
**Descrição:** Cada variante (SKU) deve suportar gerência isolada de Preço (`price_override`), Custo, Estoque, Imagem e EAN.  
**Status Atual:** Parcial. O upload de imagens na variante funciona no Admin, mas a interface não reflete as informações em tempo real no preview de estoque.  
**Microfase Responsável:** M-CATALOG-01

REQ-PRODUCT-003  
**Descrição:** A alteração de disponibilidade de um SKU (Estoque) deve ser calculada estritamente no servidor (`on_hand - reserved`). O cliente não processa cálculo de disponibilidade.  
**Status Atual:** Quebrado. Falhas de tipagem no BFF com a remoção dos envelopes `{status, data}` impedem a correta propagação do estado para a UI pública.  
**Microfase Responsável:** M-INVENTORY-01

REQ-PRODUCT-004  
**Descrição:** Editor unificado para criação e edição (Scroll contínuo com âncoras em vez de Tabs) garantindo visibilidade total do contexto do produto e persistência correta sem interrupções.  
**Status Atual:** Não Implementado. Atualmente fragmentado entre `novo.tsx` e `$id.tsx` usando `<Tabs>`.  
**Microfase Responsável:** M-CATALOG-02

## Módulo: Builder & CMS

REQ-BUILDER-001  
**Descrição:** O Editor Visual (Builder) e o frontend público (`_store`) devem obrigatoriamente utilizar o mesmo motor de renderização (mesmos componentes).  
**Status Atual:** Parcial. O builder foi mockado visualmente no Admin com seções estáticas, mas a persistência no Supabase via `documentId` não se propaga para o consumidor da loja pública em alguns casos.  
**Microfase Responsável:** M-BUILDER-01

REQ-BUILDER-002  
**Descrição:** Blocos dinâmicos (ex: Vitrine de Produtos) não devem duplicar o produto. Eles armazenam apenas o ID de referência, e o componente resolve o produto atualizado em tempo de execução.  
**Status Atual:** Parcial. A extração de dados brutos vs refatoração do BFF quebrou o bind.  
**Microfase Responsável:** M-BUILDER-02

## Módulo: Configurações & Onboarding

REQ-STORE-001  
**Descrição:** Toda mudança nas configurações globais da loja (Endereço, Formas de Pagamento, Logo, Cores) feita no Admin deve propagar imediatamente para a vitrine pública, checkout e biografia do vendedor.  
**Status Atual:** Quebrado. Erros em `src/services/onboarding.functions.ts` (`Property 'error' does not exist on type...`) bloqueiam a resolução do status da loja, engolindo os dados.  
**Microfase Responsável:** M-CORE-01

## Módulo: Storage & Mídias

REQ-MEDIA-001  
**Descrição:** O Upload de mídia deve ir para o Supabase Storage com metadata (`variant_id`, `focal_point`) e nunca deve ser considerado "salvo" até o vínculo ser persistido no banco e propagado para as UIs consumidoras.  
**Status Atual:** Simulado/Parcial. Erros na função de createUploadUrl e retornos mal formatados no BFF corrompem o preview real.  
**Microfase Responsável:** M-STORAGE-01
