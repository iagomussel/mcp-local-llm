# 🔍 Search Code Usage Tool - Guia Completo

## Visão Geral

A ferramenta `search_code_usage` é uma funcionalidade avançada do MCP Local LLM que permite analisar código usando parsing semelhante a AST para encontrar usos de variáveis, funções, classes e outros elementos de código. Suporta múltiplas linguagens de programação.

## 🚀 Características Principais

### ✅ Suporte Multi-Linguagem
- **JavaScript/TypeScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **Python**: `.py`
- **PHP**: `.php`
- **Java**: `.java`
- **Go**: `.go`
- **C/C++**: `.c`, `.cpp`
- **C#**: `.cs`

### ✅ Tipos de Análise
- **Declarações**: Onde variáveis, funções, classes são definidas
- **Usos**: Onde elementos são referenciados ou chamados
- **Contexto**: Linhas ao redor de cada ocorrência
- **Análise Semântica**: Compreensão do tipo de uso

### ✅ Recursos Avançados
- Busca recursiva em diretórios
- Filtros por tipo de arquivo
- Limitação de resultados
- Análise LLM dos resultados
- Exclusão automática de diretórios irrelevantes

## 📋 Parâmetros da Ferramenta

```javascript
{
  root_path: string,           // Diretório raiz para busca (obrigatório)
  term: string,               // Termo a buscar (obrigatório)
  reference_file?: string,    // Arquivo de referência opcional
  file_types?: string[],      // Extensões de arquivo (padrão: todas suportadas)
  include_declarations?: boolean, // Incluir declarações (padrão: true)
  include_usages?: boolean,   // Incluir usos (padrão: true)
  context_lines?: number,     // Linhas de contexto (padrão: 3)
  max_results?: number        // Máximo de resultados (padrão: 50)
}
```

## 🎯 Exemplos de Uso

### 1. Busca Básica
```javascript
// Buscar todas as ocorrências de "userService"
{
  root_path: "/path/to/project",
  term: "userService"
}
```

### 2. Busca Específica por Linguagem
```javascript
// Buscar apenas em arquivos JavaScript
{
  root_path: "/path/to/project",
  term: "UserService",
  file_types: [".js", ".ts"]
}
```

### 3. Busca Apenas Declarações
```javascript
// Encontrar apenas onde "getUserById" é declarado
{
  root_path: "/path/to/project",
  term: "getUserById",
  include_declarations: true,
  include_usages: false
}
```

### 4. Busca com Contexto Estendido
```javascript
// Buscar com mais linhas de contexto
{
  root_path: "/path/to/project",
  term: "createUser",
  context_lines: 5,
  max_results: 20
}
```

## 🔧 Padrões de Busca por Linguagem

### JavaScript/TypeScript
- **Declarações**: `function`, `const`, `let`, `var`, `class`, `interface`, `type`, `enum`
- **Usos**: Chamadas de função, acesso a propriedades, referências de variáveis
- **Especial**: Componentes JSX (`<ComponentName`)

### Python
- **Declarações**: `def`, `class`, `import ... as`, `from ... import ... as`
- **Usos**: Chamadas de função, acesso a atributos, referências de variáveis

### PHP
- **Declarações**: `function`, `class`, `interface`, `trait`, `const`
- **Usos**: Chamadas de função, variáveis PHP (`$variable`)

### Java
- **Declarações**: `class`, `interface`, `enum` com modificadores
- **Usos**: Chamadas de método, acesso a propriedades

### Go
- **Declarações**: `func`, `type`, `var`, `const`, `package`
- **Usos**: Chamadas de função, acesso a métodos

### C/C++
- **Declarações**: Tipos primitivos, `struct`, `typedef`, `enum`, `class` (C++)
- **Usos**: Chamadas de função, acesso a membros, resolução de escopo (`::`)

### C#
- **Declarações**: `class`, `interface`, `enum`, `struct`, `delegate` com modificadores
- **Usos**: Chamadas de método, acesso a propriedades

## 📊 Formato de Resposta

A ferramenta retorna uma análise estruturada com:

1. **Resumo Estatístico**
   - Termo pesquisado
   - Diretório analisado
   - Número de arquivos processados
   - Total de ocorrências encontradas

2. **Resultados Detalhados**
   - Arquivo e número de ocorrências
   - Linha específica de cada match
   - Tipo de uso (declaração/uso)
   - Contexto ao redor da ocorrência

3. **Análise LLM**
   - Resumo de onde o termo é usado
   - Tipos de uso identificados
   - Padrões mais comuns
   - Recomendações e possíveis problemas

## 🎯 Casos de Uso Práticos

### 1. Refatoração de Código
```javascript
// Encontrar todas as referências antes de renomear
{
  root_path: "/src",
  term: "oldFunctionName",
  include_declarations: true,
  include_usages: true
}
```

### 2. Análise de Dependências
```javascript
// Verificar onde uma classe é usada
{
  root_path: "/project",
  term: "DatabaseConnection",
  include_declarations: false,
  include_usages: true
}
```

### 3. Auditoria de Segurança
```javascript
// Buscar por funções potencialmente perigosas
{
  root_path: "/src",
  term: "eval",
  file_types: [".js", ".ts"],
  include_usages: true
}
```

### 4. Documentação de API
```javascript
// Encontrar todas as implementações de uma interface
{
  root_path: "/src",
  term: "UserRepository",
  include_declarations: true,
  include_usages: false
}
```

## ⚡ Otimizações e Limitações

### Otimizações
- Busca recursiva eficiente
- Exclusão automática de `node_modules`, `.git`, `dist`, etc.
- Limitação de resultados por arquivo
- Parsing baseado em regex otimizado

### Limitações
- Parsing baseado em regex (não AST completo)
- Pode ter falsos positivos em strings/comentários
- Não resolve imports/requires automaticamente
- Limitado a padrões de linguagem conhecidos

## 🔄 Integração com Outras Ferramentas

A ferramenta `search_code_usage` funciona bem em conjunto com:

- `diff_files`: Comparar mudanças em arquivos
- `diff_branches`: Analisar diferenças entre branches
- `debugger`: Debugging com contexto de uso
- `git_diff_file`: Análise de mudanças específicas

## 📝 Exemplo Completo

```javascript
// Busca completa por "userService" em um projeto
const result = await mcpClient.callTool('search_code_usage', {
  root_path: "/home/user/my-project",
  term: "userService",
  file_types: [".js", ".ts", ".jsx", ".tsx"],
  include_declarations: true,
  include_usages: true,
  context_lines: 3,
  max_results: 30
});

console.log(result.content[0].text);
```

## 🚀 Próximos Passos

1. **Teste a ferramenta** com seus próprios projetos
2. **Experimente diferentes parâmetros** para otimizar resultados
3. **Combine com outras ferramentas** para análises mais profundas
4. **Use a análise LLM** para insights sobre padrões de código

---

**Nota**: Esta ferramenta é especialmente útil para desenvolvedores que trabalham com codebases grandes e precisam entender rapidamente como elementos de código são usados em todo o projeto.
