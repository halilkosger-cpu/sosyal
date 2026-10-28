/** <script type="application/ld+json"> icin guvenli JSON: '<' kacirilir, icerik script'i kapatamaz. */
export const jsonLdMetni = (veri: unknown) => JSON.stringify(veri).replace(/</g, '\\u003c');
