const CSVDIFF_RENDERED = "csvdiff-rendered";
const SELECTOR_DIRECTIONAL_EXPANDER = ".directional-expander";

function expand_all_diffs(file_div, callback) {
  const expanders = file_div.find(SELECTOR_DIRECTIONAL_EXPANDER);
  if (expanders.length == 0) callback(file_div);

  const observer = new MutationObserver(function(mutations) {
    const _expanders = file_div.find(SELECTOR_DIRECTIONAL_EXPANDER);
    if (_expanders.length == 0) {
      this.disconnect();
      callback(file_div);
      return;
    }
    _expanders.get().forEach(x => x.click());
  });
  observer.observe(file_div[0], { childList: true, subtree: true });
  expanders.get().forEach(x => x.click());
}

function render_csv_file(file_div) {
  // collect lines
  let old_lines = [];
  let new_lines = [];
  lines = file_div.find(".blob-code-inner");
  lines.each(function(index) {
    // parse table row from line
    let code_marker = $(this).data("code-marker");
    line = $(this)
      .text()
      .trim();
    if (line.length == 0) return; // skip empty line

    switch (code_marker) {
      case "+": // line has been added
        new_lines.push(line);
        break;
      case "-": // line has been removed
        old_lines.push(line);
        break;
      case " ": // line has not changed
        new_lines.push(line);
        old_lines.push(line);
        break;
    }
  });

  // collect rows
  let old_rows = $.csv.toArrays(old_lines.join("\n"));
  let new_rows = $.csv.toArrays(new_lines.join("\n"));

  // compare tables
  const old_table = new daff.TableView(old_rows);
  const new_table = new daff.TableView(new_rows);
  let alignment = daff.compareTables(old_table, new_table).align();

  // generate table diff
  const data_diff = [];
  let table_diff = new daff.TableView(data_diff);
  const flags = new daff.CompareFlags();
  flags.show_unchanged_columns = true;
  const highlighter = new daff.TableDiff(alignment, flags);
  highlighter.hilite(table_diff);

  // render diff
  const diff2html = new daff.DiffRender();
  diff2html.render(table_diff);
  diff_html = diff2html.html();

  // replace html
  const html = "<div class='github-csv-diff'>" + diff_html + "</div>";
  file_div.find("div.data").html(html);
  file_div.addClass(CSVDIFF_RENDERED);
}

function render_csv_files() {
  // check diff view mode
  const diff_view = $("meta[name=diff-view]").attr("content"); // 'unified' or 'split'
  // work only in 'unified' diff view mode
  if (diff_view != "unified") {
    if (diff_view == "split") {
      console.warn("Github CSV Diff works only in 'Unified' diff view mode");
    }
    return;
  }

  // find all files in the page
  const files = $(`div#files.diff-view .file:not(.${CSVDIFF_RENDERED})`);
  files.each(function() {
    const file_div = $(this);
    // large diffs are not rendered by default, skip this file
    if (file_div.find("div.data").length == 0) return;

    // check if this is a CSV file
    filename = file_div.find("div[data-path]").data("path");
    if (!filename.match(".*.csv$")) return;

    // expand all diffs
    expand_all_diffs(file_div, render_csv_file);
  });
}

$(function() {
  render_csv_files();
});

// listen message
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "render_csv_files") {
    render_csv_files();
    sendResponse("CSV files successfully rendered.");
  }
});
