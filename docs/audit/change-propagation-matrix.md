# G5: Change Propagation Matrix (Regra de Propagação Obrigatória)

**NENHUMA** alteração de banco, contrato ou regra de negócio pode ser dada como concluída sem passar por este checklist:

1. **BANCO**
   - [ ] Criou a migration?
   - [ ] Precisou alterar constraints ou FKs?
   - [ ] Backfill de dados existentes executado?

2. **TIPOS E CONTRATOS**
   - [ ] Tipos gerados (`Database`) atualizados?
   - [ ] DTO correspondente refatorado?
   - [ ] Schema Zod reflete a restrição?

3. **SERVIDOR**
   - [ ] Server function consome e respeita o DTO correto?
   - [ ] RLS (Row Level Security) protege a nova coluna/ação?

4. **ADMIN (UI)**
   - [ ] Formulário possui o campo para entrada?
   - [ ] Listagem de registros exibe a coluna (se aplicável)?
   - [ ] Lidou com erro visual em vez de silencioso?

5. **CLIENTE (UI Pública)**
   - [ ] Vitrine / Checkout lê a propriedade corretamente?
   - [ ] O componente falha graciosamente se nulo?

6. **INTEGRAÇÕES E SEGURANÇA**
   - [ ] Cache ou SSR precisa ser invalidado?
   - [ ] Storage policy garante privacidade de tenant se houver mídia?

7. **TESTES**
   - [ ] Fluxo positivo (caminho feliz) comprovado?
   - [ ] Fluxo negativo (falha, sem preenchimento) suportado?
   - [ ] Reload da página não faz o dado desaparecer?
