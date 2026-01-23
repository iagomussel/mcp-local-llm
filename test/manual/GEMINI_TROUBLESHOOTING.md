# Gemini Adapter Troubleshooting

## ✅ Teste Direto Funcionou

O teste direto (`test-gemini-direct.js`) funcionou com sucesso usando `gemini-2.5-flash`:
- ✅ API key válida
- ✅ Modelo disponível
- ✅ Formato da requisição correto
- ✅ Resposta recebida: "Four"

## ⚠️ Problema: 404 via MCP Tools

Se você está recebendo erro 404 ao usar as ferramentas MCP do Cursor, o problema provavelmente é:

### 1. Servidor MCP Precisa Ser Reiniciado

**Solução**: Reinicie o Cursor completamente para que o servidor MCP seja reiniciado e carregue as novas configurações.

**Por quê?**
- O servidor MCP é iniciado quando o Cursor inicia
- Mudanças no código não são aplicadas até o servidor ser reiniciado
- As novas constantes de modelo (`gemini-2.5-flash`) só serão usadas após reiniciar

### 2. Verificar Configuração no mcp.json

Certifique-se de que o `mcp.json` está configurado corretamente:

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/home/iagomussel/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GEMINI_API_KEY": "your-api-key-here",
        "MODEL_NAME": "gemini-2.5-flash"
      }
    }
  }
}
```

### 3. Verificar Logs do Servidor

Após reiniciar o Cursor, verifique os logs do servidor (stderr) para ver:
- `[MCP] Using LLM provider: gemini`
- `[MCP] Gemini Adapter initialized with model: gemini-2.5-flash`
- `[MCP] Gemini API Request: https://...`
- `[MCP] Gemini Model: gemini-2.5-flash`

### 4. Testar Novamente

Após reiniciar o Cursor, teste novamente:

```javascript
// Via Cursor MCP tools
ask_llm("What is 2+2? Answer in one word.")
```

## Modelos Disponíveis

Os modelos atualizados e disponíveis são:
- ✅ `gemini-2.5-flash` (padrão, recomendado)
- ✅ `gemini-2.5-flash-lite` (mais rápido e econômico)
- ✅ `gemini-2.5-pro` (mais poderoso)
- ✅ `gemini-2.0-flash` (versão anterior)
- ✅ `gemini-3-flash-preview` (preview)
- ✅ `gemini-3-pro-preview` (preview)

**Modelos removidos** (não disponíveis mais):
- ❌ `gemini-1.5-flash` (deprecated)
- ❌ `gemini-1.5-pro` (deprecated)
- ❌ `gemini-pro` (deprecated)
- ❌ `gemini-1.0-pro` (deprecated)

## Debug

Para ver logs detalhados, configure:

```json
{
  "env": {
    "DEBUG": "true"
  }
}
```

Isso mostrará o corpo completo da requisição no stderr.

## Status Atual

- ✅ Adapter corrigido com modelos atualizados
- ✅ Formato da API correto
- ✅ Teste direto funcionando
- ⚠️ Aguardando reinicialização do servidor MCP para funcionar via Cursor tools
