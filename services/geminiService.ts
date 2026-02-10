
import { GoogleGenAI, Type } from "@google/genai";
import { Employee } from "../types";

export const getAIInsights = async (employees: Employee[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    لديك قائمة بالموظفين مع بياناتهم البنكية: ${JSON.stringify(employees)}.
    قم بتحليل هذه البيانات وتقديم تقرير مختصر بالعربية يتضمن:
    1. توزيع الموظفين حسب البنوك.
    2. أي ملاحظات حول أرقام الحسابات (مثل التكرار أو التنسيق).
    3. توصية عامة حول إدارة وتحديث بيانات الحسابات البنكية للموظفين.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Insights Error:", error);
    return "عذراً، حدث خطأ أثناء جلب التحليلات الذكية.";
  }
};
