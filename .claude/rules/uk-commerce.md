# UK commerce rules

- Currency GBP only; display with `formatPrice()` (en-GB). Store pence.
- Delivery is UK-only unless the business says otherwise. Validate UK postcodes with `/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i`.
- Consumer Contracts Regulations 2013: 14-day cancellation from delivery, refund within 14 days of return. Consumer Rights Act 2015 for faulty goods.
- Show trader identity: HOYD. Trading Ltd, Company No. 15656841, registered in England & Wales, registered office address (footer + contact + terms).
- UK GDPR + PECR: no non-essential cookies/analytics without prior consent. If analytics or marketing pixels are added, add a consent banner first and update `/cookies` and `/privacy`.
- Toy safety wording: dolls are not suitable for children under 3.
- Don't advertise payment options (e.g. Klarna) as available until they are live in checkout (CMA / ASA misleading advertising).
- Order numbers use the `DN-10001` sequence; keep order records for 6 years (HMRC).
