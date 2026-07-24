# 12 — Preview & Publishing Flow Audit

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Auditoria do Fluxo de Salvamento, Preview e Publicação

```
  1. Alteração no Sidepanel
     └─ Editor React atualiza o estado local `nodes` instantaneamente (Otimista).
  
  2. Preview em Tempo Real no Canvas Editor
     └─ O canvas renderiza os nós locais atualizados sem requisição full-page.
  
  3. Salvamento do Rascunho (Draft)
     └─ Botão "Salvar Rascunho" dispara `saveBuilderNodes({ documentId, nodes })`.
     └─ Muta apenas a versão com `status = 'draft'` em `experience_versions` e seus `experience_nodes`.
     └─ A loja pública (storefront) PERMANECE INALTERADA.
  
  4. Publicação Atômica (Publish)
     └─ Botão "Publicar" dispara `publishBuilderVersion({ documentId })`.
     └─ Transação atômica em Supabase SQL:
          - Atualiza versão draft atual para `status = 'published'` e define `published_at = now()`.
          - Transforma versão publicada anterior para `status = 'archived'`.
          - Cria uma nova versão rascunho baseada na publicada para próximas edições.
  
  5. Renderização Pública Instantânea
     └─ A rota pública `/` lê a nova versão `published` com cache invalidado.
```

### Conclusão do Fluxo
O isolamento entre o ambiente de edição (rascunho) e o ambiente de produção (loja pública) funciona de forma 100% confiável e atômica.
