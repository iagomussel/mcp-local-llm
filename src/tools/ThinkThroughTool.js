import { BaseTool } from './BaseTool.js';

export class ThinkThroughTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'think_through',
      description: 'Adds an extra thinking layer by analyzing tasks, considering multiple approaches, and providing structured reasoning before execution. Useful for complex tasks that require planning and validation.',
      cacheable: true,
      cacheTTL: 600_000, // 10 minutes
      inputSchema: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'The task, question, or problem to think through and analyze',
          },
          context: {
            type: 'string',
            description: 'Optional context about the current situation, codebase, or constraints',
          },
          focus_areas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional specific areas to focus the analysis on (e.g., ["performance", "security", "maintainability"])',
          },
          output_format: {
            type: 'string',
            enum: ['plan', 'analysis', 'considerations', 'structured'],
            description: 'Format of the thinking output: plan (step-by-step), analysis (deep dive), considerations (pros/cons), structured (all of the above)',
            default: 'structured',
          },
        },
        required: ['task'],
      },
    };
  }

  async handle(args) {
    const { task, context = '', focus_areas = [], output_format = 'structured' } = args;

    if (!task || typeof task !== 'string') {
      throw new Error('Task is required and must be a string');
    }

    try {
      // Build system prompt based on output format
      const formatPrompts = {
        plan: `You are a technical planner. Analyze the task and return ONLY a structured plan in JSON with:
- objective: clear objective of the task
- steps: array of objects {order: number, action: "description", reason: "why this step"}
- complexity_estimate: "low" | "medium" | "high"
- dependencies: list of dependencies or prerequisites
- potential_problems: list of potential problems

Be technical and precise. Do not use greetings.`,

        analysis: `You are a technical analyst. Analyze the task deeply and return ONLY a structured analysis in JSON with:
- understanding: your understanding of the task
- possible_approaches: array of different approaches with {name: "name", advantages: [], disadvantages: [], when_to_use: "description"}
- recommendation: recommended approach and why
- risks: list of potential risks
- success_metrics: how to measure if the task was successful

Be technical and detailed. Do not use greetings.`,

        considerations: `You are a technical consultant. Analyze the task and return ONLY structured considerations in JSON with:
- positive_points: list of positive aspects of the approach
- negative_points: list of negative aspects or risks
- alternatives: list of possible alternatives
- tradeoffs: list of important tradeoffs
- final_recommendation: final recommendation with justification

Be technical and objective. Do not use greetings.`,

        structured: `You are a senior technical consultant. Analyze the task completely and return ONLY a complete structured analysis in JSON with:
- understanding: clear understanding of the task
- relevant_context: relevant technical context
- approaches: array of possible approaches with {name, advantages, disadvantages, complexity, when_to_use}
- recommendation: recommended approach with detailed justification
- execution_plan: array of steps {order, action, reason, time_estimate}
- considerations: {positive_points: [], negative_points: [], tradeoffs: []}
- risks: list of risks with {risk: "description", probability: "low|medium|high", mitigation: "how to mitigate"}
- validation: how to validate that the solution is correct
- metrics: metrics to measure success

Be technical, detailed and precise. Do not use greetings.`,
      };

      const systemPrompt = formatPrompts[output_format] || formatPrompts.structured;

      // Build user prompt
      let userPrompt = `Task to analyze:\n\n${task}\n`;

      if (context) {
        userPrompt += `\nAdditional context:\n${context}\n`;
      }

      if (focus_areas && focus_areas.length > 0) {
        userPrompt += `\nFocus areas: ${focus_areas.join(', ')}\n`;
      }

      userPrompt += `\nReturn only the structured JSON as specified.`;

      // Select model optimized for reasoning and analysis
      const model = await this.selectBestModel('technical analysis reasoning planning');
      const temperature = 0.4; // Balanced for creative thinking but still structured
      const max_tokens = 1024; // More tokens for comprehensive thinking

      const response = await this.callModelRunner({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature,
        max_tokens,
      });

      const result = response.choices?.[0]?.message?.content || 'No analysis generated';

      // Try to parse JSON if the response contains it
      let parsedResult = result;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          // Try to parse the entire response as JSON
          parsedResult = JSON.parse(result);
        }
      } catch (e) {
        // If parsing fails, return the raw result (might be markdown or text)
        parsedResult = result;
      }

      return {
        content: [
          {
            type: 'text',
            text: typeof parsedResult === 'string' 
              ? parsedResult 
              : JSON.stringify(parsedResult, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to process analysis: ${error.message}`);
    }
  }
}
