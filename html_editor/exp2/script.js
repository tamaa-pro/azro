const el = id => document.getElementById(id);
const codeArea = el('codeArea'), colorDropdown = el('colorDropdown'), compressDropdown = el('compressDropdown'),
      wrapToggle = el('wrapToggle'), fileImport = el('fileImport'), notification = el('notification'),
      urlInput = el('urlInput'), importUrlBtn = el('importUrlBtn'), colorPickerModal = el('colorPickerModal'),
      textColorInput = el('textColorInput'), bgColorInput = el('bgColorInput'), cancelColorBtn = el('cancelColorBtn'),
      applyColorBtn = el('applyColorBtn'), customColorBtn = el('customColorBtn'), lastCustomColorBtn = el('lastCustomColorBtn'),
      lastCustomColorPreview = el('lastCustomColorPreview'), sidebar = el('sidebar'), sidebarOverlay = el('sidebarOverlay'),
      sidebarToggle = el('sidebarToggle'), fileNameInput = el('fileNameInput'), saveFileNameBtn = el('saveFileNameBtn'),
      fileSize = el('fileSize'), lastModified = el('lastModified'), codeSource = el('codeSource'), charCount = el('charCount'),
      lineCount = el('lineCount'), showHistoryBtn = el('showHistoryBtn'), codeHistory = el('codeHistory'), historyItems = el('historyItems'),
      fontDropdown = el('fontDropdown'), fontBtn = el('fontBtn'), customFontBtn = el('customFontBtn'), fontUrlBtn = el('fontUrlBtn'),
      fontUrlModal = el('fontUrlModal'), fontUrlInput = el('fontUrlInput'), cancelFontUrlBtn = el('cancelFontUrlBtn'),
      applyFontUrlBtn = el('applyFontUrlBtn'), expandEditorBtn = el('expandEditorBtn'), sidebarOptions = el('sidebarOptions'),
      sidebarColorBtn = el('sidebarColorBtn'), sidebarCompressBtn = el('sidebarCompressBtn'), sidebarWrapToggle = el('sidebarWrapToggle'),
      sidebarImportFileBtn = el('sidebarImportFileBtn'), sidebarExportFileBtn = el('sidebarExportFileBtn'), sidebarFileImport = el('sidebarFileImport'),
      sidebarRemoveSpacesBtn = el('sidebarRemoveSpacesBtn'), sidebarRemoveLineBreaksBtn = el('sidebarRemoveLineBreaksBtn'),
      sidebarCompressAllBtn = el('sidebarCompressAllBtn'), sidebarCustomColorBtn = el('sidebarCustomColorBtn'),
      sidebarLastCustomColorBtn = el('sidebarLastCustomColorBtn'), sidebarLastCustomColorPreview = el('sidebarLastCustomColorPreview');

let history = [''], historyIndex = 0, isFirstLoad = true, lastCustomColor = '', lastCustomBg = '', 
    currentFileName = 'index.html', codeOrigin = 'written';
let previewWindow = null;
let isEditorExpanded = false;

function initEditor() {
  const savedColor = localStorage.getItem('textColor') || '#ffffff',
        savedBg = localStorage.getItem('textBg') || '#000000',
        savedFont = localStorage.getItem('editorFont') || "'Fira Code', monospace";
  
  codeArea.style.color = savedColor;
  codeArea.style.backgroundColor = savedBg;
  codeArea.style.fontFamily = savedFont;
  
  wrapToggle.checked = localStorage.getItem('wrapMode') !== 'false';
  updateWrapMode(wrapToggle.checked);
  sidebarWrapToggle.checked = wrapToggle.checked;
  
  const savedCode = localStorage.getItem('savedCode');
  if (savedCode) {
    codeArea.value = savedCode;
    history = [savedCode];
  }
  
  setupEventListeners();
  isFirstLoad = false;
  
  lastCustomColor = localStorage.getItem('lastCustomColor') || '';
  lastCustomBg = localStorage.getItem('lastCustomBg') || '';
  
  if (lastCustomColor) {
    lastCustomColorBtn.style.display = 'block';
    lastCustomColorPreview.style.backgroundColor = lastCustomColor;
    sidebarLastCustomColorBtn.style.display = 'block';
    sidebarLastCustomColorPreview.style.backgroundColor = lastCustomColor;
  }
  
  currentFileName = localStorage.getItem('fileName') || document.title + '.html';
  fileNameInput.value = currentFileName;
  updateFileInfo();
  loadHistory();
}

