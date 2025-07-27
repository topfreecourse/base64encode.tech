const charsetOptions = [
  "utf-8", "utf-16", "utf-16le", "utf-16be", "utf-32",
  "ascii", "iso-8859-1", "iso-8859-2", "iso-8859-3", "iso-8859-4", "iso-8859-5",
  "iso-8859-6", "iso-8859-7", "iso-8859-8", "iso-8859-9", "iso-8859-10",
  "iso-8859-11", "iso-8859-13", "iso-8859-14", "iso-8859-15", "iso-8859-16",
  "windows-1250", "windows-1251", "windows-1252", "windows-1253", "windows-1254",
  "windows-1255", "windows-1256", "windows-1257", "windows-1258",
  "koi8-r", "koi8-u", "macintosh", "shift_jis", "euc-jp", "iso-2022-jp",
  "gbk", "gb2312", "big5", "tis-620"
];

function populateCharsets() {
  ['encodeCharsetText', 'encodeCharsetFile'].forEach(id => {
    const select = document.getElementById(id);
    charsetOptions.forEach(cs => {
      const opt = document.createElement("option");
      opt.value = cs;
      opt.textContent = cs.toUpperCase();
      select.appendChild(opt);
    });
    select.value = "utf-8";
  });
}
populateCharsets();

function isJsonValid(str) {
  try { JSON.parse(str); return true; } catch { return false; }
}

document.getElementById("encodeInput").addEventListener("input", () => {
  const val = document.getElementById("encodeInput").value.trim();
  const status = document.getElementById("encodeJsonStatus");
  if (!val) status.textContent = "Waiting for input...";
  else if (isJsonValid(val)) {
    status.textContent = "✅ Valid JSON"; status.classList.remove("invalid");
  } else {
    status.textContent = "❌ Invalid JSON"; status.classList.add("invalid");
  }
});



function encodeBase64Advanced(text, charset, chunked = false, urlSafe = false) {
  const unicodeArray = Encoding.stringToCode(text);
  const encoded = Encoding.convert(unicodeArray, { to: charset, type: 'array' });
  let b64 = btoa(String.fromCharCode(...encoded));
  if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (chunked) b64 = b64.match(/.{1,76}/g)?.join("\n") || b64;
  return b64;
}

function encodeFromText() {
  const input = document.getElementById("encodeInput").value.trim();
  const charset = document.getElementById("encodeCharsetText").value;
  const eachLine = document.getElementById("encodeEachLine").checked;
  const chunked = document.getElementById("splitChunks").checked;
  const urlSafe = document.getElementById("urlSafe").checked;
  const newline = document.getElementById("newlineOption").value === "CRLF" ? "\r\n" : "\n";

  try {
    let result = "";
    if (eachLine) {
      const lines = input.split(/\r?\n/);
      result = lines.map(line => encodeBase64Advanced(line, charset, chunked, urlSafe)).join(newline);
    } else {
      result = encodeBase64Advanced(input, charset, chunked, urlSafe);
    }
    document.getElementById("encodeOutputText").value = result;
  } catch (err) {
    document.getElementById("encodeOutputText").value = "❌ Error: " + err.message;
  }
}

function encodeFromFile() {
  const file = document.getElementById("encodeFile").files[0];
  const charset = document.getElementById("encodeCharsetFile").value;
  const eachLine = document.getElementById("encodeEachLineFile").checked;
  const chunked = document.getElementById("splitChunksFile").checked;
  const urlSafe = document.getElementById("urlSafeFile").checked;
  const newline = document.getElementById("newlineOptionFile").value === "CRLF" ? "\r\n" : "\n";
  if (!file) return alert("Please select a file.");
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const bytes = new Uint8Array(e.target.result);
      const decodedText = Encoding.convert(bytes, { from: charset, to: "UNICODE", type: "string" });
      let result = "";
      if (eachLine) {
        const lines = decodedText.split(/\r?\n/);
        result = lines.map(line => encodeBase64Advanced(line, charset, chunked, urlSafe)).join(newline);
      } else {
        result = encodeBase64Advanced(decodedText, charset, chunked, urlSafe);
      }
      document.getElementById("encodeOutputFile").value = result;
    } catch (err) {
      document.getElementById("encodeOutputFile").value = "❌ Error: " + err.message;
    }
  };
  reader.readAsArrayBuffer(file);
}

function copyOutput(id) {
  const el = document.getElementById(id);
  el.select();
  document.execCommand("copy");
  alert("Copied to clipboard!");
}

function downloadOutput(id, type) {
  const content = document.getElementById(id).value;
  const blob = new Blob([content], { type: type === "json" ? "application/json" : "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `output.${type}`;
  a.click();
}


let liveModeEnabled = false;
let liveInputListener = null;

function toggleLiveMode() {
  const liveCheckbox = document.getElementById("liveMode");
  const encodeButton = document.querySelector('button[onclick="encodeFromText()"]');
  const charsetSelect = document.getElementById("encodeCharsetText");
  const inputField = document.getElementById("encodeInput");

  liveModeEnabled = liveCheckbox.checked;

  // Validate only UTF-8 charset
  if (liveModeEnabled && charsetSelect.value !== "utf-8") {
    alert("Live Mode only supports UTF-8 character set.");
    liveCheckbox.checked = false;
    liveModeEnabled = false;
    return;
  }

  // Disable/Enable manual options
  encodeButton.disabled = liveModeEnabled;
  charsetSelect.disabled = liveModeEnabled;

  // Add or remove live encoding listener
  if (liveModeEnabled) {
    liveInputListener = () => encodeFromText();
    inputField.addEventListener("input", liveInputListener);
  } else {
    inputField.removeEventListener("input", liveInputListener);
    liveInputListener = null;
  }
}


/* old code
let liveModeEnabled = false;

function toggleLiveMode() {
  liveModeEnabled = document.getElementById("liveMode").checked;
  const input = document.getElementById("encodeInput");
  if (liveModeEnabled) {
    if (document.getElementById("encodeCharsetText").value !== "utf-8") {
      alert("Live mode only supports UTF-8 charset.");
      document.getElementById("liveMode").checked = false;
      liveModeEnabled = false;
      return;
    }
    input.addEventListener("input", encodeFromText);
  } else {
    input.removeEventListener("input", encodeFromText);
  }
}

/*function toggleLiveMode() {
    const liveModeCheckbox = document.getElementById('liveMode');
    const encodeButton = document.querySelector('button[onclick="encodeFromText()"]');
    const charsetSelect = document.getElementById('encodeCharsetText');

    const isLive = liveModeCheckbox.checked;

    // Disable or enable based on checkbox state
    encodeButton.disabled = isLive;
    charsetSelect.disabled = isLive;
}*/
document.addEventListener('DOMContentLoaded', function () {
  
    const encodeEachLineFile = document.getElementById('encodeEachLineFile');
    const splitChunksFile = document.getElementById('splitChunksFile');   

    const encodeEachLine = document.getElementById('encodeEachLine');
    const splitChunks = document.getElementById('splitChunks');

    encodeEachLine.addEventListener('change', function () {
        splitChunks.disabled = this.checked;
    });

    splitChunks.addEventListener('change', function () {
        encodeEachLine.disabled = this.checked;
    });
     encodeEachLineFile.addEventListener('change', function () {
        splitChunksFile.disabled = this.checked;
    });

    splitChunksFile.addEventListener('change', function () {
        encodeEachLineFile.disabled = this.checked;
    });
});

