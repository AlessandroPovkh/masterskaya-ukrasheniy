export function buildInquiryText(product: { sku: string; title: string; url: string }) {
  return `Здравствуйте! Хочу обсудить похожую работу по мотивам ${product.sku} — «${product.title}».\n${product.url}\nПонимаю, что точное повторение может быть невозможно.`;
}

export function buildWhatsAppLink(baseUrl: string, text: string) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}text=${encodeURIComponent(text)}`;
}
