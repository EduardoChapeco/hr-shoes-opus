# Catálogo Canônico de Blocos e Seções (Component Registry)

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Registrador de Blocos e Seções (`builderRegistry`)

O registrador em `src/lib/builder-registry.ts` define a especificação runtime de cada seção. Todos os blocos listados abaixo possuem especificação tipada de schema, inspetor e renderizador.

### 1. Seções Estruturais & Layout
- **`section`**: Bloco raiz de largura total com cor/imagem de fundo configurável.
- **`container`**: Bloco de limitação de largura (`sm`, `md`, `lg`, `xl`, `2xl`, `full`) com opções de flexbox/grid.

### 2. Mídia & Storytelling Editorial
- **`hero_carousel`**: Banner rotativo com overlay de opacidade configurável, suporte a imagem mobile/desktop, CTA e temporizador.
- **`split_banner`**: Banner 50/50 ou 60/40 com imagem/vídeo de um lado e texto editorial/CTA do outro.
- **`mosaic_banners`**: Mosaico responsivo com 2 a 6 células predefinidas.
- **`video_section`**: Embed de vídeo (YouTube, Vimeo ou MP4) com autoplay muted, loop e suporte a reduced motion.
- **`rich_text`**: Conteúdo rich text semântico sanitizado com opções de largura de leitura.
- **`gallery_grid`**: Grade de imagens com modal lightbox.

### 3. Commerce & Catálogo Dinâmico
- **`product_rail`**: Carrossel ou grid de produtos com bind dinâmico a coleções ou últimos lançamentos.
- **`product_grid`**: Grade de produtos paginada com suporte a variados estilos de card (`classic`, `minimal`, `editorial`).
- **`product_carousel`**: Vitrine em slider deslizante com scroll livre no mobile.
- **`image_hotspots`** *(Novo)*: Imagem interativa com pontos clicáveis (Shop The Look) que exibem mini-cards com preço real e ação de compra rápida.
- **`featured_product`** *(Expansão)*: Seção de produto em destaque com galeria, seletor de variantes e compra direta.

### 4. Beleza, Saúde & Moda Especializada
- **`routine_steps`** *(Novo)*: Sequência numerada de passos (ex: "Rotina de Skincare 1, 2, 3") associados a produtos do catálogo.
- **`ingredient_spotlight`** *(Novo)*: Destaque de ingredientes/materiais com ícones, descrições e tooltips.
- **`before_after_slider`** *(Novo)*: Comparador com slider arrastável interativo de duas imagens (antes e depois).

### 5. Engajamento, Prova Social & Conversão
- **`stories_ring`**: Bolhas no estilo Instagram Stories que abrem modal em tela cheia.
- **`bento_grid`**: Grid assimétrico estilo Bento com cards de tamanhos variados (`small`, `wide`, `tall`, `large`).
- **`testimonial_carousel`**: Carrossel de avaliações com notas, avatares e prova social.
- **`trust_badges`**: Emblemas de segurança, frete grátis, parcelamento e garantia.
- **`info_cards`**: Cartões explicativos com ícones Lucide.
- **`faq_accordion`**: Perguntas frequentesSanitizadas com suporte a Rich Text e Schema.org FAQ.
- **`countdown_timer`**: Cronômetro regressivo de ofertas com timezone e mensagem de expiração.
- **`social_grid`**: Mosaico social de fotos do Instagram.
- **`contact_form`**: Formulário de contato/agendamento integrado ao backend.

### 6. Perfil Institucional
- **`store_profile_hero`**: Cabeçalho oficial da loja hidrata dados de `stores`.
- **`store_hours`**: Horários de funcionamento reais calculados no servidor (Aberto/Fechado).
- **`store_contact`**: Endereço, telefone, WhatsApp e botões de ação reais da loja.
