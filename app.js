const dropArea = document.getElementById('dropArea');
const metadataDisplay = document.getElementById('metadataDisplay');
const metadataEditor = document.getElementById('metadataEditor');
const summary = document.getElementById('summary'); 
const modelUrl = document.getElementById('modelUrl');
const resourceUrl = document.getElementById('resourceUrl');
const civitaiDisplay = document.getElementById('civitaiDisplay');
const previewImage = document.getElementById('previewImage');
const keywordDetails = document.getElementById('keywordDetails');
const notificationPanel = document.getElementById('notificationPanel');
const editorNotificationPanel = document.getElementById('editorNotificationPanel');
const editorHeader = document.getElementById('editorHeader');

const summaryFieldsInput = document.getElementById('summaryFields');
const enableSummary = document.getElementById('enableSummary');
const enableCivitAiInfo = document.getElementById('enableCivitAiInfo');
const enableTagFrequency = document.getElementById('enableTagFrequency');
const enableMetadata = document.getElementById('enableMetadata');
const enableMetadataEditor = document.getElementById('enableMetadataEditor');
const enableDateFormat = document.getElementById('enableDateFormat');
const darkMode = document.getElementById('darkMode');

let safetensorsFile;

init();

function init(){   
  initDropArea();
  initSettingsStorage();
  intiCollapsible();
  initHighlightJs();
  if(window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches) darkMode.checked = !darkMode.checked;
}

function initHighlightJs(){
  try {
    hljs.highlightElement(summary.firstChild);
    hljs.highlightElement(metadataDisplay.firstChild);
    hljs.highlightElement(keywordDetails.firstChild);
    hljs.highlightElement(civitaiDisplay.firstChild);
  } catch (error) { }
}

function initDropArea(){
  const highlight = () =>{ dropArea.classList.add('hover'); };
  const unhighlight = () =>{ dropArea.classList.remove('hover'); };

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when a file is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  // Remove highlighting when a file is dragged away from the drop area
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  dropArea.addEventListener('drop', handleDrop, false);
  dropArea.addEventListener('mouseover', highlight);
  dropArea.addEventListener('mouseout', unhighlight);

  // File input handling
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';
  fileInput.accept = '.safetensors';
  document.body.appendChild(fileInput);

  dropArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    handleFile(file);
  });
}

function intiCollapsible(){
  document.querySelectorAll('.collapsible').forEach((collapsible, i) => {
    collapsible.addEventListener('click', function () {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      if (content.style.display === 'block') {
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
      }
    });

    if (collapsible.classList.contains('expanded')) collapsible.click();
  });

  const toggleDisplay = e => {      
    const targetId = e.getAttribute('data-display');
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.style.display = e.checked ? 'block' : 'none';
    }
  };

  // Panel display toggle
  document.querySelectorAll('input[type="checkbox"][data-display]').forEach(function(checkbox) {
    checkbox.addEventListener('click', function() { toggleDisplay(this); });
    window.addEventListener('load', ()=>{ toggleDisplay(checkbox); });
  });
}

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

function handleDrop(event) {
  const dt = event.dataTransfer;
  const file = dt.files[0];
  handleFile(file);
  dropArea.classList.remove('hover');
}

