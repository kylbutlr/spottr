const DATABASE_NAME = "spottr";
const DATABASE_VERSION = 1;
const NOTE_STORE = "notes";
export const PROJECTS_KEY = "projects";
export const ACTIVE_CONTEXT_KEY = "activeContext";

function storageError(error, fallback) {
  if (error?.name === "QuotaExceededError") {
    return new Error("Chrome storage is full. Export important QA sessions, then delete older screenshot-backed notes and try again.");
  }
  return new Error(fallback);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.createObjectStore(NOTE_STORE, { keyPath: "id" });
      store.createIndex("createdAt", "createdAt");
      store.createIndex("projectId", "projectId");
      store.createIndex("runId", "runId");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(storageError(request.error, "Could not open local QA note storage. Reload Spottr and try again."));
  });
}

let databasePromise;

function database() {
  databasePromise ||= openDatabase();
  return databasePromise;
}

export async function putNote(note) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(NOTE_STORE, "readwrite").objectStore(NOTE_STORE).put(note);
    request.onsuccess = () => resolve(note);
    request.onerror = () => reject(storageError(request.error, "Could not save this note locally. Export important sessions, reload Spottr, and try again."));
  });
}

export async function listNotes() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(NOTE_STORE, "readonly").objectStore(NOTE_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(storageError(request.error, "Could not read local QA notes. Reload Spottr and try again."));
  });
}

export async function getNote(noteId) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(NOTE_STORE, "readonly").objectStore(NOTE_STORE).get(noteId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(storageError(request.error, "Could not read this local QA note. Reload Spottr and try again."));
  });
}

export async function deleteNote(noteId) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(NOTE_STORE, "readwrite").objectStore(NOTE_STORE).delete(noteId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(storageError(request.error, "Could not delete this local QA note. Reload Spottr and try again."));
  });
}

export async function deleteNotesWhere(predicate) {
  const notes = await listNotes();
  const matches = notes.filter(predicate);
  await Promise.all(matches.map((note) => deleteNote(note.id)));
  return matches.length;
}

export async function getProjects() {
  const result = await chrome.storage.local.get(PROJECTS_KEY);
  return Array.isArray(result[PROJECTS_KEY]) ? result[PROJECTS_KEY] : [];
}

export async function setProjects(projects) {
  await chrome.storage.local.set({ [PROJECTS_KEY]: projects });
  return projects;
}

export async function getActiveContext() {
  const result = await chrome.storage.local.get(ACTIVE_CONTEXT_KEY);
  return result[ACTIVE_CONTEXT_KEY] || null;
}

export async function setActiveContext(activeContext) {
  await chrome.storage.local.set({ [ACTIVE_CONTEXT_KEY]: activeContext });
  return activeContext;
}
