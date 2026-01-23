/**
 * Thinking Layer Instructions Prompt
 * Instructions for using the thinking layer (think_through tool)
 */
export const thinkingLayerInstructions = {
  name: 'thinking_layer_instructions',
  description: 'Instructions for using the thinking layer (think_through tool) for complex tasks.',
  messages: [
    {
      role: 'user',
      content: `# Thinking Layer Instructions

## When to Use \`think_through\` Tool:

Use the thinking layer for complex tasks that require:
- Planning and analysis before execution
- Multiple approach evaluation
- Risk assessment
- Structured decision making

## Use Cases:

### 1. Before Major Refactoring
- Analyze impact and plan approach
- Consider multiple refactoring strategies
- Evaluate risks and dependencies

### 2. Architecture Decisions
- Compare multiple approaches
- Evaluate pros/cons of each option
- Get structured recommendations

### 3. Complex Bug Fixes
- Understand root cause deeply
- Plan solution approach
- Consider side effects

### 4. Performance Optimization
- Analyze bottlenecks
- Plan optimization strategy
- Evaluate tradeoffs

### 5. Security Considerations
- Evaluate risks
- Plan mitigation strategies
- Consider attack vectors

## Output Formats:

- **\`plan\`**: Step-by-step execution plan
- **\`analysis\`**: Deep technical analysis with multiple approaches
- **\`considerations\`**: Pros/cons and tradeoffs
- **\`structured\`**: Complete analysis (default) - includes plan, analysis, considerations, risks, and metrics

## Example Usage:

\`\`\`json
{
  "name": "think_through",
  "arguments": {
    "task": "Refactor authentication to use JWT",
    "context": "Current: session-based, Node.js/Express",
    "focus_areas": ["security", "maintainability"],
    "output_format": "structured"
  }
}
\`\`\`

## Benefits:
- Better decision making with structured analysis
- Reduced execution errors through planning
- Multiple approaches considered
- Risk mitigation before implementation`,
    },
  ],
};
