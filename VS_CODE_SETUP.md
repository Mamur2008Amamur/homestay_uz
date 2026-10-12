# UyJoy — VS Code’da ishga tushirish

## Talablar

- Node.js 20 yoki undan yangi versiya
- pnpm 10 yoki undan yangi versiya
- MySQL/TiDB database
- Manus OAuth va SMTP Gmail secretlari

## O‘rnatish

```bash
pnpm install
```

## Environment variables

`.env` faylini loyiha root papkasida yarating. Maxfiy qiymatlarni GitHub yoki ZIP ichiga qo‘shmang.

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_SECRET=your-long-random-secret
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=UyJoy Owner
BUILT_IN_FORGE_API_URL=your-forge-url
BUILT_IN_FORGE_API_KEY=your-forge-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=UyJoy <your-gmail@gmail.com>
```

`SMTP_PASS` oddiy Gmail paroli emas, Gmail **App Password** bo‘lishi kerak. Gmail’da 2-Step Verification yoqilgan bo‘lsin.

## Database

Migration SQL fayllari `drizzle/` papkasida. Database tayyor bo‘lgach:

```bash
pnpm db:push
```

Agar production database uchun migrationni alohida qo‘llamoqchi bo‘lsangiz, `drizzle/0001_demonic_prima.sql` va `drizzle/0002_gray_manta.sql` fayllarini tartib bilan bajaring.

## Development

```bash
pnpm dev
```

Sayt odatda `http://localhost:3000` manzilida ochiladi.

## Tekshirish

```bash
pnpm check
pnpm test
pnpm build
```

`server/smtp.test.ts` Gmail SMTP credentialslarining serverga ulanishini email yubormasdan tekshiradi.

## Muhim

- `node_modules/`, `dist/`, `.env` va maxfiy keylarni ZIP yoki Git repository’ga qo‘shmang.
- Real production email uchun `EMAIL_FROM` Gmail hisobingizga mos bo‘lishi kerak.
- OAuth callback URL’ini Manus project sozlamalarida lokal va production URL’ga moslang.
