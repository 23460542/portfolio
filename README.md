# ASCII Green Portfolio

A compact React portfolio site inspired by the ASCII/binary rhythm of `wodniack.dev`, built around draggable project dashboards, an education placeholder section, and a movable/zoomable resume viewer.

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## GitHub Pages

This site is configured for a project Pages URL:

```text
https://23460542.github.io/portfolio/
```

Vite needs the project base path in `vite.config.ts`:

```ts
base: '/portfolio/'
```

The deploy workflow in `.github/workflows/deploy.yml` builds `dist` and publishes it through GitHub Pages. In the repository settings, Pages should use **GitHub Actions** as the source. See the Vite static deployment guide:

https://vite.dev/guide/static-deploy.html

## Resume PDF

The current resume viewer uses placeholder document content. When the real resume is ready:

1. Add the file as `public/resume.pdf`.
2. Replace the placeholder document body in `src/App.tsx` with an embedded PDF viewer or a PDF.js-powered viewer.
3. Keep the existing drag and zoom controls around the document surface.

## Future AWS Hosting

The app builds to a static `dist` directory, so it can later move to AWS Amplify Hosting or an S3 + CloudFront setup without changing the application architecture. AWS Amplify supports Git-connected static and SPA hosting with continuous deployment:

https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html
