import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  prompt: string;
  tone?: string;
  length?: string;
  language?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, tone = "professional", length = "medium", language = "th" }: GenerateRequest = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiApiKey = "AIzaSyDW6Ov8xShNa6HAEpDx6Q8IZK1nDPvm10c";

    const lengthInstructions = {
      short: "Keep it brief, around 50-100 words.",
      medium: "Make it moderate length, around 150-250 words.",
      long: "Make it detailed and comprehensive, around 300-500 words."
    };

    const systemPrompt = language === 'th'
      ? `คุณคือผู้เชี่ยวชาญด้านการตลาดดิจิทัลและคอนเทนต์ครีเอเตอร์ของบริษัท 'Local For You' (เว็บไซต์: https://localforyou.com/) ซึ่งให้บริการโซลูชันการตลาดและเทคโนโลยีสำหรับร้านอาหารและร้านนวดไทยโดยเฉพาะ ภารกิจของคุณคือการสร้างสรรค์คอนเทนต์สำหรับโซเชียลมีเดียเพื่อสื่อสารกับกลุ่มเป้าหมายที่เป็น 'เจ้าของกิจการ' โดยเนื้อหาต้องมีประโยชน์ น่าสนใจ และแสดงให้เห็นถึงความเชี่ยวชาญของ Local For You ในการช่วยให้ธุรกิจของพวกเขาเติบโต\n\n**สำคัญมาก: ตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาอังกฤษ**`
      : `You are a digital marketing expert and content creator for 'Local For You' (website: https://localforyou.com/), a company providing marketing and tech solutions specifically for Thai restaurants and massage shops. Your mission is to create social media content that engages the target audience of 'business owners'. The content must be useful, interesting, and demonstrate Local For You's expertise in helping their businesses grow.\n\n**VERY IMPORTANT: Respond ONLY in English, no Thai language.**`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

    const callWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            system_instruction: {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (!response.ok) {
          if (response.status === 429 && retries > 0) {
            console.warn(`Rate limited. Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callWithRetry(retries - 1, delay * 2);
          }
          const error = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, details: ${error}`);
        }

        return await response.json();
      } catch (error) {
        if (retries > 0) {
          console.warn(`Request failed. Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return callWithRetry(retries - 1, delay * 2);
        }
        throw error;
      }
    };

    const data = await callWithRetry();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      console.error("No text generated from API", data);
      return new Response(
        JSON.stringify({ error: "No content generated", apiResponse: data }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ content: generatedText }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});