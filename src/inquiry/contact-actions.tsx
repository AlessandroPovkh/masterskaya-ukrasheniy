"use client";

export function ContactActions({ telegramUrl, whatsappUrl, text }: { telegramUrl: string | null; whatsappUrl: string | null; text: string }) {
  const openTelegram = async () => {
    if (!telegramUrl) return;
    try { await navigator.clipboard.writeText(text); } catch { /* The request stays visible on the page. */ }
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };
  return <div className="contact-actions">
    {telegramUrl ? <button className="button button-primary" type="button" onClick={openTelegram}>Скопировать запрос и открыть Telegram</button> : <span className="button button-disabled">Telegram будет подключён</span>}
    {whatsappUrl ? <a className="button button-ghost" href={whatsappUrl} rel="noreferrer">Написать в WhatsApp</a> : <span className="button button-disabled">WhatsApp будет подключён</span>}
  </div>;
}
