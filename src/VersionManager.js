export const getCurrentVersion = async () => {
  const versionPath = `${window.location.origin}/current-version.txt`;
  const res = await fetch(versionPath);
  return await res.text();
};