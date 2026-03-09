import Anthropic from "@anthropic-ai/sdk";
import 'dotenv/config'

async function main() {
  const anthropic = new Anthropic();

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content:
          "What should I search for to find the latest developments in renewable energy?"
      }
    ]
  });
  console.log(msg);
}

main().catch(console.error);

/*
API Response:
{
  model: 'claude-opus-4-6',
  id: 'msg_01Dytw9gVZ1CWQNEJMPuDpCA',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Here are some effective search strategies to find the latest developments in renewable energy:\n' +
        '\n' +
        '## Search Terms to Try\n' +
        '- **"renewable energy breakthroughs 2024/2025"**\n' +
        '- **"clean energy technology advances"**\n' +
        '- **"solar/wind/battery storage latest news"**\n' +
        '- **"green energy innovation"**\n' +
        '- **"energy transition updates"**\n' +
        '\n' +
        '## Recommended Sources\n' +
        '- **News outlets:** Reuters Energy, Bloomberg Green, The Guardian Environment\n' +
        '- **Industry-specific:** Renewable Energy World, CleanTechnica, PV Magazine\n' +
        '- **Research/Policy:** International Energy Agency (IEA), IRENA, U.S. DOE\n' +
        '- **Academic:** Google Scholar for peer-reviewed research\n' +
        '\n' +
        '## Specific Topics Worth Exploring\n' +
        '- **Solar:** Perovskite cells, floating solar farms\n' +
        '- **Wind:** Offshore wind expansion, larger turbines\n' +
        '- **Storage:** Solid-state batteries, grid-scale storage\n' +
        '- **Hydrogen:** Green hydrogen production\n' +
        '- **Policy:** Inflation Reduction Act impacts, EU Green Deal\n' +
        '- **Grid:** Smart grid technology, transmission upgrades\n' +
        '\n' +
        '## Tips\n' +
        '- Use **Google News** with date filters for the most recent stories\n' +
        '- Follow relevant hashtags on social media (#RenewableEnergy, #CleanEnergy)\n' +
        '- Set up **Google Alerts** for topics you want to track regularly\n' +
        '\n' +
        'Would you like me to go deeper into any particular area of renewable energy?'
    }
  ],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: {
    input_tokens: 21,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
    output_tokens: 322,
    service_tier: 'standard',
    inference_geo: 'global'
  }
}

*/