export const getSafeExternalUrl = (value: string | undefined) => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return null;

  try {
    const url = new URL(trimmedValue);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};
