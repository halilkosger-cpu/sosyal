'use client';

import { useState } from 'react';
import { LuInstagram, LuSend, LuArrowUpRight } from 'react-icons/lu';

const HESAP = 'isyurtlari';
const PROFIL_URL = `https://www.instagram.com/${HESAP}/`;
const MESAJ_URL = `https://ig.me/m/${HESAP}`;
const GOMME_URL = `https://www.instagram.com/${HESAP}/embed`;

/**
 * Instagram bölümü.
 *
 * Resmi gömme çerçevesi (iframe) yalnızca ziyaretçi "Gönderileri burada gör"
 * dediğinde yükleniyor: sayfa hızı etkilenmiyor ve Instagram'a, kullanıcı
 * istemeden çerez/izleme isteği gitmiyor (KVKK). Mesaj butonu doğrudan
 * Instagram DM penceresini açıyor.
 */
export default function InstagramBolumu() {
  const [acik, setAcik] = useState(false);

  return (
    <section className="px-4 pt-16" aria-labelledby="instagram-baslik">
      <div className="relative mx-auto max-w-screen-xl overflow-hidden rounded-3xl bg-[#141B2D] text-[#FBF6EF]">
        {/* Instagram renklerinde yumuşak ışımalar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#F58529]/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 right-0 h-96 w-96 rounded-full bg-[#DD2A7B]/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-1/3 top-0 h-64 w-64 rounded-full bg-[#8134AF]/25 blur-3xl"
        />

        <div className="relative grid items-center gap-10 px-6 py-12 md:px-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FBF6EF]/20 bg-[#FBF6EF]/10 px-3.5 py-1.5 text-xs uppercase tracking-[0.2em]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
              </span>
              Instagram&apos;dayız
            </span>

            <h2
              id="instagram-baslik"
              className="mt-5 font-serif text-[clamp(2.25rem,7vw,4rem)] font-semibold leading-[1.02] tracking-tight"
            >
              Sorunuz mu var?
              <br />
              <em className="font-normal italic text-[#F2B47E]">Instagram&apos;dan yazın,</em>
              <br />
              hemen dönelim.
            </h2>

            <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-[#FBF6EF]/85 md:text-lg">
              Ürün, sipariş ya da kargo hakkında merak ettiğiniz her şeyi{' '}
              <strong className="font-semibold text-[#FBF6EF]">@{HESAP}</strong> hesabımıza
              doğrudan mesaj atarak sorabilirsiniz. Atölyeden yeni haberler ve ürünler de orada.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={MESAJ_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#DD2A7B]/25 transition-transform hover:-translate-y-0.5"
              >
                <LuSend aria-hidden="true" className="h-4 w-4" />
                Instagram&apos;dan mesaj at
                <LuArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <a
                href={PROFIL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2.5 rounded-xl border border-[#FBF6EF]/30 px-6 py-3 text-sm font-semibold transition-colors hover:bg-[#FBF6EF]/10"
              >
                <LuInstagram aria-hidden="true" className="h-4 w-4" />
                @{HESAP} takip et
              </a>
            </div>
          </div>

          {/* Gönderiler: tıklayınca resmi Instagram çerçevesi yüklenir */}
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-[28px] bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-[3px] shadow-2xl shadow-black/30">
              <div className="overflow-hidden rounded-[25px] bg-white">
                {acik ? (
                  <iframe
                    src={GOMME_URL}
                    title={`@${HESAP} Instagram gönderileri`}
                    loading="lazy"
                    className="block h-[520px] w-full border-0 md:h-[560px]"
                  />
                ) : (
                  <div className="flex h-[520px] flex-col items-center justify-center gap-5 bg-[#FBF6EF] px-8 text-center text-[#141B2D] md:h-[560px]">
                    <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white">
                      <LuInstagram aria-hidden="true" className="h-10 w-10" />
                    </span>
                    <div>
                      <p className="font-serif text-2xl font-semibold">@{HESAP}</p>
                      <p className="mt-1 text-sm text-[#141B2D]/70">Atölyeden son paylaşımlar</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAcik(true)}
                      className="min-h-[44px] rounded-xl bg-[#141B2D] px-6 py-3 text-sm font-semibold text-[#FBF6EF] transition-colors hover:bg-[#1f2a45]"
                    >
                      Gönderileri burada gör
                    </button>
                    <p className="max-w-[30ch] text-xs leading-relaxed text-[#141B2D]/55">
                      Düğmeye bastığınızda içerik Instagram&apos;dan yüklenir.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
