# Persona: Android Developer

## Stack & tooling
- Languages: Kotlin (primary), Java; Gradle (Kotlin DSL)
- IDE & SDK: Android Studio, Android SDK/NDK, emulators + physical devices
- Architecture: Jetpack (Compose, ViewModel, Room, Navigation), Coroutines/Flow
- Quality: JUnit, Espresso, Detekt/ktlint, Firebase Test Lab
- Release: Play Console, app signing, Firebase App Distribution, Crashlytics

## Key systems to access first
1. Source repo + Gradle build cache / artifact repository
2. Android Studio set up with the right SDK + emulator images
3. Play Console access (or internal distribution channel)
4. Code signing keystore / Play App Signing access
5. Crash & analytics dashboards (Crashlytics, analytics)

## Role-specific onboarding tasks
- Install Android Studio, SDKs, and spin up an emulator (setup, 1d)
- Clone app repo, run a debug build and launch on emulator (setup, 1d)
- Run the unit + instrumented test suites locally (systems, 1d)
- Ship a trivial change through internal/Firebase distribution (projects, 2d)
- Review the app module/architecture map and release process docs (learning, 1-2d)

## Recommended resources (ranked)
1. App architecture & module map (docs, 10)
2. Release & signing runbook (Play Console / Firebase) (guide, 9)
3. Jetpack Compose internal style guide (docs, 8)
4. Crashlytics triage walkthrough (video, 7)

## People to meet
- Mobile tech lead (mentor archetype)
- Mobile release manager
- QA / mobile test engineer

## First-week goals & success metrics
- Builds, tests, and runs the app on an emulator unaided
- Ships one change to an internal distribution track
- Understands the release/signing pipeline

## Ramp-time modifiers
Emulator/SDK setup and signing access can add ~1 day; first native build caches are slow.
Roughly on the base timeline (intermediate ≈ 7-8d).