function setupEventListeners() {
  el('undoBtn').addEventListener('click', undo);
  el('redoBtn').addEventListener('click', redo);
  el('goTopBtn').addEventListener('click', () => codeArea.scrollTo(0, 0));
  el('goBottomBtn').addEventListener('click', () => codeArea.scrollTo(0, codeArea.scrollHeight));
  el('cutBtn').addEventListener('click', handleCut);
  el('copyBtn').addEventListener('click', copyText);
  el('pasteBtn').addEventListener('click', handlePaste);
  el('deleteBtn').addEventListener('click', handleDelete);
  
  document.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', e => {
      const color = e.target.getAttribute('data-color');
      const bg = e.target.getAttribute('data-bg');
      applyColors(color, bg);
      colorDropdown.classList.remove('active');
    });
  });
  
  document.querySelectorAll('[data-font]').forEach(btn => {
    btn.addEventListener('click', e => {
      const font = e.target.getAttribute('data-font');
      applyFont(font);
      fontDropdown.classList.remove('active');
    });
  });
  
  customColorBtn.addEventListener('click', () => {
    colorDropdown.classList.remove('active');
    colorPickerModal.style.display = 'block';
  });
  
  sidebarCustomColorBtn.addEventListener('click', () => {
    colorPickerModal.style.display = 'block';
  });
  
  lastCustomColorBtn.addEventListener('click', () => {
    if (lastCustomColor && lastCustomBg) {
      applyColors(lastCustomColor, lastCustomBg);
    }
    colorDropdown.classList.remove('active');
  });
  
  sidebarLastCustomColorBtn.addEventListener('click', () => {
    if (lastCustomColor && lastCustomBg) {
      applyColors(lastCustomColor, lastCustomBg);
    }
  });
  
  cancelColorBtn.addEventListener('click', () => {
    colorPickerModal.style.display = 'none';
  });
  
  applyColorBtn.addEventListener('click', () => {
    const textColor = textColorInput.value.trim();
    const bgColor = bgColorInput.value.trim();
    
    if (!isValidColor(textColor) || !isValidColor(bgColor)) {
      return showNotification('الرجاء إدخال ألوان صالحة', true);
    }
    
    lastCustomColor = textColor;
    lastCustomBg = bgColor;
    localStorage.setItem('lastCustomColor', textColor);
    localStorage.setItem('lastCustomBg', bgColor);
    applyColors(textColor, bgColor);
    colorPickerModal.style.display = 'none';
    
    lastCustomColorBtn.style.display = 'block';
    lastCustomColorPreview.style.backgroundColor = textColor;
    sidebarLastCustomColorBtn.style.display = 'block';
    sidebarLastCustomColorPreview.style.backgroundColor = textColor;
  });
  
  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', toggleSidebar);
  saveFileNameBtn.addEventListener('click', saveFileName);
  
  fileNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') saveFileName();
  });
  
  showHistoryBtn.addEventListener('click', toggleHistory);
  
  el('removeSpacesBtn').addEventListener('click', () => {
    compressCode('spaces');
    compressDropdown.classList.remove('active');
  });
  
  el('removeLineBreaksBtn').addEventListener('click', () => {
    compressCode('lineBreaks');
    compressDropdown.classList.remove('active');
  });
  
  el('compressAllBtn').addEventListener('click', () => {
    compressCode('all');
    compressDropdown.classList.remove('active');
  });
  
  el('sidebarRemoveSpacesBtn').addEventListener('click', () => compressCode('spaces'));
  el('sidebarRemoveLineBreaksBtn').addEventListener('click', () => compressCode('lineBreaks'));
  el('sidebarCompressAllBtn').addEventListener('click', () => compressCode('all'));
  
  wrapToggle.addEventListener('change', () => {
    const enabled = wrapToggle.checked;
    updateWrapMode(enabled);
    localStorage.setItem('wrapMode', enabled);
    sidebarWrapToggle.checked = enabled;
  });
  
  sidebarWrapToggle.addEventListener('change', () => {
    const enabled = sidebarWrapToggle.checked;
    updateWrapMode(enabled);
    localStorage.setItem('wrapMode', enabled);
    wrapToggle.checked = enabled;
  });
  
  el('importFileBtn').addEventListener('click', () => fileImport.click());
  el('sidebarImportFileBtn').addEventListener('click', () => sidebarFileImport.click());
  fileImport.addEventListener('change', handleFileImport);
  sidebarFileImport.addEventListener('change', handleFileImport);
  
  importUrlBtn.addEventListener('click', async function() {
    const url = urlInput.value.trim();
    if (!url) return showNotification('الرجاء إدخال رابط صحيح', true);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('فشل جلب الملف');
      
      const text = await response.text();
      codeArea.value = text;
      saveToHistory();
      saveCode();
      showNotification('تم تحميل الرابط بنجاح');
      updateFileInfo();
      codeOrigin = 'url';
      codeSource.textContent = 'من رابط';
    } catch (error) {
      showNotification('حدث خطأ أثناء جلب الملف: ' + error.message, true);
    }
  });
  
  el('exportFileBtn').addEventListener('click', exportFile);
  el('sidebarExportFileBtn').addEventListener('click', exportFile);
  
  el('runBtn').addEventListener('click', function() {
    showNotification('جاري تحميل النتيجة...');
    const content = codeArea.value;
    const isHTML = /<[a-z][\s\S]*>/i.test(content);
    
    const htmlContent = isHTML ? content : 
      `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>معاينة النص</title><style>body{font-family:Arial;padding:20px;line-height:1.6;white-space:pre-wrap}</style></head><body>${content}</body></html>`;
    
    if (previewWindow && !previewWindow.closed) {
      previewWindow.document.open();
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
      previewWindow.focus();
    } else {
      previewWindow = window.open('', '_blank');
      previewWindow.document.write(htmlContent);
    }
  });
  
  codeArea.addEventListener('input', function() {
    saveToHistory();
    saveCode();
    updateFileInfo();
    
    if (codeOrigin !== 'written') {
      codeOrigin = 'written';
      codeSource.textContent = 'مكتوب';
    }
  });
  
  el('colorBtn').addEventListener('click', e => {
    e.stopPropagation();
    colorDropdown.classList.toggle('active');
    compressDropdown.classList.remove('active');
    fontDropdown.classList.remove('active');
  });
  
  el('compressBtn').addEventListener('click', e => {
    e.stopPropagation();
    compressDropdown.classList.toggle('active');
    colorDropdown.classList.remove('active');
    fontDropdown.classList.remove('active');
  });
  
  el('sidebarColorBtn').addEventListener('click', e => {
    e.stopPropagation();
    el('sidebarColorBtn').parentNode.classList.toggle('active');
    el('sidebarCompressBtn').parentNode.classList.remove('active');
    fontDropdown.classList.remove('active');
  });
  
  el('sidebarCompressBtn').addEventListener('click', e => {
    e.stopPropagation();
    el('sidebarCompressBtn').parentNode.classList.toggle('active');
    el('sidebarColorBtn').parentNode.classList.remove('active');
    fontDropdown.classList.remove('active');
  });
  
  el('fontBtn').addEventListener('click', e => {
    e.stopPropagation();
    fontDropdown.classList.toggle('active');
    colorDropdown.classList.remove('active');
    compressDropdown.classList.remove('active');
  });
  
  document.addEventListener('click', (e) => {
    if (!colorDropdown.contains(e.target)) colorDropdown.classList.remove('active');
    if (!compressDropdown.contains(e.target)) compressDropdown.classList.remove('active');
    if (!fontDropdown.contains(e.target)) fontDropdown.classList.remove('active');
    
    const sidebarDropdowns = document.querySelectorAll('.sidebar-options .dropdown');
    sidebarDropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  });
  
  customFontBtn.addEventListener('click', () => {
    fileImport.click();
    fileImport.onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.name.endsWith('.ttf') && !file.name.endsWith('.otf')) {
        return showNotification('الرجاء اختيار ملف خط بصيغة .ttf أو .otf', true);
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        const fontUrl = URL.createObjectURL(new Blob([e.target.result]));
        const fontName = file.name.replace(/\.[^/.]+$/, '');
        const fontFace = new FontFace(fontName, `url(${fontUrl})`);
        
        fontFace.load().then(() => {
          document.fonts.add(fontFace);
          codeArea.style.fontFamily = `'${fontName}', monospace`;
          localStorage.setItem('editorFont', `'${fontName}', monospace`);
          showNotification(`تم تطبيق الخط ${fontName}`);
          fontDropdown.classList.remove('active');
        }).catch(err => {
          showNotification('حدث خطأ أثناء تحميل الخط: ' + err.message, true);
        });
      };
      reader.readAsArrayBuffer(file);
    };
  });
  
  fontUrlBtn.addEventListener('click', () => {
    fontDropdown.classList.remove('active');
    fontUrlModal.style.display = 'block';
  });
  
  cancelFontUrlBtn.addEventListener('click', () => {
    fontUrlModal.style.display = 'none';
  });
  
  applyFontUrlBtn.addEventListener('click', () => {
    const fontUrl = fontUrlInput.value.trim();
    if (!fontUrl) return showNotification('الرجاء إدخال رابط صحيح', true);
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
    
    showNotification('تم تحميل الخط بنجاح، الرجاء اختياره من القائمة');
    fontUrlModal.style.display = 'none';
  });
  
  expandEditorBtn.addEventListener('click', toggleEditorExpand);
}

