# PR Preview Builds for Bare React Native, via EAS Build

A setup guide for wiring "open a PR → get an installable build" onto a React Native CLI project with no Expo SDK dependency in the app itself.

- **Applies to:** react-native-cli (bare), with `ios/` and `android/` committed to git
- **Outcome:** Android — anyone with the link installs. iOS — registered testers via ad-hoc, or TestFlight for wider reach

---

## Before you start

- An Expo account (free) — EAS Build works for bare RN projects; you don't adopt the Expo SDK or Expo Router to use it
- Apple Developer Program membership ($99/yr) if building for iOS
- The project's native `ios/` and `android/` folders committed to git — EAS builds these directly; it does not run Expo's prebuild step on a bare project
- A GitHub repo with Actions enabled, and permission to add repo secrets

### Cost reference

| Plan | Monthly | Included | Concurrency |
|---|---|---|---|
| Free | $0 | 15 Android + 15 iOS builds, low-priority queue | 1 |
| Starter | $19 | $45 build credit, then pay-as-you-go | 1 |
| Production | $199 | $225 build credit, then pay-as-you-go | 2 |

Pay-as-you-go beyond credit: roughly $1–2/build on Android, $2–4/build on iOS, by resource class. A PR with both platforms costs about $3–6 once past the free tier.

---

## 1. Install & authenticate the CLI

Run once, locally — this is what registers your machine (and later, CI) as allowed to trigger builds.

```bash
npm install -g eas-cli
eas login
```

## 2. Register the project with EAS

From the root of the RN project:

```bash
eas init
eas build:configure
```

`eas init` creates a minimal `app.json` if one doesn't already exist — it holds only bookkeeping metadata (`extra.eas.projectId`), not an Expo config. Your native projects stay the source of truth.

> **Different from the Expo-managed flow:** In an Expo-managed app, `android.package` / `ios.bundleIdentifier` have to be declared in `app.json` before a non-interactive build will run. In a bare RN project these already exist — `applicationId` in `android/app/build.gradle`, and the bundle identifier in the Xcode project — so this step doesn't usually need extra config.

## 3. Add a `preview` build profile

This is the profile PRs will build against — internal distribution, no store submission.

```json
// eas.json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

`buildType: "apk"` matters — the default AAB format isn't directly installable by tapping a link; an APK is.

## 4. Set up credentials once, interactively

Android's keystore EAS can generate on the fly. iOS signing cannot — a distribution certificate and provisioning profile need a human in the loop the first time:

```bash
eas build --profile preview --platform ios
```

Run this without `--non-interactive`. It walks you through Apple sign-in and offers to generate the certificate and ad-hoc provisioning profile for you. Do this from any machine — the actual compile happens on Expo's cloud infrastructure, so a Mac is not required.

> **Error you'll hit if you skip this:** `Failed to set up credentials. You're in non-interactive mode. EAS CLI couldn't find any credentials suitable for internal distribution.` — CI cannot answer these prompts, so the first iOS build has to happen from a terminal, not from the pipeline.

## 5. Trigger builds from a pull request

Add the `EXPO_TOKEN` repo secret (an access token from your Expo account settings), then:

```yaml
# .github/workflows/pr-preview.yml
name: PR Preview Build

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

concurrency:
  group: pr-preview-${{ github.event.number }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - run: npm ci

      - name: Trigger EAS builds
        id: build
        run: |
          eas build --profile preview --platform all \
            --non-interactive --no-wait --json > builds.json
          echo "builds=$(cat builds.json)" >> "$GITHUB_OUTPUT"
```

## 6. Post the install links back to the PR

Same job, one more step — this reads the JSON from the previous step and comments the build pages on the PR, updating in place on new pushes rather than piling up comments:

```yaml
      # .github/workflows/pr-preview.yml (continued)
      - name: Comment install links on PR
        uses: actions/github-script@v7
        with:
          script: |
            const builds = JSON.parse(`${{ steps.build.outputs.builds }}`);
            const account = "<your-expo-account>";
            const project = "<your-project-slug>";
            const lines = builds.map(b =>
              `- **${b.platform}** — https://expo.dev/accounts/${account}/projects/${project}/builds/${b.id}`
            );
            const marker = '<!-- eas-preview-build -->';
            const body = `${marker}\n📱 **Preview build ready**\n\n${lines.join('\n')}\n\ncommit \`${context.sha.slice(0, 7)}\``;
            const { owner, repo } = context.repo;
            const issue_number = context.issue.number;
            const comments = await github.rest.issues.listComments({ owner, repo, issue_number });
            const existing = comments.data.find(c => c.body && c.body.includes(marker));
            if (existing) {
              await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
            } else {
              await github.rest.issues.createComment({ owner, repo, issue_number, body });
            }
```

Each build page has its own install button — Android visitors get a direct APK download, iOS visitors see install status against the ad-hoc profile.

---

## The iOS ceiling

No pipeline changes this: an ad-hoc build only installs on devices whose UDID was registered with Apple *before* the build ran.

| Path | Who can install | Setup cost |
|---|---|---|
| Ad-hoc (internal distribution) | Only pre-registered UDIDs, ~100/year cap | `eas device:create` per tester, then rebuild |
| TestFlight internal | Up to 100 App Store Connect team members | No UDIDs; add them as testers in App Store Connect |
| TestFlight external | Public link, effectively anyone | Requires Apple beta review (usually ~24h) per new version |

Android has no equivalent ceiling — the APK link from step 6 is installable by anyone who has it.

---

## Troubleshooting

**Build succeeds, install fails on Android** — "App not installed" usually means a previous install exists under the same `applicationId` but signed with a different key (e.g. a debug build you sideloaded earlier). Uninstall the existing app first.

**iOS build queues but never installs for a new tester** — Their device UDID wasn't registered when the build ran. Register it (`eas device:create`) and trigger a fresh build — an already-built ad-hoc binary can't retroactively include a new device.

**Builds sit "in queue" for a long time** — Expected on the Free plan — builds run at low priority behind paid-tier traffic. Starter's included credit runs builds at standard priority.

**Alternative to GitHub Actions** — EAS Workflows (`.eas/workflows/*.yml`) can trigger the same `build` job type directly from a linked GitHub repo — no Actions YAML at all. Link the repo once at `expo.dev/accounts/<you>/projects/<project>/github`, then an `on.pull_request` trigger in the workflow file replaces steps 5–6 above entirely.

---

Same underlying service as any Expo-managed EAS pipeline — the only real divergence for a bare CLI project is native folders being committed and already carrying the platform identifiers.
