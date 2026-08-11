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

Add the Firebase settings above as repository Actions secrets. Then update the
version in `package.json` and `package-lock.json`, merge the change, and push a
matching tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The release workflow builds the app from the lockfile, retains the package as a
workflow artifact, and attaches both the archive and checksum to a GitHub
release. It can also be run manually to produce an artifact without publishing
a GitHub release.
