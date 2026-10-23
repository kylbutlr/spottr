const DATABASE_NAME = "spottr";
const DATABASE_VERSION = 2;
const NOTE_STORE = "notes";
const CAPTURE_STORE = "captureDrafts";
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
      if (!database.objectStoreNames.contains(NOTE_STORE)) {
        const store = database.createObjectStore(NOTE_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("projectId", "projectId");
        store.createIndex("runId", "runId");
      }
      if (!database.objectStoreNames.contains(CAPTURE_STORE)) {
        database.createObjectStore(CAPTURE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        databasePromise = undefined;
      };
      resolve(db);
    };
    request.onerror = () => reject(storageError(request.error, "Could not open local QA note storage. Reload Spottr and try again."));
  });
}

export async function putCaptureDraft(draft) {
  await writeStore(CAPTURE_STORE, (store) => {
    store.clear();
    store.put(draft);
  }, "Could not prepare this local screenshot. Try Capture area again.");
  return draft;
}

export async function getCaptureDraft(id) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(CAPTURE_STORE, "readonly").objectStore(CAPTURE_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(storageError(request.error, "Could not read this local screenshot. Try Capture area again."));
  });
}

export async function deleteCaptureDraft(id) {
  await writeStore(CAPTURE_STORE, (store) => store.delete(id), "Could not clear this local screenshot. Reload Spottr and try again.");
}

let databasePromise;

function database() {
  databasePromise ||= openDatabase().catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

async function writeStore(name, mutate, fallback) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(name, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(storageError(transaction.error, fallback));
    try {
      mutate(transaction.objectStore(name));
    } catch (error) {
      transaction.abort();
      reject(storageError(error, fallback));
    }
  });
}

export async function putNote(note) {
  await writeStore(NOTE_STORE, (store) => store.put(note), "Could not save this note locally. Export important sessions, reload Spottr, and try again.");
  return note;
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
  await writeStore(NOTE_STORE, (store) => store.delete(noteId), "Could not delete this local QA note. Reload Spottr and try again.");
}

export async function deleteNotesWhere(predicate) {
  const notes = await listNotes();
  const matches = notes.filter(predicate);
  if (matches.length) {
    await writeStore(NOTE_STORE, (store) => {
      for (const note of matches) store.delete(note.id);
    }, "Could not clear these local QA notes. Reload Spottr and try again.");
  }
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
