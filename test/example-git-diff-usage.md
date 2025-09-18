# Git Diff File Tool - Exemplos de Uso

## 🌿 Nova Ferramenta: `git_diff_file`

A ferramenta `git_diff_file` permite comparar um arquivo específico entre duas branches do Git, fornecendo análise LLM completa das mudanças.

## 📋 Parâmetros

```javascript
git_diff_file: {
  file_path: "caminho/para/arquivo.js",    // OBRIGATÓRIO
  branch2: "feature-branch",               // OBRIGATÓRIO
  branch1: "main",                         // OPCIONAL (default: branch atual)
  directory: "/projeto",                   // OPCIONAL (default: diretório atual)
  context_lines: 3,                        // OPCIONAL (default: 3)
  include_commit_info: true                // OPCIONAL (default: true)
}
```

## 🎯 Casos de Uso

### 1. **Comparar arquivo entre branch atual e feature**
```javascript
git_diff_file: {
  file_path: "src/components/Button.js",
  branch2: "feature/new-button-styles"
}
```

### 2. **Comparar arquivo entre branches específicas**
```javascript
git_diff_file: {
  file_path: "src/utils/helpers.js",
  branch1: "main",
  branch2: "develop",
  context_lines: 5
}
```

### 3. **Comparar sem informações de commit**
```javascript
git_diff_file: {
  file_path: "package.json",
  branch2: "feature/dependencies-update",
  include_commit_info: false
}
```

## 📊 Funcionalidades

### ✅ **Validação de Arquivo**
- Verifica se o arquivo existe em ambas as branches
- Detecta se arquivo foi adicionado, modificado ou removido
- Tratamento de erros para arquivos inexistentes

### ✅ **Análise LLM**
- Resumo das mudanças em português
- Análise de impacto das alterações
- Identificação de problemas potenciais
- Avaliação da qualidade do código
- Recomendações para as mudanças
- Avaliação de riscos

### ✅ **Informações de Commit**
- Histórico de commits que afetam o arquivo
- Autor e data dos commits
- Mensagens de commit relevantes
- Limite de 5 commits mais recentes

### ✅ **Git Diff Detalhado**
- Diferenças linha por linha
- Contexto configurável ao redor das mudanças
- Formatação padrão do Git

## 🎯 Exemplos de Resposta

### Arquivo Modificado
```
🌿 **Análise de Diferenças de Arquivo entre Branches**

**Arquivo:** src/components/Button.js
**Branches:** main → feature/new-styles
**Status:** 📝 **Arquivo modificado** entre as branches

**Informações do Commit:**
Commits que afetam este arquivo:
a1b2c3d João Silva 2024-01-15 Adiciona novos estilos ao botão
e4f5g6h Maria Santos 2024-01-14 Corrige responsividade do botão

**Git Diff:**
```diff
@@ -10,7 +10,9 @@ export const Button = ({ children, variant }) => {
   const baseStyles = "px-4 py-2 rounded";
+  const newStyles = "shadow-lg hover:shadow-xl";
+  const transitionStyles = "transition-shadow duration-300";
   
-  return <button className={baseStyles}>{children}</button>;
+  return <button className={`${baseStyles} ${newStyles} ${transitionStyles}`}>
+    {children}
+  </button>;
 }
```

**Análise LLM:**
As mudanças introduzem melhorias significativas na experiência do usuário...

1. **Resumo das mudanças:** Adicionadas sombras e transições suaves
2. **Análise de impacto:** Melhora a percepção de interatividade
3. **Problemas potenciais:** Nenhum problema identificado
4. **Qualidade do código:** Código bem estruturado e legível
5. **Recomendações:** Considerar adicionar testes para as novas funcionalidades
6. **Avaliação de riscos:** Baixo risco, mudanças puramente visuais
```

### Arquivo Adicionado
```
🌿 **Análise de Diferenças de Arquivo entre Branches**

**Arquivo:** src/components/Modal.js
**Branches:** main → feature/modal-component
**Status:** 📄 **Arquivo adicionado** na branch `feature/modal-component`

**Análise LLM:**
Novo componente Modal adicionado com funcionalidades completas...

1. **Resumo das mudanças:** Novo componente Modal criado
2. **Análise de impacto:** Adiciona funcionalidade de modal ao sistema
3. **Problemas potenciais:** Verificar acessibilidade
4. **Qualidade do código:** Código bem estruturado
5. **Recomendações:** Adicionar documentação e testes
6. **Avaliação de riscos:** Médio risco, novo componente
```

## 💡 Benefícios

### 🎯 **Precisão**
- Comparação específica de arquivo
- Análise focada nas mudanças relevantes
- Contexto limitado ao arquivo em questão

### 🧠 **Inteligência**
- Análise LLM em português
- Identificação automática de problemas
- Recomendações práticas

### ⚡ **Eficiência**
- Economia de tokens da IDE
- Processamento local
- Resposta rápida e contextual

### 🔍 **Detalhamento**
- Informações de commit
- Status do arquivo
- Análise de impacto

## 🚀 Integração com Cursor

A ferramenta está integrada ao `.cursorrules` e será usada automaticamente pelo Cursor para:

- Comparações de arquivo entre branches
- Análise de mudanças em pull requests
- Revisão de código focada
- Detecção de problemas em mudanças específicas

**Use sempre `git_diff_file` ao invés de fazer comparações manuais!**
