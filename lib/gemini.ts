import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function askGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const result = await geminiModel.generateContent(
    `${systemPrompt}\n\nUser: ${userMessage}`
  )
  return result.response.text()
}
