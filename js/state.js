export let cFid = null;
export let cLid = null;
export let cTab = 'lesson';
export let cSidePanel = 'tasks';
export let sbOpen = true;

export let currentView = null;
export let refreshInterval = null;
export let profileUserId = null;

export let tType = 'choose';
export let pendingImages = [];
export let pendingCaptions = [];
export let pendingHintImg = null;

export function setCFid(v) {
  cFid = v;
}
export function setCLid(v) {
  cLid = v;
}
export function setCurrentView(v) {
  currentView = v;
}
export function setRefreshInterval(v) {
  refreshInterval = v;
}
export function setProfileUserId(v) {
  profileUserId = v;
}
export function setCTab(v) {
  cTab = v;
}
export function setCSidePanel(v) {
  cSidePanel = v;
}
export function setSbOpen(v) {
  sbOpen = v;
}
export function setTType(v) {
  tType = v;
}
export function setPendingImages(v) {
  pendingImages = v;
}
export function setPendingCaptions(v) {
  pendingCaptions = v;
}
export function setPendingHintImg(v) {
  pendingHintImg = v;
}
