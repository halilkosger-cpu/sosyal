from manim import *

# 16:9 Geniş Ekran HD Yapılandırması
config.pixel_width = 1920
config.pixel_height = 1080
config.frame_rate = 30
config.background_color = "#0B0F19"  # Derin lacivert / zanaat temalı koyu arka plan

class CiniCaySetiYolculuk(Scene):
    def construct(self):
        # ─── RENK PALETİ (Geleneksel Çini & Zanaat) ───
        TURQUOISE = "#00F0FF"
        COBALT = "#1E40AF"
        GOLD = "#F59E0B"
        TERRACOTTA = "#BA4700"
        CERAMIC_WHITE = "#F8FAFC"
        CLAY_BROWN = "#9A3412"

        # ═══════════════════════════════════════════════════════
        # 1. GİRİŞ (0 - 5 sn)
        # ═══════════════════════════════════════════════════════
        kurum_rozet = Text("ADALET BAKANLIĞI İŞYURTLARI", font="Segoe UI", font_size=24, color=GOLD, weight=BOLD)
        kurum_rozet.to_edge(UP, buff=0.8)

        ana_baslik = Text("El Yapımı Porselen Çini Çay Seti", font="Segoe UI", font_size=46, color=CERAMIC_WHITE, weight=BOLD)
        ana_baslik.next_to(kurum_rozet, DOWN, buff=0.4)

        alt_baslik = Text("Topraktan Vitrine: 6 Aşamalı Zanaat Yolculuğu", font="Segoe UI", font_size=28, color=TURQUOISE)
        alt_baslik.next_to(ana_baslik, DOWN, buff=0.3)

        # Çini Sanatı Geometrik Çerçeve
        cerceve = RoundedRectangle(corner_radius=0.4, height=4.2, width=10.5, color=TURQUOISE)
        cerceve.next_to(alt_baslik, DOWN, buff=0.5)

        # Teaser İkonlar
        ikon_toprak = Text("1. Ham Toprak", font="Segoe UI", font_size=20, color=GOLD)
        ikon_cark = Text("2. Çark & Form", font="Segoe UI", font_size=20, color=GOLD)
        ikon_firin = Text("3. 950°C Fırın", font="Segoe UI", font_size=20, color=GOLD)
        ikon_desen = Text("4. Çini Deseni", font="Segoe UI", font_size=20, color=GOLD)
        ikon_sir = Text("5. 1050°C Sır", font="Segoe UI", font_size=20, color=GOLD)
        ikon_vitrin = Text("6. Vitrin", font="Segoe UI", font_size=20, color=GOLD)

        adimlar_grup = VGroup(ikon_toprak, ikon_cark, ikon_firin, ikon_desen, ikon_sir, ikon_vitrin)
        adimlar_grup.arrange(RIGHT, buff=0.45)
        adimlar_grup.move_to(cerceve.get_center())

        self.play(FadeIn(kurum_rozet, shift=DOWN), Write(ana_baslik), run_time=1.8)
        self.play(FadeIn(alt_baslik), Create(cerceve), run_time=1.2)
        self.play(LaggedStartMap(FadeIn, adimlar_grup, shift=UP, lag_ratio=0.15), run_time=1.5)
        self.wait(0.5)

        # Sahneyi Temizle
        self.play(FadeOut(ana_baslik), FadeOut(alt_baslik), FadeOut(cerceve), FadeOut(adimlar_grup), run_time=1.0)

        # ═══════════════════════════════════════════════════════
        # 2. AŞAMA: HAM TOPRAK & KUVARS KARIŞIMI (5 - 10 sn)
        # ═══════════════════════════════════════════════════════
        asama1_baslik = Text("1. Aşama: Toprak & Kuvars Saflaştırma", font="Segoe UI", font_size=34, color=GOLD, weight=BOLD)
        asama1_baslik.next_to(kurum_rozet, DOWN, buff=0.4)

        asama1_detay = Text("%85 Doğal Kuvars, Kaolin ve Beyaz Çini Kili", font="Segoe UI", font_size=22, color=GRAY_A)
        asama1_detay.next_to(asama1_baslik, DOWN, buff=0.25)

        # Çamur Kütlesi Görselleştirme (Moleküler & Ham Parçacıklar)
        toprak_kutle = Circle(radius=1.8, color=CLAY_BROWN, fill_opacity=0.85)
        toprak_kutle.shift(DOWN * 0.8)

        kuvars1 = Dot(point=toprak_kutle.get_center() + LEFT*0.6 + UP*0.5, radius=0.18, color=WHITE)
        kuvars2 = Dot(point=toprak_kutle.get_center() + RIGHT*0.7 + DOWN*0.4, radius=0.22, color=TURQUOISE)
        kuvars3 = Dot(point=toprak_kutle.get_center() + UP*0.7, radius=0.15, color=WHITE)
        kuvars_etiket = Text("Yüksek Saflıkta Kuvars", font="Segoe UI", font_size=18, color=TURQUOISE).next_to(toprak_kutle, RIGHT, buff=0.8)
        ok_kuvars = Arrow(start=kuvars_etiket.get_left(), end=toprak_kutle.get_right(), color=TURQUOISE, buff=0.1)

        self.play(FadeIn(asama1_baslik, shift=DOWN), FadeIn(asama1_detay), DrawBorderThenFill(toprak_kutle), run_time=1.2)
        self.play(FadeIn(kuvars1), FadeIn(kuvars2), FadeIn(kuvars3), Create(ok_kuvars), Write(kuvars_etiket), run_time=1.2)
        
        # Yoğurma ve homojenleştirme animasyonu
        self.play(
            toprak_kutle.animate.scale(1.15).set_color("#854D0E"),
            Rotate(toprak_kutle, angle=PI),
            run_time=1.6
        )
        self.wait(0.5)

        self.play(FadeOut(asama1_baslik), FadeOut(asama1_detay), FadeOut(toprak_kutle), FadeOut(kuvars1), FadeOut(kuvars2), FadeOut(kuvars3), FadeOut(ok_kuvars), FadeOut(kuvars_etiket), run_time=0.8)

        # ═══════════════════════════════════════════════════════
        # 3. AŞAMA: ÇARKTA ŞEKİLLENDİRME & TORNALAMA (10 - 15 sn)
        # ═══════════════════════════════════════════════════════
        asama2_baslik = Text("2. Aşama: Usta Ellerde Çarkta Şekillendirme", font="Segoe UI", font_size=34, color=GOLD, weight=BOLD)
        asama2_baslik.next_to(kurum_rozet, DOWN, buff=0.4)

        asama2_detay = Text("Geleneksel Torna ile Demlik ve Fincan Formu Verilir", font="Segoe UI", font_size=22, color=GRAY_A)
        asama2_detay.next_to(asama2_baslik, DOWN, buff=0.25)

        # Çark Platformu
        cark_taban = Ellipse(width=5.5, height=1.2, color=GRAY, fill_opacity=0.3).shift(DOWN * 2.2)
        
        # Çamurdan Demlik / Fincan Gövdesine Morfolojik Dönüşüm
        ham_silindir = Rectangle(height=2.2, width=1.8, color="#854D0E", fill_opacity=0.8).move_to(DOWN * 0.8)
        
        # Fincan & Demlik Gövdesi
        fincan_govde = ArcPolygon(
            ORIGIN, RIGHT * 2, RIGHT * 1.6 + UP * 2.2, LEFT * 0.4 + UP * 2.2,
            color=CERAMIC_WHITE, fill_opacity=0.9
        ).move_to(DOWN * 0.8)
        
        kulp = Arc(radius=0.7, start_angle=-PI/2, angle=PI, color=CERAMIC_WHITE, stroke_width=7).next_to(fincan_govde, RIGHT, buff=-0.3)
        tabak = Ellipse(width=3.6, height=0.6, color=CERAMIC_WHITE, fill_opacity=0.9).next_to(fincan_govde, DOWN, buff=-0.2)
        fincan_tam = VGroup(fincan_govde, kulp, tabak)

        self.play(FadeIn(asama2_baslik), FadeIn(asama2_detay), Create(cark_taban), DrawBorderThenFill(ham_silindir), run_time=1.0)
        
        # Çark dönüşü ve şekil alma (Transform)
        self.play(
            Rotate(cark_taban, angle=2*PI),
            Transform(ham_silindir, fincan_tam),
            run_time=2.2
        )
        
        etiket_kurutma = Text("Gölgede 48 Saat Doğal Kurutma", font="Segoe UI", font_size=20, color=TURQUOISE).next_to(fincan_tam, UP, buff=0.4)
        self.play(FadeIn(etiket_kurutma, shift=UP), run_time=0.8)
        self.wait(0.5)

        self.play(FadeOut(asama2_baslik), FadeOut(asama2_detay), FadeOut(cark_taban), FadeOut(ham_silindir), FadeOut(etiket_kurutma), run_time=0.8)

        # ═══════════════════════════════════════════════════════
        # 4. AŞAMA: BİSKÜVİ PİŞİRİMİ (950°C FIRIN) (15 - 20 sn)
        # ═══════════════════════════════════════════════════════
        asama3_baslik = Text("3. Aşama: 950°C Bisküvi Pişirimi", font="Segoe UI", font_size=34, color=GOLD, weight=BOLD)
        asama3_baslik.next_to(kurum_rozet, DOWN, buff=0.4)

        asama3_detay = Text("İlk Fırınlama ile Toprak Sertleşir, Gözenekli Bisküvi Haline Gelir", font="Segoe UI", font_size=22, color=GRAY_A)
        asama3_detay.next_to(asama3_baslik, DOWN, buff=0.25)

        # Fırın Odası Görseli
        firin_kutu = RoundedRectangle(corner_radius=0.3, height=3.8, width=5.0, color=TERRACOTTA, fill_opacity=0.2).shift(DOWN * 0.8)
        ates_halka = Circle(radius=1.5, color=RED, fill_opacity=0.4).move_to(firin_kutu.get_center())
        sicaklik_yazi = Text("950 °C", font="Segoe UI", font_size=54, color=GOLD, weight=BOLD).move_to(firin_kutu.get_center())
        
        firin_bilgi = Text("12 Saat Kademeli Isıtma & Soğutma", font="Segoe UI", font_size=20, color=WHITE).next_to(firin_kutu, DOWN, buff=0.3)

        self.play(FadeIn(asama3_baslik), FadeIn(asama3_detay), Create(firin_kutu), run_time=1.0)
        self.play(FadeIn(ates_halka, scale=0.5), Write(sicaklik_yazi), FadeIn(firin_bilgi), run_time=1.5)
        
        # Ateş dalgalanması
        self.play(
            ates_halka.animate.scale(1.2).set_color(ORANGE),
            sicaklik_yazi.animate.set_color(RED_A),
            run_time=1.2
        )
        self.wait(0.5)

        self.play(FadeOut(asama3_baslik), FadeOut(asama3_detay), FadeOut(firin_kutu), FadeOut(ates_halka), FadeOut(sicaklik_yazi), FadeOut(firin_bilgi), run_time=0.8)

        # ═══════════════════════════════════════════════════════
        # 5. AŞAMA: TAHRİR & GELENEKSEL ÇİNİ DESENİ (20 - 25 sn)
        # ═══════════════════════════════════════════════════════
        asama4_baslik = Text("4. Aşama: El Çizimi Tahrir & Çini Boyama", font="Segoe UI", font_size=34, color=GOLD, weight=BOLD)
        asama4_baslik.next_to(kurum_rozet, DOWN, buff=0.4)

        asama4_detay = Text("Samur Fırça ile Geleneksel Lale ve Haliç Motifleri İşlenir", font="Segoe UI", font_size=22, color=GRAY_A)
        asama4_detay.next_to(asama4_baslik, DOWN, buff=0.25)

        # Çini Tabağı
        cini_tabak = Circle(radius=1.9, color=TURQUOISE, stroke_width=6, fill_color=CERAMIC_WHITE, fill_opacity=0.95).shift(DOWN * 0.8)
        
        # İç Çini Motifleri (Geleneksel Yıldız ve Çiçekler)
        ic_halka = Circle(radius=1.3, color=COBALT, stroke_width=3).move_to(cini_tabak.get_center())
        motif1 = Star(n=8, outer_radius=0.9, inner_radius=0.4, color=COBALT, fill_opacity=0.7).move_to(cini_tabak.get_center())
        lale1 = Circle(radius=0.25, color=RED, fill_opacity=0.9).move_to(cini_tabak.get_center() + UP * 0.7)
        lale2 = Circle(radius=0.25, color=RED, fill_opacity=0.9).move_to(cini_tabak.get_center() + DOWN * 0.7)
        lale3 = Circle(radius=0.25, color=RED, fill_opacity=0.9).move_to(cini_tabak.get_center() + LEFT * 0.7)
        lale4 = Circle(radius=0.25, color=RED, fill_opacity=0.9).move_to(cini_tabak.get_center() + RIGHT * 0.7)
        
        desenler = VGroup(ic_halka, motif1, lale1, lale2, lale3, lale4)

        firca_yazi = Text("Kök Boya & Kobalt Mavisi", font="Segoe UI", font_size=20, color=TURQUOISE).next_to(cini_tabak, RIGHT, buff=0.8)
        ok_firca = Arrow(start=firca_yazi.get_left(), end=cini_tabak.get_right(), color=TURQUOISE, buff=0.1)

        self.play(FadeIn(asama4_baslik), FadeIn(asama4_detay), DrawBorderThenFill(cini_tabak), run_time=1.0)
        self.play(Create(desenler), Write(firca_yazi), Create(ok_firca), run_time=2.0)
        self.wait(0.6)

        self.play(FadeOut(asama4_baslik), FadeOut(asama4_detay), FadeOut(cini_tabak), FadeOut(desenler), FadeOut(firca_yazi), FadeOut(ok_firca), run_time=0.8)

        # ═══════════════════════════════════════════════════════
        # 6. AŞAMA: SIRLAMA, 1050°C FIRIN & VİTRİN (25 - 30 sn)
        # ═══════════════════════════════════════════════════════
        asama5_baslik = Text("5. & 6. Aşama: Camsı Sırlama ve Mağaza Vitrini", font="Segoe UI", font_size=34, color=GOLD, weight=BOLD)
        asama5_baslik.next_to(kurum_rozet, DOWN, buff=0.4)

        asama5_detay = Text("1050°C Sır Fırınlaması ile Ömür Boyu Parlaklık ve Mukavemet", font="Segoe UI", font_size=22, color=GRAY_A)
        asama5_detay.next_to(asama5_baslik, DOWN, buff=0.25)

        # Tamamlanmış Nihai Çay Seti Kartı
        vitrin_kart = RoundedRectangle(corner_radius=0.4, height=4.0, width=9.2, color=TURQUOISE, fill_opacity=0.15).shift(DOWN * 0.8)
        
        tamam_yazi1 = Text("✨ %100 El Emeği Çini Porselen Çay Seti", font="Segoe UI", font_size=30, color=CERAMIC_WHITE, weight=BOLD).move_to(vitrin_kart.get_center() + UP * 1.0)
        tamam_yazi2 = Text("Hükümlülerin Meslek Eğitimiyle Üretilmiştir", font="Segoe UI", font_size=22, color=GOLD).next_to(tamam_yazi1, DOWN, buff=0.3)
        
        web_cta = Text("Online Mağazada Keşfedin: isyurtlari.com.tr", font="Segoe UI", font_size=26, color=TURQUOISE, weight=BOLD).next_to(tamam_yazi2, DOWN, buff=0.5)

        self.play(FadeIn(asama5_baslik), FadeIn(asama5_detay), Create(vitrin_kart), run_time=1.0)
        self.play(Write(tamam_yazi1), FadeIn(tamam_yazi2, shift=UP), run_time=1.5)
        self.play(FadeIn(web_cta, scale=1.1), run_time=1.2)
        self.wait(1.5)

        # Kapanış sönümleme
        self.play(FadeOut(kurum_rozet), FadeOut(asama5_baslik), FadeOut(asama5_detay), FadeOut(vitrin_kart), FadeOut(tamam_yazi1), FadeOut(tamam_yazi2), FadeOut(web_cta), run_time=1.0)
