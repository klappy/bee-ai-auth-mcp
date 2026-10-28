# Package the approved hosted homepage

Existing ticket: klappy/kitchen rail/3-pass/2026-09-08-bee-hosted-homepage.
Owner verdict and bounded fire: kitchen commit96e3b767ed67de3a7b3ed9374beee6519cc67be3,
VERDICT.md blob4f6db10d0cc052bf040328e55c3d6db07f454da5. Implementation ACK:
September 11, 2026, 17:29:27 America/New_York. Source baseline main2993b9c158a9214736253d375060d91df1deaf31.

Extract the exact owner-approved HTML into one data-only module shared by protected
preview and an explicit release materializer using existing esbuild. Preserve
every byte, including warning, layout and clipboard behavior. Prepare a separate
asset directory; never modify public source or provider/build configuration.
No quota selection, billing activation or production mutation. Docs and debrief
travel with source. Independent review and current-head CI/Bugbot before merge;
cook does not merge. Existing browser evidence and owner visual acceptance stand.
