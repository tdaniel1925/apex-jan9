/**
 * Get distributor display name based on their preference
 */
export function getDisplayName(
  firstName: string,
  lastName: string,
  businessName: string | null,
  displayPreference: "personal" | "business" | "both" | null
): string {
  const personalName = `${firstName} ${lastName}`;

  // Default to personal if no preference set
  if (!displayPreference || displayPreference === "personal") {
    return personalName;
  }

  // If business preference but no business name, fallback to personal
  if (!businessName) {
    return personalName;
  }

  if (displayPreference === "business") {
    return businessName;
  }

  if (displayPreference === "both") {
    return `${personalName} - ${businessName}`;
  }

  return personalName;
}
