# G5: Fila de Recuperação (Recovery Queue)

Conforme orientação do Prompt Mestre, a recuperação deve focar 1 módulo por vez e de forma estrita.

### Priorização de Risco / Fila

1. **MÓDULO: NÚCLEO DO BFF (Tipos / Loaders)**  
   **Por que:** A plataforma toda está falhando em compilação e mascarando erros (Falso Positivo em `status` de requests). Se os dados primários não carregam, nenhuma UI funciona. (Regressões: `[data doesn't exist on type...]`).

2. **MÓDULO: CATÁLOGO DE PRODUTOS & VARIANTES**  
   **Por que:** O coração do E-commerce. Duplicação perigosa entre criação (`novo.tsx`) e edição (`$id.tsx`). Variantes e mídias perdem o tracking sem uma via unificada com âncoras.

3. **MÓDULO: ESTOQUE E LOGÍSTICA**  
   **Por que:** Os alertas do painel estão invisíveis devido ao BFF quebrado, e a sincronização visual (o número de estoque disponível versus reservado) precisa reaparecer para o Lojista.

4. **MÓDULO: ONBOARDING / LOJA GLOBALS**  
   **Por que:** Propagação do status da loja afeta rotas públicas, visibilidade, SEO e perfis.

5. **MÓDULO: BUILDER / BLOCOS DINÂMICOS**  
   **Por que:** Estabilizar o catálogo é pré-requisito para referenciá-los no Builder. Após o Catálogo se firmar (fonte de verdade), consertamos as referências do Builder.
