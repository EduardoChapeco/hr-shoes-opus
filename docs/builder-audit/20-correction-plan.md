# 20 — Correction Plan Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Plano de Correções e Ajustes Preventivos

### Status Atual: Nenhuma Correção Crítica Pendente
Como a auditoria mestre confirmou a compilação limpa, a ausência de duplicações e a total hidratação BFF de dados reais do banco, este plano registra as seguintes diretrizes preventivas contínuas:

1. **Monitoramento de Novos Schemas**: Qualquer bloco futuro deve obrigatoriamente registrar seu manifesto Zod em `src/lib/builder-registry.ts`.
2. **Proteção Multi-Tenant**: Toda consulta adicional deve exigir o parâmetro `store_id` validado pela identidade do servidor.
3. **Manutenção dos Presets**: Os 10 temas em `src/lib/home-templates-library.ts` devem ser atualizados quando novas props forem adicionadas aos manifestos.
