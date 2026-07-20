-- ============================================================================
-- Hr Shoes Commerce — Migration 0070: CMS Home Template Seed
-- ============================================================================
-- Resolve duplicatas do slug 'home' e injeta um template perfeito da vitrine.

BEGIN;

DO $$ 
DECLARE
  v_store_id UUID;
  v_page_id UUID;
BEGIN
  -- Usar a loja padrão
  SELECT id INTO v_store_id FROM public.stores WHERE slug = 'hr-shoes' LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE NOTICE 'Loja padrão não encontrada. Pulando seeds do CMS.';
    RETURN;
  END IF;

  -- 1. Limpeza de Duplicatas
  -- Remove todos os nós associados a páginas cujo slug é 'home'
  DELETE FROM public.page_sections 
  WHERE page_id IN (
    SELECT id FROM public.pages 
    WHERE slug = 'home' AND store_id = v_store_id
  );

  -- Remove os documentos
  DELETE FROM public.pages 
  WHERE slug = 'home' AND store_id = v_store_id;

  -- 2. Criação do Documento Mestre
  INSERT INTO public.pages (store_id, title, slug, status, seo_title, seo_description)
  VALUES (
    v_store_id, 
    'Vitrine Principal', 
    'home', 
    'published', 
    'Hr Shoes — A sua loja de calçados online', 
    'Encontre os melhores tênis e sapatos com os melhores preços.'
  ) RETURNING id INTO v_page_id;

  -- 3. Injeção de Blocos Dinâmicos (page_sections)

  -- 3.1 Hero Banner (Slide)
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'hero-banner', 
    0, 
    '{
      "autoPlay": true,
      "interval": 5,
      "banners": [
        {
          "image_url": "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=2000",
          "link": "/produtos/lancamentos",
          "alt_text": "Coleção Verão"
        },
        {
          "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2000",
          "link": "/produtos/esportes",
          "alt_text": "Tênis Esportivos em Promoção"
        }
      ]
    }'::jsonb
  );

  -- 3.2 Stories Ring
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'stories-ring', 
    1, 
    '{
      "stories": [
        {
          "title": "Novidades",
          "thumb": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=400",
          "media_url": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=1200",
          "link": "/produtos/novidades",
          "type": "image"
        },
        {
          "title": "Outlet",
          "thumb": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400",
          "media_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
          "link": "/produtos/outlet",
          "type": "image"
        },
        {
          "title": "Casual",
          "thumb": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=400",
          "media_url": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=1200",
          "link": "/produtos/casual",
          "type": "image"
        },
        {
          "title": "Dicas",
          "thumb": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=400",
          "media_url": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1200",
          "link": "/produtos/dicas",
          "type": "image"
        }
      ]
    }'::jsonb
  );

  -- 3.3 Bento Grid
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'bento-grid', 
    2, 
    '{
      "title": "Destaques da Semana",
      "items": [
        {
          "title": "Nova Coleção",
          "subtitle": "Conforto extremo",
          "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800",
          "link": "/produtos/nova-colecao",
          "size": "large"
        },
        {
          "title": "Acessórios",
          "subtitle": "Até 30% OFF",
          "image": "https://images.unsplash.com/photo-1583485088034-697b5a624baf?auto=format&fit=crop&q=80&w=800",
          "link": "/produtos/acessorios",
          "size": "normal"
        },
        {
          "title": "Chuteiras",
          "subtitle": "Alta performance",
          "image": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800",
          "link": "/produtos/chuteiras",
          "size": "tall"
        }
      ]
    }'::jsonb
  );

  -- 3.4 Mosaic Banner
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'mosaic-banner', 
    3, 
    '{
      "banners": [
        {
          "image_url": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&q=80&w=1200",
          "link": "/colecao/corrida",
          "title": "Running Series"
        },
        {
          "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=1200",
          "link": "/colecao/casual",
          "title": "Estilo Casual"
        }
      ]
    }'::jsonb
  );

  -- 3.5 Trust Badges
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'trust-badges', 
    4, 
    '{
      "badges": [
        {
          "icon": "https://cdn.jsdelivr.net/npm/lucide-static@0.300.0/icons/shield-check.svg",
          "title": "Compra 100% Segura",
          "subtitle": "Seus dados protegidos"
        },
        {
          "icon": "https://cdn.jsdelivr.net/npm/lucide-static@0.300.0/icons/truck.svg",
          "title": "Frete Grátis",
          "subtitle": "Para todo Brasil"
        },
        {
          "icon": "https://cdn.jsdelivr.net/npm/lucide-static@0.300.0/icons/rotate-ccw.svg",
          "title": "Troca Fácil",
          "subtitle": "Até 30 dias grátis"
        }
      ]
    }'::jsonb
  );

  -- 3.6 Info Cards
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'info-cards', 
    5, 
    '{
      "cards": [
        {
          "title": "Design Premium",
          "description": "Feito com materiais importados da mais alta qualidade para garantir sua durabilidade.",
          "icon": "star"
        },
        {
          "title": "Tecnologia",
          "description": "Desenvolvidos com engenharia de absorção de impacto de ponta.",
          "icon": "zap"
        }
      ]
    }'::jsonb
  );

  -- 3.7 Testimonial Slider
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'testimonial-slider', 
    6, 
    '{
      "title": "O que dizem sobre nós",
      "subtitle": "Feedback de nossos clientes satisfeitos",
      "testimonials": [
        {
          "author": "Carlos M.",
          "content": "Entrega super rápida! O tênis é mais bonito ainda pessoalmente e super confortável.",
          "rating": 5,
          "avatar_url": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200"
        },
        {
          "author": "Juliana S.",
          "content": "Estou impressionada com a qualidade. Comprarei mais vezes com certeza.",
          "rating": 5,
          "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
        }
      ]
    }'::jsonb
  );

  -- 3.8 Social Feed
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'social-feed', 
    7, 
    '{
      "title": "Acompanhe no Instagram",
      "username": "@hrshoes_oficial",
      "posts": [
        {
          "image_url": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400",
          "link": "https://instagram.com"
        },
        {
          "image_url": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=400",
          "link": "https://instagram.com"
        },
        {
          "image_url": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=400",
          "link": "https://instagram.com"
        },
        {
          "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
          "link": "https://instagram.com"
        }
      ]
    }'::jsonb
  );

  -- 3.9 FAQ
  INSERT INTO public.page_sections (page_id, section_type, sort_order, content)
  VALUES (
    v_page_id, 
    'faq-accordion', 
    8, 
    '{
      "title": "Dúvidas Frequentes",
      "description": "Veja o que nossos clientes mais perguntam.",
      "faqs": [
        {
          "question": "Como funciona a política de devolução?",
          "answer": "Você tem 30 dias após o recebimento para solicitar a devolução gratuita de qualquer produto sem marcas de uso."
        },
        {
          "question": "Os produtos são originais?",
          "answer": "Sim, todos os nossos produtos são 100% originais, enviados com nota fiscal e garantia do fabricante."
        }
      ]
    }'::jsonb
  );

END $$;

COMMIT;