function handleFile(file) {
  clearAll();
  safetensorsFile = file;
  if(!file.name.endsWith('.safetensors')) {
    notificationPanel.innerHTML = 'Please drop a valid .safetensors file.';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const dataView = new DataView(reader.result);
      const metadataSize = dataView.getUint32(0, true);
      const metadataBytes = new Uint8Array(reader.result.slice(8, 8 + metadataSize));
      const textDecoder = new TextDecoder("utf-8");
      const headerStr = textDecoder.decode(metadataBytes);
      const header = JSON.parse(headerStr);
      const formattedMetadata = header['__metadata__'];        

      if(!formattedMetadata) {
        notificationPanel.innerHTML = 'No metadata found';
        return;
      }
      const metadata = {};
      for (const key in formattedMetadata) {
        if (typeof formattedMetadata[key] === 'string') {
          try {
            metadata[key] = JSON.parse(formattedMetadata[key]);
          } catch (error) {
            metadata[key] = formattedMetadata[key];
          }
        } else {
          metadata[key] = formattedMetadata[key];
        }
      }

      updateMetadataEditor(formattedMetadata);

      formatDate(metadata, 'ss_training_started_at');
      formatDate(metadata, 'ss_training_finished_at');
      setTimeDifference(metadata, 'training_time', metadata.ss_training_started_at, metadata.ss_training_finished_at);

      updateMetadata(metadata);
      updateSummary(metadata);
      updateTagFrequency(metadata);
      updateCivitAiInfo(metadata['sshs_model_hash'], file);
    } catch (error) {
      notificationPanel.innerHTML = 'Error parsing metadata.';
      console.error(error);
    }
  };

  reader.readAsArrayBuffer(file);
}

function formatDate(metadata, prop){
  if(enableDateFormat.checked && metadata[prop])  
    metadata[prop] = new Date(metadata[prop] * 1000);     
}

function setTimeDifference(metadata, prop, date1, date2) {
  if(!enableDateFormat.checked || !date1 || !date2) 
    return;
  const date1ms = date1.getTime();
  const date2ms = date2.getTime();
  const ms = Math.abs(date2ms - date1ms);// (1000 * 60);
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  metadata[prop] = `${h}h ${m}m ${s}s`;
}

function clearAll(){
  notificationPanel.innerHTML = '';
  editorNotificationPanel.innerHTML = '';
  summary.innerHTML = '';
  modelUrl.href = '#';
  modelUrl.innerHTML = '';
  resourceUrl.href = '#';
  resourceUrl.innerHTML = '';
  previewImage.src = '';
  civitaiDisplay.innerHTML = '';
  keywordDetails.innerHTML = '';
  metadataDisplay.innerHTML = '';
  metadataEditor.value = '';
  editorHeader.style.display = "none";
}

function updateMetadata(metadata) {
  if(enableMetadata.checked) {
    metadataDisplay.innerHTML = '<code class="json">' + JSON.stringify(metadata, null, 2) + '</code>';
    try { hljs.highlightElement(metadataDisplay.firstChild); } catch (error) { }
  }
}

function updateMetadataEditor(metadata) {
  if(enableMetadataEditor.checked) {
    metadataEditor.value = JSON.stringify(metadata, null, 2);
    editorHeader.style.display = "block";
  }
}

function updateSummary(metadata) {     
  if(enableSummary.checked){
    const summaryFieldList = summaryFieldsInput.value.split(',').map(value => value.trim());;
    let summaryJson = {};
    summaryFieldList.forEach((item, index) => {
      summaryJson[item] = metadata[item];
    });

    summary.innerHTML = '<code class="json">' + JSON.stringify(summaryJson, null, 2) + '</code>';
    try { hljs.highlightElement(summary.firstChild); } catch (error) { }
  }
}

function copyToClipboard(elementId) {
  const textToCopy = document.getElementById(elementId);
  const textarea = document.createElement('textarea');
  textarea.value = textToCopy.textContent;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  alert('Text copied to clipboard!');
}

