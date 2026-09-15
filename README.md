# Dollnest — dollneststore.co.uk

İngiltere'ye reborn bebek satan online mağaza + yönetim paneli.
**Next.js 16 · React 19 · Tailwind v4 · Supabase · Vercel**

- Mağaza: ana sayfa, ürün listesi/filtre/arama, ürün detayı, sepet, checkout (Stripe gelene kadar WhatsApp/Etsy), iletişim, UK yasal sayfaları (Privacy, Terms, Cookies, Delivery & Returns)
- WhatsApp butonu: +44 7577 199805 (tüm sayfalarda, ürün sayfasında ürüne özel mesajla)
- Admin (`/admin`): dashboard, sipariş takibi (durum, kargo, takip no, manuel sipariş kaydı), ürün ekle/düzenle/sil + fotoğraf yükleme, yorumlar, duyuru bandı ve sosyal medya linkleri
- Güvenlik: Postgres RLS, server-only veri katmanı, her server action'da admin kontrolü, zod doğrulama, CSP/HSTS başlıkları
- SEO: metadata, sitemap, robots, Product / Organization / FAQ JSON-LD

---

## 1. Supabase kurulumu (bir kez)

1. [supabase.com](https://supabase.com) → projeyi açarken bölge olarak **London (eu-west-2)** seçin (UK GDPR ve hız için).
2. **SQL Editor** → `supabase/migrations/20260915120000_initial_schema.sql` dosyasının tamamını yapıştırıp **Run**.
   (Tablolar, RLS politikaları, `product-images` storage bucket'ı ve kategoriler oluşur.)
3. **Authentication → Users → Add user**: `dollneststore@gmail.com` için şifreli kullanıcı oluşturun (“Auto confirm” açık).
4. SQL Editor'de bu kullanıcıyı admin yapın:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'dollneststore@gmail.com';
   ```
5. **Authentication → Sign In / Providers**: “Allow new users to sign up” kapatın (admin dışında kimse hesap açamasın).
6. **Project Settings → API Keys**: `Project URL`, `Publishable key` ve `Secret key` değerlerini alın.

## 2. Lokal geliştirme

```bash
pnpm install
cp .env.example .env.local   # Supabase değerlerini doldurun
pnpm db:seed                 # Etsy'deki 10 ürün + yorumlar veritabanına yüklenir
pnpm dev                     # http://localhost:3000  ·  admin: /admin
```

Supabase env değişkenleri olmadan da site açılır, bu durumda dahili demo katalog gösterilir.

## 3. Vercel

1. Vercel → **Add New Project** → GitHub'dan `dollneststore/dollneststore` reposunu import edin (Framework: Next.js, otomatik).
2. **Settings → Environment Variables** (Production + Preview):
   - `NEXT_PUBLIC_SITE_URL` = `https://dollneststore.co.uk`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
3. **Settings → Domains** → `dollneststore.co.uk` ve `www.dollneststore.co.uk` ekleyin, alan adı sağlayıcısında Vercel'in verdiği DNS kayıtlarını girin.
4. Bundan sonra `main` branch'ine yapılan her push otomatik deploy olur. Fonksiyonlar Londra'da çalışır (`vercel.json` → `lhr1`).

> Env değişkenleri eklendikten sonra bir kez **Redeploy** yapın. Migration'ı env'den önce çalıştırın, yoksa build hata verir.

## 4. Etsy'den tüm ürün ve yorumları çekme

Etsy sayfaları bot erişimini engellediği için resmi API kullanılıyor:

1. [etsy.com/developers/your-apps](https://www.etsy.com/developers/your-apps) → uygulama oluşturun (ücretsiz), `Keystring` ve `Shared secret` alın.
2. `.env.local` içine `ETSY_API_KEY` ve `ETSY_SHARED_SECRET` yazın.
3. Çalıştırın:
   ```bash
   pnpm import:etsy --dry-run        # sadece data/etsy-export.json'a yazar
   pnpm import:etsy --copy-images    # tüm ürünler + tüm fotoğraflar (Supabase Storage'a kopyalanır) + yorumlar
   pnpm import:etsy --update         # sonradan fiyat/stok/fotoğraf güncellemesi
   ```
4. `/admin/products` üzerinden koleksiyon, isim, "featured" ve rozetleri kontrol edin.

## 5. Proje yapısı

```
src/
  app/(shop)/          mağaza sayfaları
  app/admin/           login + (panel) altında korumalı admin sayfaları
  components/          UI (home, product, cart, site, admin)
  lib/data/            cache'li public veri erişimi + seed katalog
  lib/admin/           admin sorguları, server action'lar, zod şemaları
  lib/auth.ts          admin doğrulama (DAL)
  proxy.ts             /admin oturum yenileme
supabase/migrations/   veritabanı şeması
scripts/               seed + Etsy import
.claude/               Claude Code kuralları, komutları ve agent'ları
```

## 6. Sıradaki adımlar

- **Stripe Checkout** (kart, Apple Pay, Google Pay, Klarna): server-side fiyat hesaplama → Checkout Session → webhook ile `orders` kaydı ve stok düşümü. Şema hazır (`stripe_checkout_session_id`, `paid_at`…).
- Sipariş e-postaları (ör. Resend) ve kargo bildirimleri
- Analytics eklenecekse önce çerez onay bandı (PECR)
- Yasal metinler UK mevzuatına göre hazırlandı, yayından önce bir hukukçuya kontrol ettirin.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript kontrolü |
| `pnpm lint` | ESLint |
| `pnpm db:seed` | Başlangıç kataloğunu yükler |
| `pnpm import:etsy` | Etsy API'den ürün + yorum aktarımı |
