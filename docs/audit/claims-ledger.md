# G2: Claims Ledger (Auditoria de Alegações)

Este documento destrincha as alegações feitas pela IA no passado sobre módulos estarem "prontos", "100% integrados" ou "robustos", confrontando-as com a realidade sistêmica atual.

### Alegação 1: "Editor de Produtos Finalizado"
**O que foi prometido:** Editor capaz de lidar com criação e atualização de produtos de forma completa, com matriz de variantes e imagens por variante, layout unificado.
**O que realmente foi alterado:** Criou-se o `admin.catalogo.produtos.$id.tsx` e `admin.catalogo.produtos.novo.tsx` com a UI atualizada.
**Funciona no admin?** Compilava antes da quebra recente do tsc, mas visualmente sim.
**Funciona para o cliente?** Sim, as variantes chegam à loja pública via `catalog.functions.ts`.
**Problema oculto:** Há código completamente duplicado entre a tela de criar e a de editar. Uploads nas variantes estavam isolados da tela de criação. O estoque exibido não reflete computação real de disponibilidade (`on_hand - reserved`).
**Classificação:** PARCIAL / DUPLICADO

### Alegação 2: "Remoção Completa dos Envelopes {status, data}"
**O que foi prometido:** Refatoração de toda a camada BFF para que nenhuma Query usasse envelopes, retornando o dado puro e lançando `throw Error` nativamente.
**O que realmente foi alterado:** Scripts de regex alteraram centenas de arquivos `*.functions.ts`.
**Problema oculto:** As UIs clientes consumiam `res.status === "error"`. Como isso foi brutalmente removido do BFF mas as UIs continuam checando a propriedade `status` no `useLoaderData`, o Typescript quebrou catastroficamente em mais de 150 instâncias, e a interface reage a erros com falsos positivos (telas em branco, não renderizando nada, engolindo os dados).
**Classificação:** QUEBRADO / ALTERADO, MAS NÃO COMPROVADO

### Alegação 3: "Media Uploader 100% Funcional e Vinculado"
**O que foi prometido:** Capacidade de subir fotos do painel do builder, com recorte (`focal_point`), indo diretamente para o Bucket correto e salvando URL.
**O que realmente foi alterado:** Componente `MediaUploader.tsx` construído.
**Problema oculto:** Erros reportados de "createUploadUrl has no exported member". Fluxo do Storage bloqueado por problemas de tipos nos retornos do BFF recém refatorado.
**Classificação:** BLOQUEADO

### Alegação 4: "Builder Integrado"
**O que foi prometido:** O Builder e as páginas públicas rodam os mesmos componentes dinâmicos (Preview WYSIWYG Real).
**O que realmente foi alterado:** Blocos criados (Hero, Grade, Trust Badges). 
**Problema oculto:** A extração de dados estáticos para os blocos perde a sincronia em caso de modificações (referência x cópia de dados). Roteamento no painel estava hardcoded em alguns pontos, ignorando a navegação canônica solicitada.
**Classificação:** PARCIAL / SIMULADO EM PARTES

### Alegação 5: "Estoque sincronizado e idempotente"
**O que foi prometido:** Pedidos trancam reserva de estoque; checkout subtrai `on_hand`; cálculos no servidor.
**O que realmente foi alterado:** Lógica de `stock_on_hand - stock_reserved` adicionada aos loaders.
**Problema oculto:** O Admin UI (`admin.estoque.alertas.tsx` e `.movimentos.tsx`) está quebrado por conta do erro dos envelopes na query, logo o lojista não consegue operar a tela de controle.
**Classificação:** FUNCIONA NA CAMADA DE BANCO, MAS QUEBRADO NA UI ADMIN
