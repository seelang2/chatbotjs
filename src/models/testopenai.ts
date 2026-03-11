import 'dotenv/config'
import OpenAI from "openai";

const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1-nano",
    input: "Write a one-sentence bedtime story about a unicorn."
});

console.log(response.output_text);

/*
API response:
chrisl@Eris chatbotjs %  [main] node dist/testopenai
Once upon a time, a gentle unicorn with a shimmering mane spread glittering magic across the night sky, helping children dream sweetly to sleep.

*/
