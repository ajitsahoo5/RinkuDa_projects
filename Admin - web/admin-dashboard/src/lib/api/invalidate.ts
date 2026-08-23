type InvalidateFn = () => void;

const farmersListeners = new Set<InvalidateFn>();
const catalogListeners = new Set<InvalidateFn>();
const usersListeners = new Set<InvalidateFn>();
const settingsListeners = new Set<InvalidateFn>();

export function onFarmersInvalidate(listener: InvalidateFn): () => void {
  farmersListeners.add(listener);
  return () => farmersListeners.delete(listener);
}

export function invalidateFarmers(): void {
  for (const listener of farmersListeners) listener();
}

export function onCatalogInvalidate(listener: InvalidateFn): () => void {
  catalogListeners.add(listener);
  return () => catalogListeners.delete(listener);
}

export function invalidateCatalog(): void {
  for (const listener of catalogListeners) listener();
}

export function onUsersInvalidate(listener: InvalidateFn): () => void {
  usersListeners.add(listener);
  return () => usersListeners.delete(listener);
}

export function invalidateUsers(): void {
  for (const listener of usersListeners) listener();
}

export function onSettingsInvalidate(listener: InvalidateFn): () => void {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

export function invalidateSettings(): void {
  for (const listener of settingsListeners) listener();
}

export function invalidateRegistryData(): void {
  invalidateFarmers();
  invalidateCatalog();
  invalidateUsers();
  invalidateSettings();
}
