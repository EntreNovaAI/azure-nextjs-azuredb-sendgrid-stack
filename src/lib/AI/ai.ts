import axios from 'axios'

export async function chat(messages: { role: string; content: string }[]) {
  if (process.env.AI_PROVIDER === "azure") {
    const url = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview`
    const response = await axios.post(url, {
      messages,
      temperature: 0.2
    }, {
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_API_KEY!
      }
    })
    return response.data.choices?.[0]?.message?.content ?? ""
  } else {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })
    return response.data.choices?.[0]?.message?.content ?? ""
  }
}
