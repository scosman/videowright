# Releasing

A normal release publishes only [`videowright`](https://www.npmjs.com/package/videowright) (`packages/lib`).

Do not release `create-videowright` as part of a normal release. See [Releasing `create-videowright`](#releasing-create-videowright-rare) for the rare cases that need it.

## 1. Prepare

```sh
git checkout main
git pull
npm ci
```

Make sure CI is green on `main`.

## 2. Check

Run the same checks as CI, plus the e2e tests:

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e -w packages/lib
```

## 3. Bump the version

Pick the bump type (semver; pre-1.0, use `minor` for breaking changes and `patch` for everything else). The command below uses `minor`; change it to `patch` or `major` as needed.

This updates `packages/lib/package.json` and the root `package-lock.json`, then commits both:

```sh
npm version minor -w packages/lib --no-git-tag-version
git commit -am "Release videowright v$(node -p "require('./packages/lib/package.json').version")"
```

## 4. Build

`npm publish` does not build. Do a clean build so `dist/` has no stale files (the build info lives in `dist/`, so this forces a full rebuild):

```sh
rm -rf packages/lib/dist
npm run build -w packages/lib
```

## 5. Check the package contents

```sh
npm pack --dry-run -w packages/lib
```

Confirm the version, and that the file list has `README.md`, `dist/`, `skill/` and `src/cli/entry/`. The `prepack` script copies the root `README.md` into the package, and `postpack` removes it again.

## 6. Publish

```sh
npm login        # if needed
npm publish -w packages/lib
# This may take a few minutes to reflect
npm view videowright version
```

`npm view` must show the new version.

## 7. Tag and push

```sh
git tag "videowright@$(node -p "require('./packages/lib/package.json').version")"
git push origin main --tags
```

## Releasing `create-videowright` (rare)

[`create-videowright`](https://www.npmjs.com/package/create-videowright) (`packages/create-videowright`) is the `npm init videowright` initializer. It is a small script that hands off to `INSTALL.md` on GitHub `main`, so it does not need a release when `videowright` changes. Changes to `INSTALL.md` go live when merged.

Release it only when its own code in `packages/create-videowright/bin/` changes (for example, a new agent to detect, or a change to the `INSTALL.md` URL). It has its own version, separate from `videowright`.

Follow the steps above, with these commands instead. It has no build step, so skip step 4.

```sh
# 3. Bump the version
npm version patch -w packages/create-videowright --no-git-tag-version
git commit -am "Release create-videowright v$(node -p "require('./packages/create-videowright/package.json').version")"

# 5. Check the package contents: expect README.md and bin/
npm pack --dry-run -w packages/create-videowright

# 6. Publish
npm publish -w packages/create-videowright
# This may take a few minutes to reflect
npm view create-videowright version

# 7. Tag and push
git tag "create-videowright@$(node -p "require('./packages/create-videowright/package.json').version")"
git push origin main --tags
```