function toggleEditorExpand() {
  isEditorExpanded = !isEditorExpanded;
  
  if (isEditorExpanded) {
    document.body.classList.add('expanded');
    expandEditorBtn.innerHTML = '<i class="fas fa-compress"></i> تقصير خانة المحرر';
    sidebarOptions.style.display = 'block';
  } else {
    document.body.classList.remove('expanded');
    expandEditorBtn.innerHTML = '<i class="fas fa-expand"></i> توسيع خانة المحرر';
    sidebarOptions.style.display = 'none';
  }
}

function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    codeArea.value = e.target.result;
    saveToHistory();
    saveCode();
    showNotification('تم تحميل الملف بنجاح');
    updateFileInfo();
    codeOrigin = 'file';
    codeSource.textContent = 'من ملف';
  };
  reader.readAsText(file);
}

function exportFile() {
  const blob = new Blob([codeArea.value], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentFileName;
  a.click();
  URL.revokeObjectURL(url);
  showNotification('تم تحميل الملف بنجاح');
}

function toggleSidebar() {
  sidebar.classList.toggle('open');
  sidebarOverlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
}

function toggleHistory() {
  const isHistoryVisible = codeHistory.style.display === 'block';
  codeHistory.style.display = isHistoryVisible ? 'none' : 'block';
  showHistoryBtn.innerHTML = isHistoryVisible ? '<i class="fas fa-history"></i> عرض السجل' : '<i class="fas fa-times"></i> إغلاق السجل';
}

function loadHistory() {
  const savedHistory = JSON.parse(localStorage.getItem('codeHistory') || '[]');
  historyItems.innerHTML = '';
  
  if (savedHistory.length === 0) {
    historyItems.innerHTML = '<div style="text-align:center;color:#888;padding:10px">لا يوجد سجل محفوظ</div>';
    return;
  }
  
  savedHistory.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'code-history-item';
    historyItem.innerHTML = `
      <div>${item.name || 'غير معروف'}</div>
      <div style="font-size:11px;color:#aaa">${new Date(item.time).toLocaleString()}</div>
      <button class="delete-history" data-index="${index}"><i class="fas fa-trash"></i></button>
    `;
    historyItem.addEventListener('click', () => loadCodeFromHistory(index));
    historyItems.appendChild(historyItem);
  });
  
  document.querySelectorAll('.delete-history').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteHistoryItem(parseInt(this.getAttribute('data-index')));
    });
  });
}

