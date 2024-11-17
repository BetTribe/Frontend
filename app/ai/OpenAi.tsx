import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    dangerouslyAllowBrowser: true
  });

console.log("OpenAi called with key ");

const games =  [
  {
    id: 14110,
    date: '2024-10-19T00:00:00.000Z',
    visitor_name: 'Cleveland Cavaliers',
    home_name: 'Chicago Bulls',
    winner: 'Chicago Bulls'
  },
  {
    id: 14111,
    date: '2024-10-19T00:00:00.000Z',
    visitor_name: 'Miami Heat',
    home_name: 'Memphis Grizzlies',
    winner: 'Miami Heat'
  },
  {
    id: 14113,
    date: '2024-10-19T02:00:00.000Z',
    visitor_name: 'Utah Jazz',
    home_name: 'Portland Trail Blazers',
    winner: 'Portland Trail Blazers'
  },
  {
    id: 14114,
    date: '2024-10-19T02:30:00.000Z',
    visitor_name: 'Los Angeles Lakers',
    home_name: 'Golden State Warriors',
    winner: 'Golden State Warriors'
  }
  ]
export default async function resolveBet(prompt:string) {
    try {
      // Fetch NBA data for the day the bet was placed
      // Use OpenAI to determine if the bet was won or lost based on NBA data
      const systemPrompt = `
      ### Context
      I am providing you the data of games tell me if the team mentioned in the bet won or not reply as true or false
      `;
  
      const userPrompt = `The bet was: "${
        prompt
      }". Here is the sports data: ${JSON.stringify(
        games
      )}. Did the user win or lose the bet?`;
  
      const { reply } = await textGeneration(userPrompt, systemPrompt);
      console.log("Outcome:", reply);
  
      if(reply==="yes"){
        return true;
      }else{
        return false;
      }
      
    } catch (error) {
      console.error("Error resolving bet:", error);
    }
  }
  
  async function textGeneration(
    userPrompt: string,
    systemPrompt: string,
    data?: string
  ) {
    let messages = [];
    messages.push({
      role: "system",
      content: systemPrompt,
    });
    messages.push({
      role: "user",
      content: userPrompt + `Data Source ${data}`,
    });
  
    try {
      console.log("calling openAI");
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages as any,
      });
      const reply = response.choices[0].message.content;
      const cleanedReply = reply
        ?.replace(/(\*\*|__)(.*?)\1/g, "$2")
        ?.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$2")
        ?.replace(/^#+\s*(.*)$/gm, "$1")
        ?.replace(/`([^`]+)`/g, "$1")
        ?.replace(/^`|`$/g, "");
  
      return { reply: cleanedReply as string, history: messages };
    } catch (error) {
      console.error("Failed to fetch from OpenAI:", error);
      throw error;
    }
  }
  
  // ---------------
  
  interface Game {
    id: number;
    date: {
      start: string;
    };
    teams: {
      visitors: {
        name: string;
      };
      home: {
        name: string;
      };
    };
    status: {
      long: string;
    };
    scores?: {
      visitors: {
        points: number;
      };
      home: {
        points: number;
      };
    };
  }