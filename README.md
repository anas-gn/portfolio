# Anas Gana — Portfolio (Next.js)

Next.js (App Router, TypeScript) version of the portfolio: F1-style hero, 3D helmet (three.js),
French / English switch, CV downloads and picture slots for every project.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

## Add pictures to your projects

1. Copy your screenshots into `public/images/`.
2. Open `public/js/images-config.js` and list the file paths, for example:
   ```js
   p1: ["/images/fitlek-1.png", "/images/fitlek-2.png"],
   ```
   `p1`…`p8` = the 8 projects (same order as the list), `e1`…`e3` = journey photos,
   `c1`, `c2` = internship company logos. Several images rotate; click one to enlarge.

## Update the CVs

Replace `public/cv/Anas_Gana_CV_FR.pdf` and `public/cv/Anas_Gana_CV_EN.pdf` (keep the names).

## Edit the text

* Page markup (French text): `app/content.ts`
* English translations: the `FR2EN` dictionary in `public/js/i18n.js`
* Styles: `app/globals.css`   • SEO / title: `app/layout.tsx`

## Deploy

Push to GitHub and import the repo on [Vercel](https://vercel.com) (no configuration needed).

## Credits

3D helmet "Battle Damaged Sci-fi Helmet" by theblueturtle_ (CC BY 4.0). three.js (MIT).
