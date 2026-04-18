// localStorage persistence
const KEY = "cta_project_v1";
const KEY_VERS = "cta_versions_v1";
const KEY_SETTINGS = "cta_settings_v1";

export function saveProject(project) {
  try {
    localStorage.setItem(KEY, JSON.stringify(project));
    return true;
  } catch (e) {
    console.warn("[cta] saveProject failed", e);
    return false;
  }
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("[cta] loadProject failed", e);
    return null;
  }
}

export function saveVersion(label, project) {
  const versions = loadVersions();
  const version = {
    id: `v${Date.now()}`,
    label: label || `v${versions.length + 1}`,
    date: new Date().toISOString(),
    project,
  };
  versions.unshift(version);
  try {
    localStorage.setItem(KEY_VERS, JSON.stringify(versions.slice(0, 50)));
  } catch (e) {
    console.warn("[cta] saveVersion failed", e);
  }
  return version;
}

export function loadVersions() {
  try {
    const raw = localStorage.getItem(KEY_VERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteVersion(id) {
  const versions = loadVersions().filter(v => v.id !== id);
  localStorage.setItem(KEY_VERS, JSON.stringify(versions));
  return versions;
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
  } catch (e) {
    console.warn("[cta] saveSettings failed", e);
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAll() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(KEY_VERS);
  localStorage.removeItem(KEY_SETTINGS);
}