function loadCodeFromHistory(index) {
  const savedHistory = JSON.parse(localStorage.getItem('codeHistory') || '[]');
  if (index >= 0 && index < savedHistory.length) {
    codeArea.value = savedHistory[index].code;
    saveToHistory();
    saveCode();
    updateFileInfo();
    showNotification('تم تحميل الكود من السجل');
    toggleSidebar();
  }
}

function deleteHistoryItem(index) {
  const savedHistory = JSON.parse(localStorage.getItem('codeHistory') || '[]');
  if (index >= 0 && index < savedHistory.length) {
    savedHistory.splice(index, 1);
    localStorage.setItem('codeHistory', JSON.stringify(savedHistory));
    loadHistory();
    showNotification('تم حذف العنصر من السجل');
  }
}

function saveFileName() {
  const newName = fileNameInput.value.trim();
  if (!newName) return showNotification('الرجاء إدخال اسم ملف صحيح', true);
  
  currentFileName = newName.endsWith('.html') ? newName : newName + '.html';
  localStorage.setItem('fileName', currentFileName);
  showNotification('تم حفظ اسم الملف');
}

function updateFileInfo() {
  const text = codeArea.value;
  const size = Math.max(1, Math.ceil(new Blob([text]).size / 1024));
  const chars = text.length;
  const lines = text.split('\n').length;
  
  fileSize.textContent = size < 1024 ? `${size} KB` : `${(size/1024).toFixed(1)} MB`;
  charCount.textContent = chars.toLocaleString();
  lineCount.textContent = lines.toLocaleString();
  lastModified.textContent = new Date().toLocaleString();
  
  const savedHistory = JSON.parse(localStorage.getItem('codeHistory') || '[]');
  savedHistory.unshift({
    code: text,
    name: currentFileName,
    time: new Date().toISOString()
  });
  
  if (savedHistory.length > 10) savedHistory.pop();
  localStorage.setItem('codeHistory', JSON.stringify(savedHistory));
}

