# Data gaps

Rows with non-empty values that cannot be normalized are listed here by the ETL. Do not infer missing values.

## Known gaps

- Price-history prose in `Notes (Price changes are listed for estimated barebone cost)` remains available as `notes`. Its free-text format is not safely convertible to dated `pricing.history` entries, so `pricing.history` stays empty until the source provides structured dates and prices.
