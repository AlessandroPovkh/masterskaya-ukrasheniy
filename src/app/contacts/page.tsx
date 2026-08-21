import { Suspense } from "react";
import { launchConfig } from "@/config/launch-gates";
import { ContactsPageClient } from "@/inquiry/contacts-page-client";

export default function ContactsPage(){return <main className="page-main prose-page"><p className="eyebrow">Связаться</p><h1>Обсудим форму.</h1><p className="lead">Ссылка на выбранную работу добавляется в сообщение. Похожая работа может сохранить настроение и основные параметры, но не обещает точную копию.</p><Suspense fallback={<p aria-live="polite">Готовим текст запроса…</p>}><ContactsPageClient origin={launchConfig.origin} telegramUrl={launchConfig.telegramUrl} whatsappUrl={launchConfig.whatsappUrl}/></Suspense><p className="fine-print">Для Telegram текст сначала копируется в буфер; для WhatsApp подставляется автоматически. Контактные ссылки появятся только после подтверждения владельца.</p></main>}