function applyColors(textColor, bgColor) {
  codeArea.style.color = textColor;
  codeArea.style.backgroundColor = bgColor;
  localStorage.setItem('textColor', textColor);
  localStorage.setItem('textBg', bgColor);
  if (!isFirstLoad) showNotification('تم تغيير لون النص');
}

function applyFont(font) {
  codeArea.style.fontFamily = font;
  localStorage.setItem('editorFont', font);
  showNotification('تم تغيير الخط');
}

function isValidColor(color) {
  const hex = /^#([0-9A-F]{3}){1,2}$/i.test(color);
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.test(color);
  return hex || rgb;
}

function handleCut() {
  if (codeArea.selectionStart === codeArea.selectionEnd) {
    codeArea.select();
  }
  document.execCommand('copy');
  handleDelete();
  showNotification('تم قص النص المحدد');
}

function compressCode(mode) {
  let compressed = codeArea.value;
  
  switch(mode) {
    case 'spaces':
      compressed = compressed.replace(/[^\S\n]+/g, ' ').replace(/^[ \t]+|[ \t]+$/gm, '');
      showNotification('تم حذف الفراغات الزائدة فقط');
      break;
    case 'lineBreaks':
      compressed = compressed.replace(/\n+/g, '\n').replace(/^\s*\n/gm, '');
      showNotification('تم حذف الأسطر الفارغة فقط');
      break;
    case 'all':
      compressed = compressed.replace(/\s+/g, ' ');
      showNotification('تم ضغط الكود بالكامل');
  }
  
  codeArea.value = compressed;
  saveToHistory();
  saveCode();
  updateFileInfo();
}

function updateWrapMode(enabled) {
  if (enabled) {
    codeArea.style.whiteSpace = 'pre-wrap';
    codeArea.style.overflowX = 'hidden';
    codeArea.style.wordWrap = 'break-word';
  } else {
    codeArea.style.whiteSpace = 'pre';
    codeArea.style.overflowX = 'auto';
    codeArea.style.wordWrap = 'normal';
  }
}

function copyText() {
  if (codeArea.selectionStart === codeArea.selectionEnd) {
    navigator.clipboard.writeText(codeArea.value)
      .then(() => showNotification('تم نسخ الكود بالكامل'))
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = codeArea.value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('تم نسخ الكود بالكامل');
      });
  } else {
    document.execCommand('copy');
    showNotification('تم نسخ النص المحدد');
  }
}

function handlePaste() {
  navigator.clipboard.readText().then(text => {
    const start = codeArea.selectionStart;
    const end = codeArea.selectionEnd;
    codeArea.value = codeArea.value.substring(0, start) + text + codeArea.value.substring(end);
    codeArea.selectionStart = codeArea.selectionEnd = start + text.length;
    saveToHistory();
    saveCode();
    showNotification('تم لصق النص');
    updateFileInfo();
    codeOrigin = 'pasted';
    codeSource.textContent = 'ملصوق';
  }).catch(() => {
    document.execCommand('paste');
    saveToHistory();
    saveCode();
    showNotification('تم لصق النص');
    updateFileInfo();
    codeOrigin = 'pasted';
    codeSource.textContent = 'ملصوق';
  });
}

function handleDelete() {
  if (codeArea.selectionStart === codeArea.selectionEnd) {
    codeArea.value = '';
    showNotification('تم حذف كل النص');
  } else {
    document.execCommand('delete');
    showNotification('تم حذف النص المحدد');
  }
  saveToHistory();
  saveCode();
  updateFileInfo();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    codeArea.value = history[historyIndex];
    showNotification('تم التراجع');
    updateFileInfo();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    codeArea.value = history[historyIndex];
    showNotification('تم الإعادة');
    updateFileInfo();
  }
}

function saveToHistory() {
  if (codeArea.value !== history[historyIndex]) {
    history = history.slice(0, historyIndex + 1);
    history.push(codeArea.value);
    historyIndex = history.length - 1;
    
    if (history.length > 50) {
      history.shift();
      historyIndex--;
    }
  }
}

function saveCode() {
  localStorage.setItem('savedCode', codeArea.value);
}

function showNotification(message, isError = false) {
  const notification = el('notification');
  notification.innerHTML = (isError ? '<i class="fas fa-exclamation-circle"></i> ' : '') + message;
  notification.className = 'notification' + (isError ? ' error' : '');
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none' }, 2000);
}

initEditor();