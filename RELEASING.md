# Releasing Baby Tracker

## Build a local release

Install the locked dependencies and create the production bundle:

```sh
npm ci
npm run release
```

The command builds the PWA, packages the contents of `dist/` as
`build/releases/baby-tracker-v<version>.tar.gz`, and writes a matching SHA-256
checksum. Extract the archive directly into the document root of any static web
host.

Vite reads the following Firebase settings while building, so set them in the
environment before creating a deployable release:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

## Publish a GitHub release

After a change reaches `main`, GitHub Actions automatically deploys the app at:

**https://sonshorty.github.io/Baby-Tracking/**

Open that address in Chrome. On Android, use **Add to Home screen** from the
Chrome menu to install the PWA.

Add the Firebase settings above as repository Actions secrets. Then update the
version in `package.json` and `package-lock.json`, merge the change, and push a
matching tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

Every push to `main` builds and deploys the app. A version tag additionally
retains the package as a workflow artifact and publishes the archive and
checksum as a GitHub release. The deployment URL is also shown on the workflow
summary. Enable **GitHub Actions** as the Pages source in the repository settings
once before the first deployment.

The workflow sets `VITE_BASE_PATH` to the repository name so that application
assets, the web app manifest, and the service worker work at a project Pages URL
`https://sonshorty.github.io/Baby-Tracking/`. It can also be run manually to
deploy the current branch and produce an artifact without publishing a GitHub
release.
