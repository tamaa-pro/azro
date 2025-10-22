// js/analyzer.js

const PARAM = location.search.replace(/^\?/, '').trim();
if(!PARAM){document.querySelector('#preview').textContent = 'لا يوجد رابط في الاستعلام'; throw ''}

// normalize: إذا المستخدم مرر الرابط بدون https://
let raw = PARAM;
if(!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

const url = new URL(raw);
const name = (url.pathname.split('/').filter(Boolean).pop() || '').split('?')[0] || url.hostname;
const extension = (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

function detectType(ext, fullUrl){
  if(!ext){
    // محاولة استخراج من content-type لاحقًا
    return 'unknown';
  }
  if(['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if(['mp4','webm','mov','mkv'].includes(ext)) return 'video';
  if(['mp3','wav','ogg','m4a','oga'].includes(ext)) return 'audio';
  if(['txt','log','md','json','js','css','csv'].includes(ext)) return 'text';
  if(['html','htm'].includes(ext)) return 'html';
  if(['zip','rar','7z','tar','gz'].includes(ext)) return 'archive';
  if(['apk','xapk'].includes(ext)) return 'app';
  return 'unknown';
}

const type = detectType(extension, url.href);

// عرض مبدئي
const preview = document.querySelector('#preview');
preview.textContent = 'جاهز — نوع الملف: ' + type;

document.querySelector('#fname').textContent = name || '--';
document.querySelector('#ftype').textContent = type + (extension ? ' - ' + extension : '');
document.querySelector('#fsource').textContent = url.hostname;

// نقرأ الهيدر لرؤية الحجم والتاريخ وإذا لم يسمح السيرفر فالنتيجة ستكون null
fetch(url.href, { method: 'HEAD' }).then(res => {
  const size = res.headers.get('content-length');
  const date = res.headers.get('last-modified');
  document.querySelector('#fsize').textContent = size ? formatSize(+size) : '--';
  document.querySelector('#fdate').textContent = date || '--';
}).catch(()=>{
  document.querySelector('#fsize').textContent = '--';
  document.querySelector('#fdate').textContent = '--';
});

function formatSize(b){ if(!b) return '--'; if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1) + ' KB'; if(b<1073741824) return (b/1048576).toFixed(1) + ' MB'; return (b/1073741824).toFixed(1) + ' GB'; }

// نرسل تفاصيل الى الناشر
const detail = { url: url.href, name, extension, type };
window.dispatchEvent(new CustomEvent('azro:analyzed', { detail }));

// إذا الملف صورة/فيديو/صوت، نعرض مسبقًا العنصر (مع تحميل مُجبَر لاحقًا عبر downloader)
if(type === 'image'){
  preview.innerHTML = '';
  const img = document.createElement('img'); img.src = url.href; img.alt = name; img.loading = 'lazy'; img.style.maxWidth = '100%'; preview.appendChild(img);
} else if(type === 'video'){
  preview.innerHTML = '';
  const v = document.createElement('video'); v.src = url.href; v.controls = true; v.style.maxWidth = '100%'; preview.appendChild(v);
} else if(type === 'audio'){
  preview.innerHTML = '';
  const a = document.createElement('audio'); a.src = url.href; a.controls = true; a.style.width = '100%'; preview.appendChild(a);
} else {
  preview.innerHTML = '<div style="font-size:54px">📁</div>';
}

// show openText button when type is text
if(type === 'text') document.querySelector('#openText').classList.remove('hidden');

// فتح العرض النصي
const openTextBtn = document.querySelector('#openText');
openTextBtn.addEventListener('click', async ()=>{
  try{
    const res = await fetch(url.href);
    const txt = await res.text();
    const viewer = document.querySelector('#viewer');
    viewer.innerHTML = '<pre>' + escapeHtml(txt) + '</pre>'; viewer.classList.remove('hidden'); viewer.scrollIntoView({behavior:'smooth'});
  }catch(e){ alert('فشل جلب الملف النصي'); }
});

function escapeHtml(s){return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

// exposed helper
export const analyzed = detail;

if(url.includes("github.io/") && !url.match(/\.[a-zA-Z0-9]+$/)){
 folderHandler.loadFolder(url);
 return;
}
