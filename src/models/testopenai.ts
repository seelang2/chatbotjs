import 'dotenv/config'
import OpenAI from "openai";

const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1-nano",
    input: "Write a one-sentence bedtime story about a unicorn."
});

//console.log(response.output_text);
console.dir(response)

/*
API response:
chrisl@Eris chatbotjs %  [main] node dist/testopenai
Once upon a time, a gentle unicorn with a shimmering mane spread glittering magic across the night sky, helping children dream sweetly to sleep.


chrisl@Eris chatbotjs %  [main] node dist/models/testopenai
{
  id: 'resp_031c96d84ffcd2e60069b309d0a8d881918606e51cfe738e2a',
  object: 'response',
  created_at: 1773341136,
  status: 'completed',
  background: false,
  billing: { payer: 'developer' },
  completed_at: 1773341137,
  error: null,
  frequency_penalty: 0,
  incomplete_details: null,
  instructions: null,
  max_output_tokens: null,
  max_tool_calls: null,
  model: 'gpt-4.1-nano-2025-04-14',
  output: [
    {
      id: 'msg_031c96d84ffcd2e60069b309d1a7108191915207335b2e7359',
      type: 'message',
      status: 'completed',
      content: [Array],
      role: 'assistant'
    }
  ],
  parallel_tool_calls: true,
  presence_penalty: 0,
  previous_response_id: null,
  prompt_cache_key: null,
  prompt_cache_retention: null,
  reasoning: { effort: null, summary: null },
  safety_identifier: null,
  service_tier: 'default',
  store: true,
  temperature: 1,
  text: { format: { type: 'text' }, verbosity: 'medium' },
  tool_choice: 'auto',
  tools: [],
  top_logprobs: 0,
  top_p: 1,
  truncation: 'disabled',
  usage: {
    input_tokens: 18,
    input_tokens_details: { cached_tokens: 0 },
    output_tokens: 34,
    output_tokens_details: { reasoning_tokens: 0 },
    total_tokens: 52
  },
  user: null,
  metadata: {},
  output_text: 'Once upon a time, in a shimmering forest, a gentle unicorn named Luna braved the night sky to deliver dreams of hope and kindness to all sleeping creatures below.'
}

*/
