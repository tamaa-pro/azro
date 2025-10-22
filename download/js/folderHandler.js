importScripts("https://corsproxy.io/?https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
async function loadFolder(path){
 let api="https://corsproxy.io/?https://api.github.com/repos/"+path.replace("tamaa-pro.github.io/","tamaa-pro/").replace("github.io/","")+"/contents";
 const res=await fetch(api);if(!res.ok)return alert("تعذر جلب المجلد");
 const data=await res.json();const list=document.createElement("div");list.style="display:flex;flex-direction:column;gap:6px;";
 for(const i of data){const e=document.createElement("div");e.textContent=i.name;e.style="padding:5px;border-bottom:1px solid #333;cursor:pointer";list.appendChild(e);}
 document.querySelector("#preview").innerHTML="";document.querySelector("#preview").appendChild(list);
 const dl=document.querySelector("#download");dl.onclick=()=>downloadFolder(api.split("/contents")[0]+"/contents",path.split("/").pop());
}
async function downloadFolder(api,folderName){
 const zip=new JSZip();async function add(p,z){
 const r=await fetch("https://corsproxy.io/?"+p);if(!r.ok)return;
 const d=await r.json();for(const i of d){if(i.type==="file"){const f=await fetch("https://corsproxy.io/?"+i.download_url);zip.file(i.name,await f.blob());}
 else if(i.type==="dir"){const n=z.folder(i.name);await add(i.url,n);}}}
 await add(api,zip);const blob=await zip.generateAsync({type:"blob"});const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download=folderName+".zip";a.click();URL.revokeObjectURL(a.href);
}
window.folderHandler={loadFolder};
