/**
 * Helper para armar el link de WhatsApp Click-to-Chat.
 * Doc: https://faq.whatsapp.com/5913398998672934
 *
 * @param number formato internacional (con o sin "+", espacios, guiones — se limpian acá)
 * @param message texto del mensaje precargado (se URL-encodea)
 * @returns URL `https://wa.me/<numero>?text=<encoded>` o "" si number no es válido
 */
export function buildWhatsAppLink(number: string, message: string): string {
  const cleanNumber = (number || "").replace(/\D/g, "");
  if (!cleanNumber) return "";
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
