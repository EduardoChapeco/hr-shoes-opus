# G3: Gráfico de Dependências (Dependency Graph)

O fluxo principal e crítico deste e-commerce segue uma cadeia restrita. 

```mermaid
graph TD
    StoreProfile[Perfil da Loja] --> PublicStorefront[Vitrine Pública]
    StoreProfile --> CheckoutConfig[Checkout]
    StoreProfile --> BuilderBlocks[Builder de CMS]

    ProductCatalog[Catálogo: Produtos/Variantes] --> PublicStorefront
    ProductCatalog --> Search[Busca/Filtros]
    ProductCatalog --> Cart[Carrinho]
    ProductCatalog --> BuilderBlocks

    Cart --> Inventory[Estoque Reservado]
    Cart --> CheckoutConfig

    CheckoutConfig --> Orders[Pedidos]
    CheckoutConfig --> Payments[Financeiro]
    CheckoutConfig --> Inventory[Estoque Consumido]
    
    Inventory --> RestockAlerts[Alertas Admin]
    Orders --> Fulfillment[Logística]
```

**Bloqueadores Comuns:**
- Se `ProductCatalog` retorna erros silenciados (Falso Positivo de BFF), `PublicStorefront` e `BuilderBlocks` quebram e somem da interface.
- Se `Cart` usa preços locais em vez de consultar a fonte no Servidor, `Orders` receberá valores adulterados, o que é inseguro.
