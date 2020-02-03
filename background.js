const CSVDIFF_RENDER = "csvdiff_render";

// create 'Render' option
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: CSVDIFF_RENDER,
    title: "Render",
    contexts: ["page_action"]
  });
});

// add render handler
function csvdiff_render_handler(info, tab) {
  if (!tab) return;
  if (info.menuItemId != CSVDIFF_RENDER) return;

  chrome.tabs.sendMessage(tab.id, { action: "render_csv_files" }, function(
    response
  ) {
    console.info(response);
  });
}

chrome.contextMenus.onClicked.addListener(csvdiff_render_handler);
