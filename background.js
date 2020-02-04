const CSVDIFF_RENDER = "csvdiff_render";

// create 'Render' option
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: CSVDIFF_RENDER,
    title: "Render CSV diffs",
    contexts: ["page", "page_action"]
  });
});

function inject_csvdiff() {
  chrome.tabs.insertCSS({
    file: "css/daff.css"
  });
  chrome.tabs.executeScript({
    file: "js/daff-1.3.40.js"
  });
  chrome.tabs.executeScript({
    file: "js/jquery.slim.min-3.4.1.js"
  });
  chrome.tabs.executeScript({
    file: "js/jquery.csv.min-1.0.8.js"
  });
  chrome.tabs.executeScript({
    file: "csvdiff.js"
  });
}

const MSG_LOSS_CONN = "Could not establish connection";

// add render handler
function csvdiff_render_handler(info, tab) {
  if (!tab) return;
  if (info.menuItemId != CSVDIFF_RENDER) return;

  chrome.tabs.sendMessage(tab.id, { action: "render_csv_files" }, function(
    response
  ) {
    if (!chrome.runtime.lastError) {
      console.info(response);
      return;
    }

    const msg = chrome.runtime.lastError.message;
    if (msg.includes(MSG_LOSS_CONN)) {
      inject_csvdiff();
      console.info("Reinjected codes.");
      return;
    }
    console.error("Got expected error: " + chrome.extension.lastError.message);
  });
}

chrome.contextMenus.onClicked.addListener(csvdiff_render_handler);
