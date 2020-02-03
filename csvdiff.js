const CSVDIFF_RENDERED = "csvdiff-rendered";
const SIGN_CODE_HUNK = "@@";
const SIGN_GAP_ROW = "...";

function render_csv_files() {
  // check diff view mode
  const diff_view = $("meta[name=diff-view]").attr("content"); // 'unified' or 'split'
  if (diff_view != "unified") return; // work only in 'unified' mode

  // find all files in the page
  const files = $(`div#files.diff-view .file:not(.${CSVDIFF_RENDERED})`);
  files.each(function() {
    const file_div = $(this);
    // large diffs are not rendered by default, skip this file
    if (file_div.find("div.data").length == 0) return;

    // check if this is a CSV file
    filename = file_div.find("div[data-path]").data("path");
    if (!filename.match(".*.csv$")) return;

    // collect rows
    let old_rows = [];
    let new_rows = [];
    let column_number = 0;
    lines = file_div.find(".blob-code-inner");
    lines.each(function() {
      // parse table row from line
      let code_marker = $(this).data("code-marker");
      const is_code_hunk = code_marker == undefined;
      line = $(this)
        .text()
        .trim();
      if (line.length == 0) return; // skip empty line
      if (is_code_hunk) line = '"' + line + '"';
      row = $.csv.toArray(line);
      // get column number
      if (column_number == 0 && !is_code_hunk) column_number = row.length;

      switch (code_marker) {
        case "+": // line has been added
          new_rows.push(row);
          break;
        case "-": // line has been removed
          old_rows.push(row);
          break;
        case " ": // line has not changed
          new_rows.push(row);
          old_rows.push(row);
          break;
        case undefined: // line is code hunk
          new_rows.push(row);
          old_rows.push(row);
          break;
      }
    });

    // align rows
    function _align(item, index) {
      if (item.length < column_number) {
        for (var i = 0; i <= column_number - item.length; i++) {
          item.push("...");
        }
      }
    }
    old_rows.forEach(_align);
    new_rows.forEach(_align);

    // compare tables
    const old_table = new daff.TableView(old_rows);
    const new_table = new daff.TableView(new_rows);
    let alignment = daff.compareTables(old_table, new_table).align();

    // generate table diff
    const data_diff = [];
    let table_diff = new daff.TableView(data_diff);
    const flags = new daff.CompareFlags();
    flags.show_unchanged = true;
    flags.show_unchanged_columns = true;
    flags.always_show_header = false;
    const highlighter = new daff.TableDiff(alignment, flags);
    highlighter.hilite(table_diff);

    // generate gap rows
    data_diff.forEach(function(item, index) {
      if (item.length >= 2 && item[1].startsWith(SIGN_CODE_HUNK))
        item[0] = SIGN_GAP_ROW;
    });

    // render diff
    const diff2html = new daff.DiffRender();
    diff2html.render(table_diff);
    diff_html = diff2html.html();

    // replace html
    const html = "<div class='github-csv-diff'>" + diff_html + "</div>";
    file_div.find("div.data").html(html);
    file_div.addClass(CSVDIFF_RENDERED);
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
