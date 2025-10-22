// js/downloader.js
import { analyzed } from './analyzer.js';

const dlBtn = document.querySelector('#download');
const copyBtn = document.querySelector('#copy');
const shareBtn = document.querySelector('#share');

let target = analyzed || null;

window.addEventListener('azro:analyzed', (e)=>{ target = e.detail; });

// دالة إجبار التحميل: تحاول أولًا جلب الملف ثم تحميله كـ blob
async function forceDownload(url, name){
  try{
    // نجرب تحميل كـ blob (أفضل لأنّه يحمي من فتح الصفحة في iframe)
    const res = await fetch(url);
    if(!res.ok) throw new Error('fetch-fail');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name || url.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // تحرير الــ object URL بعد وقت قصير
    setTimeout(()=>URL.revokeObjectURL(blobUrl), 30000);
    // إشعار بسيط
    try{ if('serviceWorker' in navigator) navigator.serviceWorker.ready.then(()=>{}); }catch(e){}
  }catch(err){
    // fallback: إنشاء رابط download مباشر (قد يُفتح بدلاً من تنزيله حسب السيرفر)
    const a = document.createElement('a');
    a.href = url; a.download = name || url.split('/').pop() || 'file'; a.style.display='none';
    document.body.appendChild(a); a.click(); a.remove();
  }
}

// زر التحميل
dlBtn.addEventListener('click', ()=>{
  if(!target) return alert('لم يتم تحليل الرابط بعد');
  forceDownload(target.url, target.name);
});

copyBtn.addEventListener('click', ()=>navigator.clipboard.writeText(location.href));
shareBtn.addEventListener('click', ()=>{
  if(navigator.share) navigator.share({title: target?.name || 'ملف', url: location.href});
  else alert('المشاركة غير مدعومة');
});

export { forceDownload };
