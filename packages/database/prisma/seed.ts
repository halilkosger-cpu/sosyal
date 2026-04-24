import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlıyor...')

  // ─── KULLANICILAR ───────────────────────────────────────────

  const adminHash   = await bcrypt.hash('admin123!',   12)
  const lawyerHash  = await bcrypt.hash('avukat123!',  12)
  const lawyer2Hash = await bcrypt.hash('avukat456!',  12)
  const lawyer3Hash = await bcrypt.hash('avukat789!',  12)
  const familyHash  = await bcrypt.hash('aile123!',    12)
  const family2Hash = await bcrypt.hash('aile456!',    12)
  const tahliyeHash = await bcrypt.hash('tahliye123!', 12)
  const mahkumHash  = await bcrypt.hash('mahkum123!',  12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cezaevinden.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'admin@cezaevinden.com', name: 'Platform Yöneticisi',
      username: 'admin', password: adminHash,
      role: 'ADMIN', status: 'ACTIVE', verified: true, emailVerified: new Date(),
    },
  })

  const lawyer = await prisma.user.upsert({
    where: { email: 'av.mehmet@cezaevinden.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'av.mehmet@cezaevinden.com', name: 'Av. Mehmet Yılmaz',
      username: 'av.mehmet', password: lawyerHash,
      role: 'AVUKAT', status: 'ACTIVE', verified: true, baroNo: '12458',
      bio: '15 yıllık deneyimle infaz hukuku ve ceza davalarında uzmanlaşmış avukat. Cezaevi koşulları ve mahkum hakları konusunda gönüllü danışmanlık yapıyorum.',
      city: 'Ankara', emailVerified: new Date(),
    },
  })

  const lawyer2 = await prisma.user.upsert({
    where: { email: 'av.ayse@cezaevinden.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'av.ayse@cezaevinden.com', name: 'Av. Ayşe Demir',
      username: 'av.ayse', password: lawyer2Hash,
      role: 'AVUKAT', status: 'ACTIVE', verified: true, baroNo: '34891',
      bio: 'Ceza hukuku ve aile hukuku uzmanı. Özellikle kadın mahkumların ve aile üyelerinin haklarını korumak için gönüllü çalışmaktayım.',
      city: 'İstanbul', emailVerified: new Date(),
    },
  })

  const lawyer3 = await prisma.user.upsert({
    where: { email: 'av.kemal@cezaevinden.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'av.kemal@cezaevinden.com', name: 'Av. Kemal Arslan',
      username: 'av.kemal', password: lawyer3Hash,
      role: 'AVUKAT', status: 'ACTIVE', verified: true, baroNo: '9145',
      bio: 'AİHM başvuruları ve cezaevi koşullarına ilişkin idare davalarında uzmanlaştım. İnsan hakları alanında aktif çalışıyorum.',
      city: 'İzmir', emailVerified: new Date(),
    },
  })

  const family = await prisma.user.upsert({
    where: { email: 'fatma@example.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'fatma@example.com', name: 'Fatma Yıldız',
      username: 'fatmayildiz', password: familyHash,
      role: 'AILE', status: 'ACTIVE', city: 'Ankara',
      bio: 'Tutuklu yakını. Hukuki haklarımı öğrenmek için buradayım.',
      emailVerified: new Date(),
    },
  })

  const family2 = await prisma.user.upsert({
    where: { email: 'hatice@example.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'hatice@example.com', name: 'Hatice Kaya',
      username: 'haticekaya', password: family2Hash,
      role: 'AILE', status: 'ACTIVE', city: 'İstanbul',
      bio: 'Eşim tutuklu. Aileler olarak dayanışmamız çok önemli.',
      emailVerified: new Date(),
    },
  })

  const tahliye = await prisma.user.upsert({
    where: { email: 'ahmet@example.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'ahmet@example.com', name: 'Ahmet Kaya',
      username: 'ahmetkaya', password: tahliyeHash,
      role: 'TAHLIYE', status: 'ACTIVE', city: 'İzmir',
      bio: '2023\'te tahliye oldum. Yeniden topluma uyum sürecindeyim. Deneyimlerimi paylaşmak istiyorum.',
      emailVerified: new Date(),
    },
  })

  const mahkum = await prisma.user.upsert({
    where: { email: 'yusuf@example.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'yusuf@example.com', name: 'Yusuf Arslan',
      username: 'yusufarslan', password: mahkumHash,
      role: 'MAHKUM', status: 'ACTIVE', city: 'Bursa',
      bio: 'Açık cezaevindeyim. Haklarımızı öğrenmek için buradayım.',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Kullanıcılar oluşturuldu')

  // ─── GÖNDERILER ─────────────────────────────────────────────

  // Gönderileri temizle ve çeşitli içerikle yeniden oluştur
  await prisma.post.deleteMany({})
  await prisma.post.createMany({
    data: [
      // ── Sabitlenmiş gönderiler (her birinden farklı avukat/konu) ──
      {
        authorId: lawyer.id,
        content: '⚖️ 2026 HATIRLATMA: Koşullu salıverilme oranları suç tipine göre farklılaşıyor. Kasıtlı suçlarda 2/3, taksirli suçlarda 1/2, terör ve cinsel suçlarda 3/4. Hesaplama için /hesapla sayfasını kullanabilirsiniz. Sorularınız için mesaj atın.',
        category: 'Hukuki', isPinned: true,
      },
      {
        authorId: lawyer2.id,
        content: '👩‍⚖️ Kadın hükümlüler için önemli: 0-6 yaş çocuğunuz varsa çocuğunuzla birlikte kalma hakkınız bulunuyor. Hamilelik ve emzirme döneminde özel koruma şartları uygulanır. Bu hakların ihlali durumunda infaz hâkimliğine şikâyet hakkınız var. DM atabilirsiniz.',
        category: 'Hukuki', isPinned: true,
      },
      {
        authorId: lawyer3.id,
        content: '🇪🇺 AİHM\'e başvuru süresinin 6 aydan 4 aya düşürüldüğünü hatırlatırım (2022\'den itibaren). Cezaevi koşulları, avukata erişim engeli veya uzun tutukluluk konularında iç hukuk yollarını tükettikten sonra 4 ay içinde başvurulması gerekiyor. Ücretsiz bilgi için buradayım.',
        category: 'Hukuki', isPinned: true,
      },
      // ── Normal gönderiler ──
      {
        authorId: family.id,
        content: 'Açık cezaevinde izin hakkı hakkında bilgi alan var mı? Eşim açık cezaevine geçti ve haftalık izin talebinde bulunmak istiyoruz. Hangi belgeler gerekiyor?',
        category: 'Soru',
      },
      {
        authorId: tahliye.id,
        content: 'Tahliyenin üzerinden 8 ay geçti. Adli sicil kaydım silindi. Merak edenler için: e-devlet üzerinden "Adli Sicil Kaydı Sorgulama" ile takip edebilirsiniz. Yasal süre dolunca otomatik siliniyor.',
        category: 'Deneyim',
      },
      {
        authorId: family2.id,
        content: 'Görüş saatleri ve koşulları hakkında sormak istiyorum. Eşimle ayda kaç kez görüşebilirim? Kapalı cezaevinde kurallar farklı mı açık cezaevinden?',
        category: 'Soru',
      },
      {
        authorId: tahliye.id,
        content: 'Yeniden topluma uyum süreci gerçekten zorlu ama imkansız değil. SGK kaydını yaptırın, KOSGEB\'den girişimcilik desteği alabilirsiniz. İŞKUR\'a kayıt olun, ex-mahkum istihdamı için işverenlere SGK prim teşviki var.',
        category: 'Deneyim',
      },
      {
        authorId: mahkum.id,
        content: 'Açık cezaevinde okumaya devam edebilir miyim? Uzaktan eğitim (AÖF) için başvuru yapan oldu mu? Süreç nasıl işliyor?',
        category: 'Soru',
      },
      {
        authorId: family.id,
        content: 'Bu platform gerçekten çok değerli. Avukat sorularımızı yanıtlıyor, forum\'da bilgi paylaşılıyor. Yalnız hissetmiyoruz artık. Herkese teşekkürler.',
        category: 'Genel',
      },
    ],
  })
  console.log('✅ Gönderiler güncellendi')

  // ─── FORUM KONULARI ─────────────────────────────────────────

  const topicCount = await prisma.forumTopic.count()
  if (topicCount === 0) {
    const topic1 = await prisma.forumTopic.create({
      data: {
        authorId: family.id,
        title: 'Koşullu salıverilme hesaplaması nasıl yapılır?',
        content: 'Eşim 8 yıl ceza aldı ve şu an 4. yılında. Koşullu salıverilme için ne kadar ceza çekmesi gerekiyor? Suç tipine göre fark var mı? Avukatımız yok, bilgi almak istedim.',
        category: 'İnfaz Hukuku',
        isSolved: true,
        views: 1204,
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic1.id, authorId: lawyer.id, isSolution: true,
        content: 'Genel kural olarak cezanın 2/3\'ünü iyi halli çektikten sonra koşullu salıverilme hakkı doğar (5275 sayılı Kanun md. 107). 8 yıllık cezada bu yaklaşık 5 yıl 4 ay oluyor.\n\nAncak bazı suç tipleri için bu oran 3/4\'e çıkabiliyor. Suçun niteliğine ve mahkeme kararına bakmak gerekir.\n\nİyi hal, disiplin cezası almamak, kurum programlarına katılmak gibi kriterlere bağlı. Ceza infaz kurumu sosyal çalışmacısıyla görüşmelerini öneririm.',
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic1.id, authorId: family2.id,
        content: 'Bizim de aynı durumumuz vardı. Av. Mehmet Bey\'in dediği doğru. Bir de sicil kaydında iyi hal görünmesi çok önemli, düzenli görüşe gidip moral vermek fark yaratıyor.',
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic1.id, authorId: lawyer2.id,
        content: 'Ek bilgi: Eğer terör suçu veya ağırlaştırılmış müebbet varsa oranlar farklı. O yüzden karar metnine bakmak şart.',
      },
    })

    const topic2 = await prisma.forumTopic.create({
      data: {
        authorId: family2.id,
        title: 'Açık cezaevine geçiş şartları — 2024 güncel',
        content: 'Eşim kapalı cezaevinde. Açık cezaevine geçiş için ne gerekiyor? Kaç yılını tamamlaması lazım, iyi hal dışında başka şart var mı?',
        category: 'İnfaz Hukuku',
        views: 892,
        isSolved: true,
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic2.id, authorId: lawyer.id, isSolution: true,
        content: 'Açık cezaevine ayrılma için:\n\n✅ Cezanın 1/5\'ini iyi halli çekmiş olmak (en az 30 gün)\n✅ Disiplin cezası almamış olmak\n✅ Risk değerlendirme puanı yeterli olmak\n✅ İnfaz hakimliğinin kararı\n\nSosyal çalışmacıya dilekçe veriliyor, ortalama 2-3 ay sürüyor. Cezanın türüne göre değişebilir.',
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic2.id, authorId: tahliye.id,
        content: 'Ben bu süreçten geçtim. Dilekçeyi kurumun sosyal çalışmacısına verdim, 6 haftada onaylandı. Belgeleri eksiksiz hazırlayın, gecikmemesi için.',
      },
    })

    const topic3 = await prisma.forumTopic.create({
      data: {
        authorId: tahliye.id,
        title: 'Tahliye sonrası iş bulma deneyimleri — paylaşalım',
        content: '6 ay önce tahliye oldum. İş bulmak gerçekten zorlu bir süreç. Kim hangi yolları denedi? Hangi sektörlerde daha kolay iş bulunuyor?',
        category: 'Tahliye Süreci',
        views: 567,
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic3.id, authorId: mahkum.id,
        content: 'Henüz tahliye olmadım ama burada okuyorum. Hazırlık için ne yapılabilir diye merak ediyorum.',
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic3.id, authorId: family.id,
        content: 'ÇALIŞMA BAKANLIĞI\'NIN işkur üzerinden ex-mahkum istihdamı teşviki var. İşverenler SGK prim desteği alıyor, bu yüzden bazıları tercih edebiliyor.',
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic3.id, authorId: lawyer2.id,
        content: 'Hukuki açıdan: Adli sicil kaydı affedilmişse çoğu iş için engel değil. Ancak kamu görevi ve bazı lisanslı meslekler için engel olabilir. Reşit olmayan kişilere yönelik suçlarda ise sürekli engel var.',
      },
    })

    const topic4 = await prisma.forumTopic.create({
      data: {
        authorId: mahkum.id,
        title: 'Cezaevinde avukatla görüşme hakkı — nasıl kullanılır?',
        content: 'Avukatla görüşme talebim defalarca reddediliyor. "Yer yok" diyorlar. Bu yasal mı? Ne yapabilirim?',
        category: 'İnfaz Hukuku',
        views: 345,
        isSolved: true,
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic4.id, authorId: lawyer3.id, isSolution: true,
        content: 'Bu kesinlikle yasal değil. CGTİHK md. 59 gereği tutuklu ve hükümlüler avukatlarıyla her zaman ve özel görüşebilir. Reddedilemez.\n\nYapmanız gerekenler:\n1. Yazılı dilekçe verin ve ret kararını yazılı isteyin\n2. İnfaz Hakimliği\'ne şikayet edin\n3. Cumhuriyet Başsavcılığı\'na şikayet edin\n\nBu konuda yardım etmekten mutluluk duyarım.',
      },
    })

    const topic5 = await prisma.forumTopic.create({
      data: {
        authorId: family2.id,
        title: 'Görüş günleri ve koşulları hakkında her şey',
        content: 'Ziyaret hakları konusunda bilgi paylaşalım. Kim kapalı, kim açık cezaevinde ziyaret yapıyor? Koşullar nasıl?',
        category: 'Aile & Ziyaret',
        views: 789,
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic5.id, authorId: lawyer.id,
        content: 'Kapalı cezaevlerinde haftada 1 kez, 1 saat (yakın) görüş hakkı var. Açık cezaevlerinde ise haftalık izin dahil daha esnek. Ziyaret edilecek kişinin izin listesine eklenmesi gerekiyor.',
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic5.id, authorId: family.id,
        content: 'Biz Ankara\'dan İzmir\'e gidiyoruz. Uzak mesafe için özel izin talep edebilirsiniz, genellikle olumlu yanıt veriyorlar.',
      },
    })

    const topic6 = await prisma.forumTopic.create({
      data: {
        authorId: tahliye.id,
        title: 'Denetimli serbestlik döneminde yükümlülükler neler?',
        content: 'Denetimli serbestliğe geçtikten sonra ne gibi yükümlülükler var? Hangi kurallara uymak gerekiyor? Biraz anlatan olursa iyi olur.',
        category: 'Tahliye Süreci',
        views: 421,
        isSolved: true,
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic6.id, authorId: lawyer.id, isSolution: true,
        content: 'Denetimli serbestlik yükümlülükleri:\n\n📌 Haftalık imza (müdürlüğe gitmek)\n📌 Belirlenen adresteyim bilgi vermek\n📌 Çalışma veya eğitim programına katılmak\n📌 Alkol/uyuşturucu kullanmamak (kontrol yapılabilir)\n📌 Yurt dışına çıkamamak (izinsiz)\n\nBu yükümlülüklere uymamak, geri cezaevine dönüşe yol açabilir. Dikkatli olun.',
      },
    })

    const topic7 = await prisma.forumTopic.create({
      data: {
        authorId: family.id,
        title: 'Psikolojik destek kaynakları — aileler için',
        content: 'Tutuklu yakını olmak gerçekten zorlu bir süreç. Psikolojik olarak nasıl başa çıkıyorsunuz? Hangi destek hizmetlerinden yararlandınız?',
        category: 'Psikolojik Destek',
        views: 312,
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic7.id, authorId: lawyer2.id,
        content: 'Aile danışma merkezleri (ADM) ücretsiz psikolojik destek sunuyor. Şehrinizde arayın. Ayrıca bazı barolar da bu konuda hizmet veriyor.',
      },
    })
    await prisma.forumReply.create({
      data: {
        topicId: topic7.id, authorId: family2.id,
        content: 'Bu platformdaki insanlarla konuşmak bile çok iyi geliyor. Yalnız olmadığımızı hissetmek önemli.',
      },
    })

    const topic8 = await prisma.forumTopic.create({
      data: {
        authorId: admin.id,
        title: 'Platform Kullanım Kuralları ve Topluluk Rehberi',
        content: 'Cezaevinden.com platformuna hoş geldiniz. Bu konuda platform kuralları ve topluluk rehberi yer almaktadır.\n\n🔹 Herkesin kimlik bilgilerini paylaşmayın\n🔹 Anonim mod seçeneğini kullanabilirsiniz\n🔹 Birbirinize saygılı olun\n🔹 Hukuki bilgileri doğrulanmış avukatlardan alın\n🔹 Şiddet içerikli paylaşımlar yasaktır\n\nSorularınız için @admin hesabına mesaj atabilirsiniz.',
        category: 'Genel',
        isPinned: true,
        views: 2341,
      },
    })

    console.log('✅ Forum konuları ve yanıtları oluşturuldu')
  }

  // ─── HUKUKİ SORULAR ─────────────────────────────────────────

  const questionCount = await prisma.legalQuestion.count()
  if (questionCount === 0) {
    const q1 = await prisma.legalQuestion.create({
      data: {
        authorId: family.id,
        title: 'Denetimli serbestlik başvurusu nasıl ve ne zaman yapılır?',
        content: 'Eşim 5 yıl ceza aldı, şu an 3. yılında. İyi halli devam ediyor. Denetimli serbestlikten ne zaman yararlanabilir? Hangi belgeler gerekiyor ve başvuruyu kim yapıyor?',
        category: 'İnfaz Hukuku',
        isAnswered: true, views: 892,
      },
    })
    await prisma.legalAnswer.create({
      data: {
        questionId: q1.id, authorId: lawyer.id, isOfficial: true, helpful: 67,
        content: 'Denetimli serbestlik için koşullu salıverilmesine 1 yıl (bazı suçlarda 2 yıl) kala başvuru yapılabilir.\n\n5 yıllık cezada koşullu salıverilme = 3 yıl 4 ay. Dolayısıyla yaklaşık 2 yıl 4 ay sonra DS başvurusu yapabilir.\n\nBaşvuru süreci:\n1. Ceza infaz kurumu sosyal çalışmacısına dilekçe\n2. İnfaz hakimliği kararı\n3. Denetimli serbestlik müdürlüğüne kayıt\n\nGerekli belgeler: dilekçe, ikametgah belgesi, sosyal çalışmacı raporu. Avukatınız bu süreçte kritik rol oynayabilir.',
      },
    })
    await prisma.legalAnswer.create({
      data: {
        questionId: q1.id, authorId: lawyer2.id, isOfficial: false, helpful: 23,
        content: 'Ek: Terör suçları, cinsel suçlar ve bazı özel suçlarda DS oranları farklıdır. Mahkeme kararına ve suç tipine bakmak gerekir. Genel hüküm değişmiş olabilir, güncel mevzuatı kontrol edin.',
      },
    })

    const q2 = await prisma.legalQuestion.create({
      data: {
        authorId: family2.id,
        title: 'Koşullu salıverilme oranları suç tipine göre nasıl değişiyor?',
        content: 'Eşim hakkında mahkeme 8 yıla hükmetti. Ama avukatımız "bu suç için 3/4 oran uygulanıyor" dedi. Hangi suçlarda 2/3, hangilerinde 3/4 uygulanıyor? Tam liste var mı?',
        category: 'İnfaz Hukuku',
        isAnswered: true, views: 634,
      },
    })
    await prisma.legalAnswer.create({
      data: {
        questionId: q2.id, authorId: lawyer.id, isOfficial: true, helpful: 89,
        content: '5275 sayılı CGTİHK md. 107\'ye göre:\n\n📌 2/3 oran (genel kural): Kasıtlı suçlar\n📌 3/4 oran: Ağırlaştırılmış müebbet, cinsel dokunulmazlığa karşı suçlar, terör suçları, uyuşturucu suçları (belirli miktarın üzeri)\n📌 1/2 oran (az): Taksirli suçlar\n\nAvukatınızın söylediği doğruysa mahkeme kararında suç maddesine bakın. Hangi madde ve fıkradan mahkum olduğu önemli.',
      },
    })

    const q3 = await prisma.legalQuestion.create({
      data: {
        authorId: mahkum.id,
        title: 'Avukatla görüşme hakkım defalarca engellendi, ne yapabilirim?',
        content: 'Kapalı cezaevindeyim. Avukatımla görüşmek istiyorum ama "yer yok", "sıra var" gibi gerekçelerle 3 haftadır engelleniyorum. Bu yasal mı? Nereye şikayet edebilirim?',
        category: 'Ceza Hukuku',
        isAnswered: true, views: 445,
      },
    })
    await prisma.legalAnswer.create({
      data: {
        questionId: q3.id, authorId: lawyer3.id, isOfficial: true, helpful: 112,
        content: 'Bu uygulama YASAYA AYKIRIDIR. CGTİHK md. 59: "Tutuklu ve hükümlüler avukatları ile her zaman ve özel görüşebilir."\n\nYapmanız gerekenler:\n1. Kurum müdürlüğüne yazılı dilekçe verin, "görüşmeyi neden reddediyorsunuz?" yazılı ret isteyin\n2. İnfaz Hakimliği\'ne şikayet dilekçesi verin\n3. Cumhuriyet Başsavcılığı\'na şikayet edin\n4. Avukatınız Baro\'ya da şikayette bulunabilir\n\nBu konuda ben de yardım edebilirim.',
      },
    })

    const q4 = await prisma.legalQuestion.create({
      data: {
        authorId: family.id,
        title: 'Cezaevinde kötü muamele iddiası için hangi yollar var?',
        content: 'Eşim cezaevinde psikolojik baskı gördüğünü söylüyor. Bu konuda ne yapabiliriz? Hangi kurumlara başvurulabilir?',
        category: 'İnsan Hakları',
        isAnswered: true, views: 523,
      },
    })
    await prisma.legalAnswer.create({
      data: {
        questionId: q4.id, authorId: lawyer3.id, isOfficial: true, helpful: 78,
        content: 'Kötü muamele iddialarında başvurulacak kurumlar:\n\n1. Cumhuriyet Başsavcılığı\'na suç duyurusu\n2. İnsan Hakları İl Kurulu\'na şikayet\n3. Türkiye İnsan Hakları ve Eşitlik Kurumu (TİHEK)\n4. Kamu Denetçisi (Ombudsman)\n5. AİHM başvurusu (iç hukuk yollarını tükettikten sonra)\n\nÖnemli: Delil koruyun. Yaralanma varsa hastane raporu alın. İfadeleri yazılı belgeleyin.',
      },
    })

    const q5 = await prisma.legalQuestion.create({
      data: {
        authorId: family2.id,
        title: 'Tahliye olan yakınım çalışmak istiyor — sabıka kaydı engel olur mu?',
        content: 'Kardeşim 2 ay önce tahliye oldu. Çeşitli işyerlerine başvurdu ama sabıka kaydı var. Adli sicil affı ne zaman ve nasıl alınıyor?',
        category: 'Sosyal Haklar',
        isAnswered: true, views: 389,
      },
    })
    await prisma.legalAnswer.create({
      data: {
        questionId: q5.id, authorId: lawyer.id, isOfficial: true, helpful: 56,
        content: 'Adli sicil affı için:\n\n5352 sayılı Kanun\'a göre cezanın çekilmesinden sonra belirli süreler geçince kayıt silinir:\n- 5 yıl ve altı hapis: Tahliyeden 3 yıl sonra\n- 5-10 yıl arası: Tahliyeden 5 yıl sonra\n\nBaşvuru: E-devlet veya Adalet Bakanlığı PTT şubelerine başvurulabilir.\n\nNot: Sabıka kaydı silinmeden de çoğu özel sektör işinde yasal engel yoktur. İşverenler talep edemez ama sorabilirler.',
      },
    })

    const q6 = await prisma.legalQuestion.create({
      data: {
        authorId: mahkum.id,
        title: 'Açık cezaevinde eğitim hakkı — AÖF kaydı yapılabilir mi?',
        content: 'Açık cezaevindeyim. Anadolu Üniversitesi\'nin Açıköğretim fakültesine kayıt yaptırmak istiyorum. Bunu nasıl yapabilirim? Cezaevi yönetimi izin vermesi şart mı?',
        category: 'Diğer',
        isAnswered: false, views: 167,
      },
    })

    const q7 = await prisma.legalQuestion.create({
      data: {
        authorId: family.id,
        title: 'Çocuklu kadın tutukluların hakları neler?',
        content: 'Kardeşim tutuklandı ve 2 yaşında çocuğu var. Çocuk yanında kalabilir mi? Cezaevinde çocukla ilgili özel haklar var mı?',
        category: 'Aile Hukuku',
        isAnswered: true, views: 298,
      },
    })
    await prisma.legalAnswer.create({
      data: {
        questionId: q7.id, authorId: lawyer2.id, isOfficial: true, helpful: 44,
        content: '0-6 yaş arası çocuklar annesiyle cezaevinde kalabilir (CGTİHK md. 69). Bunun için:\n- Anne talepte bulunmalı\n- Çocuğun yararına olduğuna dair değerlendirme yapılır\n- Cezaevinde kreş/çocuk birimi varsa tercih edilir\n\nÇocuğun diğer ebeveyn veya yakınlarıyla bakımı da mümkündür. Mahkeme karar verir.',
      },
    })

    console.log('✅ Hukuki sorular ve yanıtlar oluşturuldu')
  }

  // ─── HABERLER ───────────────────────────────────────────────

  // await prisma.news.deleteMany({}) // ⚠️ Silinmedi - mevcut haberleri koru
  await prisma.news.createMany({
    data: [
        {
          authorId: admin.id,
          title: 'Denetimli Serbestlik 2026: Güncel Oranlar ve Başvuru Süreci',
          summary: '2026 yılı itibarıyla denetimli serbestlik uygulamasındaki güncel oranlar, hangi suçların kapsama girdiği ve başvuru süreci hakkında kapsamlı rehber.',
          content: 'Denetimli serbestlik (DS), hükümlülerin cezaevinden tahliye edilmeden önce topluma yeniden uyum sağlamalarını amaçlayan önemli bir infaz kurumudur.\n\n2026 itibarıyla geçerli olan oranlar:\n\n📌 Genel kural: Cezanın tamamlanmasına 1 yıl kala DS başvurusu yapılabilir.\n📌 İyi hal şartı: Disiplin cezası almamış olmak, kurum programlarına katılmak.\n📌 Terör ve cinsel suçlar: DS kapsamı dışındadır veya özel şartlar geçerlidir.\n\nBaşvuru Süreci:\n1. Cezaevi sosyal çalışmacısına dilekçe verilir\n2. Kurum müdürlüğü değerlendirme yapar\n3. İnfaz hâkimliği onaylar\n4. Denetimli Serbestlik Müdürlüğü\'ne kayıt yapılır\n\nDS döneminde dikkat edilmesi gerekenler:\n- Belirlenen günlerde imza atmak\n- Adres değişikliğini bildirmek\n- Belirlenmiş yükümlülüklere uymak\n- Yeni suç işlememek\n\nHer ihlal, geri cezaevine dönüşle sonuçlanabilir.',
          category: 'Mevzuat', published: true,
        },
        {
          authorId: admin.id,
          title: 'Açık Ceza İnfaz Kurumuna Geçiş Rehberi — 2026',
          summary: 'Açık cezaevine geçiş şartları, başvuru süreci ve sık sorulan sorular. 2026 güncel bilgileriyle hazırlanmış kapsamlı rehber.',
          content: 'Açık ceza infaz kurumları, kapalı cezaevine kıyasla daha özgür bir ortamda infazın tamamlanmasını sağlayan kurumlardır.\n\nGeçiş Şartları:\n✅ Cezanın 1/5\'ini iyi halli geçirmiş olmak (en az 30 gün)\n✅ Son 6 ayda disiplin cezası almamış olmak\n✅ Risk değerlendirmesinde uygun puan almak\n✅ İnfaz hâkimliğinin onayı\n\nBaşvuru:\nKurum sosyal çalışmacısına yazılı dilekçe verilir. Ortalama 2-4 hafta içinde sonuçlanır.\n\nAçık cezaevinde ne değişir?\n- Günlük serbest zaman artar\n- İzinler kullanılabilir (haftalık, bayram)\n- Çalışma imkânı doğabilir\n- Aile ile görüşmeler kolaylaşır\n\nDikkat: Bazı suç tipleri (terör, cinsel suçlar) açık cezaevine ayrılamaz.',
          category: 'Mevzuat', published: true,
        },
        {
          authorId: lawyer.id,
          title: 'Koşullu Salıverilme Nasıl Hesaplanır? 2026 Güncel Rehber',
          summary: 'Suç tipine göre koşullu salıverilme oranları, hesaplama yöntemi ve sık yapılan hatalar. Avukat görüşüyle 2026 güncel rehber.',
          content: '5275 sayılı CGTİHK\'nın 107. maddesi koşullu salıverilmeyi düzenler.\n\nOranlar (2026 geçerli):\n\n🟢 1/2 oranı: Taksirli suçlar\n🟡 2/3 oranı: Kasıtlı suçlar (genel kural)\n🔴 3/4 oranı:\n  - Ağırlaştırılmış müebbet hapis\n  - Cinsel dokunulmazlığa karşı suçlar (çocuğa karşı)\n  - Terör suçları\n  - Örgütlü uyuşturucu suçları\n\nÖrnek hesaplama:\n- 6 yıl hapis, 2/3 oran → 4 yıl çekilince KS hakkı\n- 10 yıl hapis, 3/4 oran → 7 yıl 6 ay çekilince KS hakkı\n\nÖNEMLİ: Mahkeme kararında yazan madde ve fıkraya dikkat edin. Aynı suç için bile farklı maddelerden farklı oranlar uygulanabilir.\n\nİyi hal nedir?\n- Disiplin cezası almamak\n- Kurum programlarına katılmak\n- Düzenli ziyaret/terapiye katılmak',
          category: 'Mevzuat', published: true,
        },
        {
          authorId: lawyer3.id,
          title: 'AİHM\'e Bireysel Başvuru Rehberi — Türkiye\'den Nasıl Başvurulur?',
          summary: 'Avrupa İnsan Hakları Mahkemesi\'ne bireysel başvuru nasıl yapılır? Başvuru şartları, süresi ve cezaevi şikayetleri için dikkat edilmesi gerekenler.',
          content: 'Avrupa İnsan Hakları Mahkemesi\'ne bireysel başvuru, iç hukuk yollarının tüketilmesinden itibaren 4 ay içinde yapılmalıdır (2022 değişikliği).\n\nBaşvuru Şartları:\n1. Türkiye\'nin yargı yetkisinde olmalı\n2. İç hukuk yolları tüketilmiş olmalı (Anayasa Mahkemesi dahil)\n3. Son karar tarihinden itibaren 4 ay geçmemiş olmalı\n4. AİHS kapsamında bir hak ihlali iddia edilmeli\n\nCezaevi Şikayetleri için AİHM\'e başvurulabilecek konular:\n- İşkence ve kötü muamele (Madde 3)\n- Kişi özgürlüğü ve güvenliği (Madde 5)\n- Adil yargılanma hakkı (Madde 6)\n- Özel ve aile hayatı (Madde 8)\n\nBaşvuru formu: AİHM resmi sitesinden indirilebilir (echr.coe.int)\nAvukat zorunlu değil ama şiddetle tavsiye edilir.\n\nDikkat: Eksik veya usule aykırı başvurular reddedilir.',
          category: 'İnsan Hakları', published: true,
        },
        {
          authorId: admin.id,
          title: 'Tahliye Sonrası Adli Sicil Kaydı Nasıl Silinir?',
          summary: 'Sabıka kaydının silinme şartları, süresi ve başvuru yöntemi. E-devlet üzerinden sabıka kaydı sorgulama ve silme rehberi.',
          content: '5352 sayılı Adli Sicil Kanunu\'na göre ceza çekildikten belirli süreler geçince kayıt silinir veya arşive alınır.\n\nSilme Süreleri:\n⏱ 3 yıl: 5 yıl ve altı hapis cezaları (tahliye tarihinden itibaren)\n⏱ 5 yıl: 5-10 yıl arası hapis cezaları\n⏱ 8 yıl: 10 yılın üzerindeki cezalar\n\nKendiliğinden silinir mi?\nEvet! Yasal süre dolduğunda Adalet Bakanlığı Adli Sicil ve İstatistik Genel Müdürlüğü kaydı siler.\n\nE-devlet\'ten Sorgulama:\ne-devlet.gov.tr → "Adli Sicil Kaydı Sorgulama" → TC kimlik numaranızla giriş yapın.\n\nErken silme mümkün mü?\nHayır. Yasal süre dolmadan silme mümkün değildir.\n\nNot: Sabıka kaydının var olması özel sektör işlerinde yasal engel oluşturmaz. İşverenler zorunlu olmadıkça talep edemez.',
          category: 'Hukuki Bilgi', published: true,
        },
        {
          authorId: lawyer2.id,
          title: 'Cezaevinde Avukatla Görüşme Hakkı — Kimse Engelleyemez',
          summary: 'CGTİHK kapsamında tutuklu ve hükümlülerin avukatla görüşme hakkı. Engelleme durumunda başvurulacak merciler ve şikayet yolları.',
          content: 'Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun\'un 59. maddesi açıktır:\n\n"Tutuklu ve hükümlüler avukatları ile her zaman ve özel olarak görüşebilirler."\n\nBu hak mutlaktır — kimse engelleyemez, kısıtlayamaz, sıraya koyamaz.\n\nEngelleme Durumunda Ne Yapmalı?\n\n1. Kurum müdürlüğüne yazılı dilekçe verin\n   → "Neden görüşme yapamıyorum?" sorusunu yazılı yanıt isteyin\n2. İnfaz Hâkimliği\'ne şikâyet edin\n3. Cumhuriyet Başsavcılığı\'na suç duyurusunda bulunun\n4. Avukatınız aracılığıyla baro\'ya bildirim yapın\n5. TİHEK\'e (Türkiye İnsan Hakları ve Eşitlik Kurumu) başvurun\n\nÖnemli: Şikayetlerinizi yazılı ve tarihli yapın. Tanık bulundurmaya çalışın.',
          category: 'Hukuki Bilgi', published: true,
        },
        {
          authorId: admin.id,
          title: 'Türkiye Cezaevi İstatistikleri 2026: Güncel Veriler',
          summary: 'Türkiye\'deki cezaevi nüfusu, kapasite kullanımı, açık/kapalı kurum sayısı ve tahliye oranlarına ilişkin 2026 güncel verileri.',
          content: 'Adalet Bakanlığı ve TÜİK verilerine dayanan 2026 güncel cezaevi istatistikleri:\n\n📊 Genel Tablo:\n- Toplam tutuklu/hükümlü: ~380.000\n- Kapalı ceza infaz kurumu: 358\n- Açık ceza infaz kurumu: 108\n- Toplam kapasite: ~250.000\n- Kapasite kullanımı: %145 (fazla mesai)\n\n👥 Demografik Dağılım:\n- Kadın: %4,2\n- Yabancı uyruklu: %6,8\n- İlk kez suç işleyen: %67\n\n📈 DS ve KS:\n- Denetimli serbestlikten yararlanan: ~115.000\n- Koşullu salıverilme: ~45.000 yıllık\n\nKapasite sorunu en kritik sorunların başında gelmektedir. İnsan hakları örgütleri yeni yapım yerine alternatif infaz yöntemlerinin genişletilmesini savunmaktadır.',
          category: 'İstatistik', published: true,
        },
        {
          authorId: lawyer.id,
          title: 'İzin Hakkı: Açık ve Kapalı Cezaevlerinde Farklı Uygulamalar',
          summary: 'Haftalık izin, mazeret izni, özel izin ve yol izni. Hangi koşulları karşılayan hükümlüler izin kullanabilir?',
          content: 'CGTİHK\'nın 95-100. maddeleri hükümlülerin izin haklarını düzenler.\n\nAçık Cezaevi İzinleri:\n✅ Haftalık izin: Cuma akşamı çıkış, Pazar akşamı dönüş\n✅ Bayram izni: 3 güne kadar\n✅ Özel izin: Doğum, ölüm, hastalık gibi özel durumlarda\n\nKapalı Cezaevi İzinleri:\n⚠️ Haftalık izin yok\n✅ Mazeret izni: Ağır hastalık veya ölüm durumunda refakatçiyle\n✅ Dış görüşme: Belirli dönemlerde\n\nİzin İçin Şartlar:\n- Disiplin cezası almamış olmak\n- İzin yeri (ikametgah) bildirilmiş olmak\n- Güvenlik riski bulunmamak\n\nİzin İhlali:\nGelişin geciktirilmesi veya dönülmemesi kaçma suçu oluşturur. Cezası var ve DS\'ye zarar verir.\n\nİzin talebini yazılı yapın, tarih ve imzanızı saklayın.',
          category: 'Mevzuat', published: true,
        },
        {
          authorId: admin.id,
          title: '12. Yargı Paketi 2026: İnfaz ve Yargı Sisteminde Neler Değişiyor?',
          summary: 'Adalet Bakanlığı\'nın hazırladığı 12. Yargı Paketi, Türkiye\'deki 12,5 milyon aktif davayı azaltmayı ve yargıyı hızlandırmayı hedefliyor. İnfaz ve ceza hukukunu da doğrudan etkileyen düzenlemeler gündemde.',
          content: 'Adalet Bakanlığı\'nın hazırladığı 12. Yargı Paketi, Türk yargı sisteminde köklü değişiklikler öngörüyor.\n\nPaketin Öne Çıkan Başlıkları:\n\n📌 Arabuluculuk Genişletiliyor\nBoşanma davaları dahil daha fazla alanda zorunlu arabuluculuk uygulaması başlıyor. Tarafların mahkemeye gitmeden anlaşması teşvik ediliyor.\n\n📌 "Atlamalı Temyiz" Sistemi\nBazı davalarda ara istinaf basamağı atlanarak doğrudan Yargıtay\'a gidilebilecek. Bu sayede dava sürelerinin kısalması hedefleniyor.\n\n📌 Çocuklara Karşı Suçlarda Ağırlaştırma\nÇocuklara yönelik ağır suçlarda ömür boyu hapis cezası öngörülüyor.\n\n📌 Hâkim ve Savcı Kadrosu Artışı\n12,5 milyon aktif davayı yönetmek için yargı mensupları sayısının artırılması planlanıyor.\n\n📌 İnfaza Etkisi\nPaket henüz yasalaşmadı. Meclis\'ten geçmesi durumunda infaz sürelerine ve yargılama süreçlerine doğrudan etkileri olacak.\n\nKaynak: Hürriyet / Adalet Bakanlığı açıklamaları',
          category: 'Mevzuat', published: true,
        },
        {
          authorId: admin.id,
          title: '7242 Sayılı Kanun ve COVID-19 İzni: Kapsamlı Bilgi Rehberi',
          summary: 'COVID-19 salgını döneminde açık cezaevi ve denetimli serbestlik kapsamındaki hükümlülere uygulanan özel izin düzenlemesi hakkında Adalet Bakanlığı\'nın resmi açıklamaları.',
          content: 'Adalet Bakanlığı Ceza ve Tevkifevleri Genel Müdürlüğü, COVID-19 salgını sürecinde 7242 sayılı Kanun kapsamında özel bir izin uygulaması başlattı.\n\nKimler Yararlandı?\n✅ Açık ceza infaz kurumlarındaki hükümlüler\n✅ Açık kuruma ayrılmaya hak kazananlar\n✅ Denetimli serbestlik kapsamındakiler\n\nUygulama Takvimi:\n- İlk dönem: 14 Nisan 2020 – 30 Kasım 2020\n- 1. uzatma: 30 Kasım 2020 – 31 Ocak 2021\n- 2. uzatma: 31 Ocak 2021 – 31 Mart 2021\n\nHukuki Dayanağı:\n5275 sayılı CGTİHK, 7242 sayılı Kanun Geçici Madde 9 ve 7256 sayılı Kanun\'un 31. maddesi.\n\nNeden Önemli?\nBu uygulama, olağanüstü koşullarda infaz hukukunun nasıl esneyebildiğini göstermesi bakımından emsal niteliği taşıyor. Benzer kriz dönemlerinde bu düzenlemeye atıfta bulunulabilir.\n\nKaynak: Adalet Bakanlığı CTE Genel Müdürlüğü resmi sitesi (cte.adalet.gov.tr)',
          category: 'Mevzuat', published: true,
        },
    ],
  })
  console.log('✅ Haberler güncellendi')

  // ─── DESTEK KAYNAKLARI ──────────────────────────────────────

  // Destek kaynaklarını her zaman gerçek verilerle güncelle
  // await prisma.supportResource.deleteMany({}) // ⚠️ Silinmedi - mevcut kaynakları koru
  await prisma.supportResource.createMany({
    data: [
      {
        name: 'İnsan Hakları Derneği (İHD)',
        description: 'Cezaevlerindeki insan hakları ihlallerini belgeleyen, şikayetleri takip eden ve mahkumlara ücretsiz hukuki destek sağlayan köklü sivil toplum kuruluşu. Türkiye genelinde 30+ şubesiyle faaliyet gösteriyor.',
        category: 'Hukuki Yardım', city: 'Türkiye Geneli',
        phone: '0312 417 71 80', email: 'info@ihd.org.tr',
        website: 'https://ihd.org.tr', verified: true,
      },
      {
        name: 'İstanbul Barosu — Adli Yardım Bürosu',
        description: 'Maddi imkânı yetersiz kişilere ücretsiz avukatlık hizmeti. Ceza davaları, infaz hukuku ve bireysel başvurularda uzman avukat ataması yapılıyor. Dilekçeyle başvuru yeterli.',
        category: 'Hukuki Yardım', city: 'İstanbul',
        phone: '0212 251 63 25', email: 'adliyardim@istanbulbarosu.org.tr',
        website: 'https://www.istanbulbarosu.org.tr', verified: true,
      },
      {
        name: 'Ankara Barosu — Adli Yardım Bürosu',
        description: 'Maddi durumu yetersiz kişilere Ankara Barosu tarafından sağlanan ücretsiz hukuki yardım hizmeti. Ceza ve infaz hukuku dahil tüm hukuki konularda destek.',
        category: 'Hukuki Yardım', city: 'Ankara',
        phone: '0312 416 72 00', email: 'adliyardim@ankarabarosu.org.tr',
        website: 'https://www.ankarabarosu.org.tr', verified: true,
      },
      {
        name: 'Türkiye İnsan Hakları Vakfı (TİHV)',
        description: 'İşkence ve kötü muamele mağdurlarına tıbbi ve psikolojik rehabilitasyon hizmetleri sunan vakıf. Cezaevinde kötü muameleye maruz kalanlar için belgeleme ve başvuru desteği.',
        category: 'Psikolojik Destek', city: 'Türkiye Geneli',
        phone: '0312 310 66 36', email: 'tihv@tihv.org.tr',
        website: 'https://tihv.org.tr', verified: true,
      },
      {
        name: 'İŞKUR — Türkiye İş Kurumu (ALO 170)',
        description: 'Tahliye olan bireyler için iş bulma desteği, mesleki eğitim kursları ve işe yerleştirme hizmetleri. İşkur\'a kayıtlı ex-mahkumları istihdam eden işverenlere SGK prim desteği sağlanıyor.',
        category: 'İstihdam', city: 'Türkiye Geneli',
        phone: 'ALO 170', website: 'https://www.iskur.gov.tr', verified: true,
      },
      {
        name: 'Aile ve Sosyal Hizmetler Bakanlığı (ALO 183)',
        description: '7/24 ücretsiz sosyal yardım ve destek hattı. Gıda yardımı, barınma desteği, psikolojik danışmanlık ve aile rehberliği hizmetleri. Tutuklu yakınları için sosyal hizmet uzmanına erişim.',
        category: 'Maddi Yardım', city: 'Türkiye Geneli',
        phone: 'ALO 183', website: 'https://www.aile.gov.tr', verified: true,
      },
      {
        name: 'KOSGEB — Girişimcilik Destekleri',
        description: 'Tahliye sonrası kendi işini kurmak isteyen bireyler için girişimcilik eğitimleri, hibe ve kredi destekleri. Uygulamalı Girişimcilik Eğitimi\'ni tamamlayanlara destek paketi sunuluyor.',
        category: 'İstihdam', city: 'Türkiye Geneli',
        phone: '444 1 567', website: 'https://www.kosgeb.gov.tr', verified: true,
      },
      {
        name: 'Mor Çatı Kadın Sığınağı Vakfı',
        description: 'Cezaevinden tahliye olan ve şiddete maruz kalan kadınlara barınma, hukuki destek ve psikolojik yardım. Kadın mahkum yakınları için danışma hizmetleri de mevcut.',
        category: 'Barınma & İş', city: 'İstanbul',
        phone: '0212 292 52 31', email: 'info@morcati.org.tr',
        website: 'https://www.morcati.org.tr', verified: true,
      },
      {
        name: 'Sosyal Yardımlaşma ve Dayanışma Vakıfları (SYDV)',
        description: 'Her ilçede bulunan SYDV\'ler aracılığıyla gıda, yakacak, kira ve eğitim yardımı alınabilir. Tahliye olan bireylerin ilk 6 ayda başvurabileceği en hızlı maddi destek kaynağı.',
        category: 'Maddi Yardım', city: 'Türkiye Geneli',
        phone: 'ALO 182', website: 'https://www.sosyalyardimlar.gov.tr', verified: true,
      },
      {
        name: 'Hayata Destek Derneği',
        description: 'Tahliye olan bireylere yönelik psikososyal destek, yeniden entegrasyon programları ve hukuki danışmanlık hizmetleri sunan STK. Gönüllü avukat ve psikolog ağıyla faaliyet gösteriyor.',
        category: 'Psikolojik Destek', city: 'İstanbul',
        website: 'https://www.hayatadestek.org', verified: true,
      },
    ],
  })
  console.log('✅ Destek kaynakları güncellendi')

  // ─── E-TİCARET: ÜRÜNLER ─────────────────────────────────────
  // await prisma.productCategory.deleteMany({}) // ⚠️ Silinmedi - mevcut kategorileri koru

  const gidaCategory = await prisma.productCategory.upsert({
    where: { slug: 'gida-urunleri' },
    update: {},
    create: {
      name: 'Gıda Ürünleri',
      slug: 'gida-urunleri',
      description: 'Adalet Bakanlığı İsyurtları tarafından üretilen kaliteli gıda ürünleri',
    },
  })

  const tekstilCategory = await prisma.productCategory.upsert({
    where: { slug: 'tekstil-urunleri' },
    update: {},
    create: {
      name: 'Tekstil Ürünleri',
      slug: 'tekstil-urunleri',
      description: 'Emeğinin karşılığını aldığınız kaliteli tekstil ürünleri',
    },
  })

  const ahsapCategory = await prisma.productCategory.upsert({
    where: { slug: 'ahsap-urunler' },
    update: {},
    create: {
      name: 'Ahşap Ürünler',
      slug: 'ahsap-urunler',
      description: 'El işçiliğiyle yapılmış ahşap ürünleri',
    },
  })

  const dokumaCategory = await prisma.productCategory.upsert({
    where: { slug: 'dokuma' },
    update: {},
    create: {
      name: 'Dokuma',
      slug: 'dokuma',
      description: 'Geleneksel dokuma sanatıyla yapılmış ürünler',
    },
  })

  // await prisma.product.deleteMany({}) // ⚠️ Silinmedi - mevcut ürünleri koru
  await prisma.product.createMany({
    data: [
      // Gıda Ürünleri
      {
        name: 'Badem',
        slug: 'badem',
        description: 'Adalet Bakanlığı İşyurtları bahçelerinde hassas bakımla yetiştirilen, soğuk iklim bölgelerine uygun sağlıklı badem. Vitamin E ve antioksidanlar açısından zengindir. Dişlerin sağlığını destekler ve kan şekerini dengeler. Saf halde tüketilir veya pasta, fırınlı ürünlerde kullanılabilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162041badem.jpg',
      },
      {
        name: 'Biber Reçeli',
        slug: 'biber-receli',
        description: 'İşyurtları atölyesinde seçilmiş kırmızı biberlerden el yapımı olarak hazırlanan, doğal ve katkısız reçeli. Geleneksel tarif kullanılarak yavaş pişirme yöntemiyle üretilir. Vitamin C açısından çok zengindir. Kahvaltı masasının vazgeçilmez lezzeti olarak veya peynir, taze ekmek ile eşlik eder.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162645biber receli.jpg',
      },
      {
        name: 'Biber Salçası',
        slug: 'biber-salcasi',
        description: 'Anadolu tarımsal mirasından gelen geleneksel biber salçası, güneş enerjisiyle doğal kurutmayı takiben öğütülerek hazırlanır. Kimyasal madde içermez, tamamen doğal yapımıdır. Yemek hazırlamada temel malzeme ve lezzet vericisidir. Tüm türlü körü, çorbada ve etli yemeklere uyarlanır.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162742biber salcası.jpg',
      },
      {
        name: 'Çekirdek',
        slug: 'cekirdek',
        description: 'İşyurtları bahçelerinden toprakla yetiştirilen, doğal güneş ışığında kurutulmuş sağlıklı çekirdek. Magnezyum, çinko ve E vitamini bakımından zengindir. Sinir sistemi sağlığını destekler ve enerji verir. Sade tüketilir veya tatlı, kahvaltılık ürünlere katılabilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162813çekirdek.jpg',
      },
      {
        name: 'Domates Salçası',
        slug: 'domates-salcasi',
        description: 'Özel ziraat alanlarında yetişen, olgunlaşmış domateslerin doğal güneş ışığında kurutulması ve daha sonra sos haline getirilmesi ile elde edilen saflık. Licopene (güçlü antioxidan) açısından oldukça zengindir. Bütün türlü yemek ve soslar için vazgeçilmez bir bileşendir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162823domates salcası.jpg',
      },
      {
        name: 'Fındık',
        slug: 'findik',
        description: 'Anadolu coğrafyasının en verimli fındık ürünü, işyurtları bahçelerinde dikkatli ve özverili çalışmalarla hasat ve işlenmiştir. Yüksek protein ve sağlıklı yağlar içerir. Kalp sağlığını korur ve beyin işlevini destekler. Kabuğu kırılmış veya çikolatalı haliyle tüketilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162828fındık.jpg',
      },
      {
        name: 'Haşaş Ezme',
        slug: 'hasas-ezme',
        description: 'Beyaz sesam tohumlarının işyurtlarında kavrularak, geleneksel taş değirmenlerde ezilmesiyle elde edilen doğal ürün. Kalsiyum, demir ve B vitamini açısından oldukça zengindir. Pürüzlü dokusu sayesinde tatlı ve tuzlu gıdalara uyumludur. Tahta kaşık ve tatlılarla sevilen bir ikramdır.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162847haşaşezmesi.jpg',
      },
      {
        name: 'İncir Reçeli',
        slug: 'incir-receli',
        description: 'Kuruyan incir meyvesinin işyurtlarında özverili ellerle reçel haline dönüştürülmesi, geleneksel pişirme yöntemi kullanılır. Şeker ilavesi minimal, tamamı doğal fruktoz. Sindirim sistemini güçlendirir ve tabii laksatif etkiye sahiptir. Sabah kahvaltısında veya çay saatinde vazgeçilmez.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162924incirreçeli.jpg',
      },
      {
        name: 'Kuru Baklagil',
        slug: 'kuru-baklagil',
        description: 'Nohut, kırmızı mercimek ve beyaz fasulyenin dikkatlice seçilerek karıştırıldığı sağlıklı protein kaynağı. Bitki kökenli protein ve lif açısından zengindir. Doyurucu ve besleyici bir yemektir. Çorbaya, salaş yemeğine veya pirince katılarak pişirilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162931kurubakliyat.jpg',
      },
      {
        name: 'Pirinç',
        slug: 'pirnic',
        description: 'İşyurtları tarımsal alanlarında üretilen, kaliteli ve pişmesi hızlı pirinç çeşidi. İyi depolama koşullarında sürdürülen ürün, vitamin B kompleksi ve mineraller açısından zengindir. Kolay pişer ve tüm pirinç yemeğine uyarlanır. Aile sofrasının temel karbonhidrat kaynağıdır.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162936pirinc.jpg',
      },
      {
        name: 'Sarı Üzüm (Kuru Üzüm)',
        slug: 'sari-uzum',
        description: 'Taze üzümün doğal güneş ışığında kurutulmasıyla elde edilen doğal şeker kaynağı. Şeker, demir ve antioksidanlar açısından zengindir. Çocukların sağlıklı atıştırması ve sporcuların enerji kaynağıdır. Tatlılara, pasta ve cerealye katılabilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162942sarıüzüm.jpg',
      },
      {
        name: 'Siyah Üzüm (Kuru Üzüm)',
        slug: 'siyah-uzum',
        description: 'Seçkin siyah üzüm çeşidinin doğal kurutulması ile elde edilen, antioksidanlar açısından oldukça zengin ürün. Koyu renkli ve daha tatlı tadı vardır. Bağışıklık sistemini güçlendirir. Gün içinde beslenme takviyesi olarak tüketilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162951siyahüzüm.jpg',
      },
      {
        name: 'Tereyağ',
        slug: 'tereyag',
        description: 'İşyurtlarının özel çiftliklerinden toplanan taze süt, geleneksel yöntemle çırpılarak elde edilen doğal tereyağ. Hiçbir katkı maddesi, boyarmadde veya koruyucu içermez. Vitamin A açısından zengindir ve kemiş sağlığı destekler. Kahvaltı masasının lezzet kaynağı ve pişirme malzemesidir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022162956tereyağ.jpg',
      },
      {
        name: 'Üzüm Pekmezi',
        slug: 'uzum-pekmezi',
        description: 'Taze üzümün yavaşça kaynattılarak doğal şekeri konsantre edilmesiyle elde edilen sağlıklı tatlandırıcı. Şeker ilavesi yoktur, tamamen doğal üzüm özüdür. Demir, kalsiyum ve potasyum açısından zengindir. Tahıl ürünlerine ve tatlılara katılabilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022163002üzüm pekmezi.jpg',
      },
      {
        name: 'Yer Fıstığı',
        slug: 'yer-fistagi',
        description: 'Çiftlik alanlarında bakımla yetiştirilen yer fıstığının doğal ve sağlıklı şekilde hasat edilmesi. Bitki kökenli protein açısından oldukça zengindir ve uzun süre enerji verir. Kalp sağlığını ve beyin fonksiyonlarını destekler. Sade veya rozgelé haliyle tüketilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022163009yerfıstığı.jpg',
      },
      {
        name: 'Yeşil Zeytin',
        slug: 'yesil-zeytin',
        description: 'İşyurtları tarımsal bölgelerinden toprakta yetiştirilen, erken hasat edilen yeşil zeytinin işlenmiş halidir. Tuz ve doğal koruyucular kullanılarak tat dengesi sağlanır. Kan basıncını ve kolesterol seviyesini düşürmeye yardımcı olur. Meze olarak veya salatalara katılabilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022163015yeşilzeytin.jpg',
      },
      {
        name: 'Zeytinyağ',
        slug: 'zeytinyag',
        description: 'İşyurtlarının özel bahçelerinden hasat edilen, soğuk preslenmiş extra virgin zeytinyağ. Hiçbir kimyasal işlem görmemiş, doğal antioksidanlar ve polifenollerle dolu. Kalp sağlığını korur ve yaşlanma sürecini yavaşlatır. Salatada, yemeklerde ve tatlılarda kullanılabilir.',
        categoryId: gidaCategory.id,
        price: 0,
        quantity: 0,
        imageUrl: 'https://iydb.adalet.gov.tr/Resimler/Galeri/27102022163021zeytinyağ.jpg',
      },
      // Tekstil Ürünleri
      {
        name: 'Türk Bayrağı Özlü Havlu',
        slug: 'turk-bayragi-ozlu-havlu',
        description: 'İşyurtları dokuma atölyesinde yüksek kaliteli pamuktan işlenen, su emme özelliği maksimal olan havlu. Türk bayrağı deseniyle gurur konu olabilecek, her hanede olması gereken temel ev tekstili. Yumuşak dokusu cildi hırpalamaz ve uzun ömürlüdür.',
        categoryId: tekstilCategory.id,
        price: 89.99,
        quantity: 50,
      },
      {
        name: 'Organik Pamuk Çarşaf Seti',
        slug: 'organik-pamuk-carsaf-seti',
        description: '100% organik pamuktan işyurtlarının tekstil atölyesinde dikkatlice dokuma yapılan, dermatolog onaylı çarşaf seti. Pestisit ve kimyasal madde içermez. Cilt hassasiyeti olan çocuk ve yetişkinler için ideal seçimdir. Rahat uyku ve terletici olmayan rahat rahatlık sağlar.',
        categoryId: tekstilCategory.id,
        price: 349.99,
        quantity: 30,
      },
      {
        name: 'El Dokuma Halı - 150x100cm',
        slug: 'el-dokuma-hali-150x100',
        description: 'İşyurtlarının dokuma ustalarının saat saat emek vermesiyle, geleneksel tezgahlarda dokunmuş benzersiz tasarımlı halı. Her halı orijinal ve farklı motif içerir. El sanatının en güzel örneklerinden biri. Yaşlı ile müzisyen ve insanlar tarafından tarifi yapılmıştır.',
        categoryId: dokumaCategory.id,
        price: 899.99,
        quantity: 10,
      },
      {
        name: 'Ahşap Kesme Tahtası Seti',
        slug: 'ahsap-kesme-tahtasi-seti',
        description: 'İşyurtlarının marangozluk atölyesinde, doğal ceviz ağacından titizlikle işlenen kesme tahtaları seti. Antibakteriyel özelliklere sahip ahşap malzeme, gıda güvenliğini sağlar. Dayanıklı ve uzun ömürlü. Mutfağın vazgeçilmez aracı ve hediye olarak mükemmel seçim.',
        categoryId: ahsapCategory.id,
        price: 199.99,
        quantity: 20,
      },
      {
        name: 'Evde Dokuma Mermerli Mendil',
        slug: 'mermerli-mendil',
        description: 'İşyurtlarının tekstil atölyesinde dokuma tezgahlarında göz dostu mermerli desenleriyle işlenen, makinede yıkanabilir kaliteli mendil. Koleksiyonculuk ve hediye almaya değer tasarım. Ev dekorasyonuna ve el sanatları çalışmasına uygun.',
        categoryId: tekstilCategory.id,
        price: 29.99,
        quantity: 100,
      },
      {
        name: 'Ahşap Mutfak Takımı (5 Parça)',
        slug: 'ahsap-mutfak-takimi',
        description: 'İşyurtlarının marangozluk ustalarınca kayın ağacından titizlikle işlenen, gıda güvenliği sertifikaları olan mutfak aletleri seti. Kaşık, spatula ve diğer aletler harmanlı olarak paketlenmiştir. Doğal, güvenilir, estetik ve fonksiyonel.',
        categoryId: ahsapCategory.id,
        price: 279.99,
        quantity: 15,
      },
      {
        name: 'İçi Pamuk Yastık',
        slug: 'ici-pamuk-yastig',
        description: 'İşyurtlarında dermatolog kontrolü ve tıbbi testler geçirmiş, hipoalerjenik pamuk yastık. Boyun ve omuz desteğini mükemmel şekilde sağlar. Uyku kalitesini artırır ve servikal sorunları azaltır. Yazı döneminde ve kışında rahat bir uyku ortamı yaratır.',
        categoryId: tekstilCategory.id,
        price: 159.99,
        quantity: 40,
      },
      {
        name: 'El Sanatı Dekoratif Ahşap Kutu',
        slug: 'dekoratif-ahsap-kutu',
        description: 'İşyurtlarının el sanatları ustalarının her biri özverili olarak tasarladığı, şifreli kilit sistemiyle güvenli saklama kutusu. Kıymetli eşyaların, belgelerin veya hatıraların saklanması için ideal. Ev dekorasyonuna zarafet ve ön yüzeyine değer katar.',
        categoryId: ahsapCategory.id,
        price: 249.99,
        quantity: 25,
      },
      {
        name: 'Dokuma Şal (Merino Yün)',
        slug: 'dokuma-sal-merino-yun',
        description: 'İşyurtlarının dokuma ustalarınca merino yününden işlenen, hem yazlık hem kışlık giyilebilen çok yönlü şal. Evrensel tasarımı herkes tarafından giyilebilir. Sıcak tutarken terletmez. Konfor, stil ve işlevselliğin müdür harmanı.',
        categoryId: dokumaCategory.id,
        price: 399.99,
        quantity: 20,
      },
      {
        name: 'Organik Pamuk Elbise Kumaşı (Metre)',
        slug: 'organik-pamuk-elbise-kumasi',
        description: 'Terzi ve DIY dikiş tutkunları için işyurtlarından organic pamuk kumaş. Cilt dostu, hipoalerjenik ve nefes alabilen yapısı ile konforlu kıyafetler tasarlamaya elverişlidir. Yazı ve hafif kış kıyafetleri için ideal. Renk canlılığı korunur ve dikişi kolay.',
        categoryId: tekstilCategory.id,
        price: 79.99,
        quantity: 200,
      },
    ],
  })

  console.log('✅ Örnek e-ticaret ürünleri eklendi')

  console.log('\n✅ Seed tamamlandı!')
  console.log('─────────────────────────────────')
  console.log('Giriş bilgileri:')
  console.log('  Admin:  admin@cezaevinden.com   / admin123!')
  console.log('  Avukat: av.mehmet@cezaevinden.com / avukat123!')
  console.log('  Avukat: av.ayse@cezaevinden.com   / avukat456!')
  console.log('  Aile:   fatma@example.com          / aile123!')
  console.log('  Tahliye: ahmet@example.com         / tahliye123!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
