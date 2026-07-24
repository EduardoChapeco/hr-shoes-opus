# 23 — Known Limitations Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Limitações Conhecidas e Fronteiras de Escopo

1. **Limite de Mídias por Hotspot**: Recomendado o máximo de 10 marcadores por imagem para evitar poluição visual em telas móveis pequenas.
2. **Produtos Inativos**: Se um produto associado a um marcador ou vitrine for desativado (`status = 'archived'`), o BFF filtra o item e o frontend exibe o fallback ou esconde a tag gracefully.
3. **Imagens de Mídia**: Dependem da conexão de internet ou do Supabase Storage configurado para carregar os arquivos estáticos.
