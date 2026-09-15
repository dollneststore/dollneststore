/** Public tracking page for common UK carriers, or null if unknown. */
export function trackingUrl(carrier: string | null, trackingNumber: string | null) {
  if (!trackingNumber) return null;
  const code = encodeURIComponent(trackingNumber.replace(/\s+/g, ""));
  const name = (carrier ?? "").toLowerCase();
  if (name.includes("royal mail") || /^[a-z]{2}\d{9}gb$/i.test(trackingNumber.replace(/\s+/g, ""))) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${code}`;
  }
  if (name.includes("evri") || name.includes("hermes")) return `https://www.evri.com/track/parcel/${code}`;
  if (name.includes("dpd")) return `https://track.dpd.co.uk/parcels/${code}`;
  if (name.includes("parcelforce")) return `https://www.parcelforce.com/track-trace?trackNumber=${code}`;
  return null;
}

/** Converts a UK phone number (07…, +44 7…, 0044 7…) to the digits wa.me expects. */
export function whatsappDigits(phone: string | null) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0044")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `44${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}
