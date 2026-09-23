# Bee branch and deployment convention

Owner instruction received September 10, 2026, 09:34 EDT.

> Feature branches lead to main, main is the staging branch, staging is reviewed and deployed on its own config, staging gets promoted to production by a PR being merged from main to production.
>
> If we ever need dev, staging, production, then staging gets spun out like production.

Apply this convention to Bee delivery now. Feature changes are reviewed into main; main uses isolated staging configuration. A reviewed main-to-production PR is the promotion boundary. A future third environment is not being provisioned now.

Existing production deployment, data and secrets must be preserved while build triggers and repository configuration are corrected. No production release is authorized by the convention alone. Disable the unsafe relationship between feature pushes and production builds before pushing recovered source. Preserve exact baseline refs and provider settings, independently review the bounded change, and read back mutations.

This is a meal-level owner decision record, not an unreviewed rewrite of shared kitchen law. Journal k0085 holds the decision. Auggie coordinates implementation, Otto owns provider/security, and independent review remains separate.
