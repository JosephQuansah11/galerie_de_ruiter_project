# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Search engines

The app is one HTML page, so what a crawler can reach is decided in three places:

- **`src/hooks/usePageMeta.ts`** — every page sets its own `<title>`, `<meta name="description">`,
  `<link rel="canonical">` and Open Graph tags. Pages call it with their own translated copy;
  the strings live in `pageMetaLabels` in `src/i18n.ts`.
- **`public/robots.txt`** — everything behind an account (`/admin`, `/antiques`, `/about`,
  `/map`, `/cart`, `/wishlist`, `/profile`, `/preferences`) is closed to crawlers, because
  those routes answer with the sign-in page. `/login` and `/register` stay crawlable on
  purpose: they carry a `noindex` tag and a crawler that may not fetch them never sees it.
- **`scripts/generate-sitemap.mjs`** — runs after webpack (`npm run build`) and writes
  `dist/sitemap.xml` plus the absolute `Sitemap:` line in `dist/robots.txt`. It lists the pages
  a visitor reaches without an account: `/dashboard` and `/dashboard/chat`.

The site's public origin is not in the source. Pass it at build time, otherwise the sitemap
points at `http://localhost:3000` and the script says so:

```bash
SITE_URL=https://www.example.be npm run build
# or, for the container:
docker build --build-arg SITE_URL=https://www.example.be ./galerie_de_ruiter_frontend_app
```

`SITE_URL` is also what turns the `og:url` and `og:image` tags in `index.html` into the
absolute URLs a social preview needs. Add a 1200×630 image to `public/` and point
`og:image` at it for richer previews.

When the collection opens to visitors, remove the `/antiques` and `/about` lines from
`robots.txt` and add the pieces to `publicPages` in the sitemap script (the API's
`GET /api/antiques` lists them, so the script can fetch them at build time).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