function updateCivitAiInfo(hash, file) {
  const baseApiUrl = 'https://civitai.com/api/v1/model-versions/by-hash/';
  const baseModelUrl = 'https://civitai.com/models/';
  let finalHash = hash;

  const fetchWithHash = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      return response.json();
    } catch (error) {
      console.log('There was a problem fetching the data:', error);
      return null; // Return null if fetching fails
    }
  };

  const fetchWithFallback = async () => {
    let data = hash ? await fetchWithHash(baseApiUrl + hash) : null;
    if (!data) {
      const calculatedHash = await calculateFileHash(file);
      data = await fetchWithHash(baseApiUrl + calculatedHash);
      finalHash = calculatedHash;
    }
    return data;
  };

  if (enableCivitAiInfo.checked) {
    fetchWithFallback()
      .then(data => {
        if (data) {
          modelUrl.href = baseModelUrl + data.modelId;
          modelUrl.innerHTML = modelUrl.href;
          resourceUrl.href = baseApiUrl + finalHash;
          resourceUrl.innerHTML = baseApiUrl + finalHash;
          civitaiDisplay.innerHTML = '<code class="json">' + JSON.stringify(data, null, 2) + '</code>';
          try { hljs.highlightElement(civitaiDisplay.firstChild); } catch (error) {}
          previewImage.src = data.images[0].url;
        } else {
          console.log('No valid response found.');
        }
      })
      .catch(error => {
        console.log('There was a problem:', error);
      });
  }
}
function generateSuggestedPrompt(tags) {
  // Array of blacklisted words      
  const blacklist = ["nipples", "nude", "smile", "cowboy shot", "blush", "open mouth", "1boy", "eyelashes", "looking at viewer", "hetero", "solo focus", "upper body", "closed mouth", "simple background", "white background", ];

  // Sort the tags by frequency in descending order
  let sortedTags = tags.sort((a, b) => b.frequency - a.frequency);
  
  // Filter out blacklisted words
  let filteredTags = sortedTags.filter(tag => !blacklist.includes(tag.tag.toLowerCase()));

  // Ensure the prompt has exactly 10 tags, or fewer if not enough are available
  let topTags = filteredTags.slice(0, 10);
  
  // If less than 10 tags are available after filtering, append additional tags
  let additionalTagsNeeded = 10 - topTags.length;
  if (additionalTagsNeeded > 0) {
      topTags = topTags.concat(sortedTags.slice(10, 10 + additionalTagsNeeded).filter(tag => !blacklist.includes(tag.tag.toLowerCase())));
  }

  // Create a prompt by joining the top tags
  let prompt = topTags.map(tag => tag.tag).join(', ');

  // Update the Suggested Prompt section in the HTML
  const codeElement = document.getElementById('suggested-prompt').firstElementChild;
  codeElement.textContent = prompt;
}


function updateTagFrequency(data){
  try {  
    if(enableTagFrequency.checked && data['ss_tag_frequency']){
      // Extracting and flattening the items from both objects
      const items = Object.values(data['ss_tag_frequency']).flatMap(obj => Object.entries(obj));

      // Create an object to store and sum the values
      const groupedItems = {};
      items.forEach(([key, value]) => {
        const [group, tag] = key.split('_');
        if (!groupedItems[group]) groupedItems[group] = {};
        if (!groupedItems[group][tag]) groupedItems[group][tag] = 0;
        groupedItems[group][tag] += value;
      });

      // Convert the summed items to direct tag-value pairs
      const finalResult = {};
      for (const group in groupedItems) {
        let total = 0;
        for (const tag in groupedItems[group]) {
          total += groupedItems[group][tag];
        }
        finalResult[group] = total;
      }

      // Sort the final result based on the numeric values
      const sortedResult = Object.fromEntries(
        Object.entries(finalResult).sort(([, a], [, b]) => b - a)
      );
      // Convert sortedResult to an array of objects with {tag, frequency} structure
      const tagFrequencies = Object.keys(sortedResult).map(tag => ({
          tag: tag,
          frequency: sortedResult[tag]
      }));

      keywordDetails.innerHTML = '<code class="json">' + JSON.stringify(sortedResult, null, 2) + '</code>';
      generateSuggestedPrompt(tagFrequencies);
      try { hljs.highlightElement(keywordDetails.firstChild); } catch (error) { }
    }
  } catch (error) { console.error(error); }
}

function calculateFileHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result;
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(byte => ('00' + byte.toString(16)).slice(-2)).join('');
        resolve(hashHex);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Unable to read the file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function downloadFile(purge) {
  editorNotificationPanel.innerHTML = '';
  let newMetadata;
  try {
    newMetadata = metadataEditor.value && !purge ? JSON.parse(metadataEditor.value) : {};
    const validateJsonString = (obj, name) => {
      try{
        obj && typeof obj === 'string' && JSON.parse(obj);
      }catch(e){
        editorNotificationPanel.innerHTML = `Error parsing edited metadata field '${name}'. Ensure the field value is a valid JSON string and try again.`;
        throw e;
      }     
    };
    !purge && ['ss_dataset_dirs', 'ss_bucket_info', 'ss_tag_frequency'].forEach((f) => { validateJsonString(newMetadata[f], f); });
  } catch (e) {
    editorNotificationPanel.innerHTML = editorNotificationPanel.innerHTML || "Error parsing edited metadata. Ensure the metadata is in valid JSON format and try again.";
    return;
  }

  try{
    const reader = new FileReader();
    reader.onload = function (event) {
      const dataView = new DataView(reader.result);
      const metadataSize = dataView.getUint32(0, true);
      const metadataBytes = new Uint8Array(reader.result.slice(8, 8 + metadataSize));
      const textDecoder = new TextDecoder("utf-8");
      const headerStr = textDecoder.decode(metadataBytes);
      let header = JSON.parse(headerStr);
      header['__metadata__'] = newMetadata;

      const newHeaderStr = JSON.stringify(header);
      const textEncoder = new TextEncoder();
      const newHeaderBytes = textEncoder.encode(newHeaderStr);

      const newHeaderSize = newHeaderBytes.length;
      const newFileArrayBuffer = new ArrayBuffer(8 + newHeaderSize + reader.result.byteLength - 8 - metadataSize);
      const newFileDataView = new DataView(newFileArrayBuffer);
      newFileDataView.setUint32(0, newHeaderSize, true);
      new Uint8Array(newFileArrayBuffer, 8, newHeaderSize).set(newHeaderBytes);
      new Uint8Array(newFileArrayBuffer, 8 + newHeaderSize).set(new Uint8Array(reader.result, 8 + metadataSize));
      
      const blob = new Blob([newFileArrayBuffer], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safetensorsFile.name.replace(/(\.[^.]+)$/, `_${purge?"purged":"edited"}$1`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Metadata ${purge?"purged":"updated"} successfully!`);
    };
    reader.readAsArrayBuffer(safetensorsFile);
  } catch (error) {
    editorNotificationPanel.innerHTML = "An error occured while updating the file.";
    console.error(error);
  }
}

function toggleDarkMode(){
  document.body.classList.toggle('light-theme');
  document.body.classList.toggle('dark-theme');
}

function initSettingsStorage(){
  // Retrieve values from local storage and set default values if not present
  const loadSettings = () => {
    document.querySelectorAll('.settings-field').forEach(function (element) {
        const id = element.id;
        if (id) {
            const value = localStorage.getItem(id);
            if (value !== null) {
                if (element.type === 'checkbox') {
                    element.checked = value === 'true';
                } else {
                    element.value = value;
                }
            }
        }
    });
    !darkMode.checked && toggleDarkMode();
  };

  // Save values to local storage
  const saveSettings = () => {
      document.querySelectorAll('.settings-field').forEach(function (element) {
          const id = element.id;
          if (id) {
              const value = element.type === 'checkbox' ? element.checked : element.value;
              localStorage.setItem(id, value.toString());
          }
      });
  }

  // Load settings when the page is opened
  window.addEventListener('load', function () {
      loadSettings();
  });

  // Save settings when the user changes any input
  document.querySelectorAll('.settings-field').forEach(function (element) {
      element.addEventListener('input', saveSettings);
  });

  // Clear local storage and reset defaults
  document.getElementById('clearSettingsBtn').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });
}
