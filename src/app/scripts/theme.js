/* ---------------- theme ---------------- */
/* Runs in <head>, ahead of the stylesheet and of any markup, so the page is
   painted in the chosen theme once instead of flashing the default and being
   repainted. That is the whole reason this is not part of store.js, which does
   not run until the bottom of the body.

   Being that early is also why the storage key is declared here: store.js needs
   the same key, and the scripts share one top-level scope, so a single
   declaration is what stops the two from drifting onto different keys. */
const DB_KEY = "chessopening";
const THEMES = ["dark", "light"];

function themeName(){
  return document.documentElement.getAttribute("data-theme") || "dark";
}

function themeSet(name){
  document.documentElement.setAttribute(
    "data-theme", THEMES.indexOf(name) < 0 ? "dark" : name);
}

/* A stored choice wins; without one, follow the system. Anything unreadable --
   matchMedia is missing in some embedded webviews -- means "dark".

   Separate from the bootstrap below because the store can be replaced whole
   after load, by an import or a reset, and those have to resolve the theme by
   the same rule rather than leaving the page on the old one. */
function themeResolve(stored){
  if(THEMES.indexOf(stored) >= 0) return stored;
  try{
    if(window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  }catch(e){}
  return "dark";
}

/* Read raw rather than through the store, which has not loaded yet, and
   defensively: localStorage can throw on the property alone from a file:// URL,
   and the payload may be from a build that never wrote a theme. */
themeSet(themeResolve((function(){
  try{
    const saved = JSON.parse(window.localStorage.getItem(DB_KEY) || "null");
    return saved && saved.ui && saved.ui.theme;
  }catch(e){ return null; }
})()));
