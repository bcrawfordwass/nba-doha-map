(() => {
  "use strict";
  const config = window.NBA_DOHA_CONFIG;
  const icons = window.NBA_DOHA_ICONS;
  const labels = window.NBA_DOHA_ICON_LABELS;
  const defaultIcons = window.NBA_DOHA_DEFAULT_ICONS;
  const storageKey = "nba-doha-manager-json-v1";
  let items = [];
  let selectedIndex = null;
  let pickerMarker = null;
  let mapMarkers = [];
  let iconWasManuallyChosen = false;

  const $ = id => document.getElementById(id);
  const fields = {
    number: $("number"), venueType: $("venueType"), title: $("title"), shortLabel: $("shortLabel"),
    description: $("description"), time: $("time"), longitude: $("longitude"), latitude: $("latitude"),
    buttonLabel: $("buttonLabel"), link: $("link")
  };
  const message = $("message");
  const listMessage = $("listMessage");
  const fileInput = $("file");

  function show(el, text, type = "success") { el.textContent = text; el.className = `message show ${type}`; }
  function clear(el) { el.textContent = ""; el.className = "message"; }
  function venueValues() { const [category, filterCategory] = fields.venueType.value.split("|"); return {category, filterCategory}; }
  function selectedIcon() { return document.querySelector('input[name="icon"]:checked')?.value || "default"; }
  function chooseIcon(key, manual = false) { const input = document.querySelector(`input[name="icon"][value="${key}"]`) || document.querySelector('input[name="icon"][value="default"]'); if (input) input.checked = true; if (manual) iconWasManuallyChosen = true; updatePreview(); }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

  function buildIconPicker() {
    const picker = $("iconPicker");
    picker.innerHTML = "";
    Object.keys(icons).forEach(key => {
      const label = document.createElement("label");
      label.className = "icon-option";
      label.innerHTML = `<input type="radio" name="icon" value="${key}"><span class="icon-card">${icons[key]}<span>${esc(labels[key] || key)}</span></span>`;
      label.querySelector("input").addEventListener("change", () => { iconWasManuallyChosen = true; updatePreview(); });
      picker.appendChild(label);
    });
    chooseIcon("default");
  }

  mapboxgl.accessToken = config.mapboxToken;
  const map = new mapboxgl.Map({container:"map",style:"mapbox://styles/mapbox/standard",center:config.mapCenter,zoom:config.mapZoom,pitch:0,bearing:0,projection:"mercator",config:{basemap:{lightPreset:"night",showPointOfInterestLabels:true,showTransitLabels:false,showRoadLabels:true,showPlaceLabels:true}}});
  map.setMaxPitch(0); map.dragRotate.disable(); map.touchZoomRotate.disableRotation(); map.scrollZoom.enable();
  map.addControl(new mapboxgl.NavigationControl({showCompass:false,showZoom:true,visualizePitch:false}),"bottom-right");
  map.on("click", e => placePicker(e.lngLat.lng, e.lngLat.lat));

  function placePicker(lng, lat) {
    fields.longitude.value = Number(lng).toFixed(6);
    fields.latitude.value = Number(lat).toFixed(6);
    if (!pickerMarker) {
      pickerMarker = new mapboxgl.Marker({color:"#39ff14",draggable:true}).setLngLat([lng,lat]).addTo(map);
      pickerMarker.on("dragend", () => { const p = pickerMarker.getLngLat(); fields.longitude.value = p.lng.toFixed(6); fields.latitude.value = p.lat.toFixed(6); });
    } else pickerMarker.setLngLat([lng,lat]);
  }

  function makeMapMarker(item, index) {
    const el = document.createElement("button");
    el.type = "button";
    el.title = item.title;
    const iconKey = icons[item.icon] ? item.icon : (defaultIcons[item.filterCategory] || "default");
    el.innerHTML = icons[iconKey];
    Object.assign(el.style,{position:"relative",display:"grid",width:"42px",height:"42px",placeItems:"center",color:"#071d49",background:"#f28c28",border:"3px solid white",borderRadius:"50%",boxShadow:"0 0 0 3px #c8102e",cursor:"pointer"});
    el.querySelector("svg").style.cssText = "display:block;width:24px;height:24px";
    el.addEventListener("click", () => editItem(index));
    return new mapboxgl.Marker({element:el,anchor:"center"}).setLngLat(item.coordinates).addTo(map);
  }

  function renderMapMarkers() { mapMarkers.forEach(m => m.remove()); mapMarkers = []; items.forEach((item,index) => { if (validCoordinates(item.coordinates)) mapMarkers.push(makeMapMarker(item,index)); }); }
  function validCoordinates(coords) { return Array.isArray(coords) && Number.isFinite(Number(coords[0])) && Number.isFinite(Number(coords[1])); }

  function renderList() {
    const query = $("search").value.trim().toLowerCase();
    const list = $("list"); list.innerHTML = "";
    const visible = items.map((item,index)=>({item,index})).filter(({item}) => !query || String(item.title).toLowerCase().includes(query) || String(item.category).toLowerCase().includes(query));
    if (!visible.length) { list.innerHTML = '<div class="empty">No matching hotspots.</div>'; return; }
    visible.forEach(({item,index}) => {
      const row = document.createElement("div"); row.className = "row";
      const iconKey = icons[item.icon] ? item.icon : (defaultIcons[item.filterCategory] || "default");
      row.innerHTML = `<div class="row-icon">${icons[iconKey]}</div><div class="summary"><strong>${esc(item.title)}</strong><span>${esc(item.category)} · ${esc(item.time || "")}</span></div><div class="row-actions"><button class="icon-btn" data-a="up" title="Move up">↑</button><button class="icon-btn" data-a="down" title="Move down">↓</button><button class="icon-btn" data-a="edit" title="Edit">✎</button><button class="icon-btn delete" data-a="delete" title="Delete">×</button></div>`;
      row.querySelector('[data-a="up"]').addEventListener("click",()=>moveItem(index,-1));
      row.querySelector('[data-a="down"]').addEventListener("click",()=>moveItem(index,1));
      row.querySelector('[data-a="edit"]').addEventListener("click",()=>editItem(index));
      row.querySelector('[data-a="delete"]').addEventListener("click",()=>deleteItem(index));
      list.appendChild(row);
    });
  }

  function updatePreview() {
    const iconKey = selectedIcon();
    $("previewIcon").innerHTML = icons[iconKey] || icons.default;
    $("previewTitle").textContent = fields.title.value.trim() || "Hotspot name";
    $("previewMeta").textContent = venueValues().category;
  }

  function validate() {
    clear(message);
    const required = [["number","Number"],["title","Name"],["description","Description"],["time","Timings"],["longitude","Longitude"],["latitude","Latitude"],["buttonLabel","Button label"],["link","Website link"]];
    const missing = required.filter(([key])=>!fields[key].value.trim()).map(([,label])=>label);
    if (missing.length) { show(message,`Complete: ${missing.join(", ")}.`,"error"); return false; }
    if (fields.link.value.trim() !== "#") { try { const u = new URL(fields.link.value.trim()); if (!["https:","http:"].includes(u.protocol)) throw new Error(); } catch { show(message,"Enter a valid website address or use #.","error"); return false; } }
    return true;
  }

  function readForm() { const v=venueValues(); return {number:fields.number.value.trim(),title:fields.title.value.trim(),shortLabel:fields.shortLabel.value.trim()||fields.title.value.trim(),category:v.category,filterCategory:v.filterCategory,icon:selectedIcon(),description:fields.description.value.trim(),time:fields.time.value.trim(),coordinates:[Number(fields.longitude.value),Number(fields.latitude.value)],buttonLabel:fields.buttonLabel.value.trim(),link:fields.link.value.trim()}; }
  function persist() { localStorage.setItem(storageKey, JSON.stringify(items)); }

  function saveItem() {
    if (!validate()) return;
    const item = readForm();
    if (selectedIndex === null) { items.push(item); show(message,"Hotspot added."); } else { items[selectedIndex]=item; show(message,"Hotspot updated."); }
    persist(); renderList(); renderMapMarkers(); resetForm();
  }

  function editItem(index) {
    const item=items[index]; selectedIndex=index; iconWasManuallyChosen=true;
    fields.number.value=item.number||""; fields.title.value=item.title||""; fields.shortLabel.value=item.shortLabel||""; fields.description.value=item.description||""; fields.time.value=item.time||""; fields.longitude.value=Number(item.coordinates[0]).toFixed(6); fields.latitude.value=Number(item.coordinates[1]).toFixed(6); fields.buttonLabel.value=item.buttonLabel||""; fields.link.value=item.link||"#";
    const option=[...fields.venueType.options].find(o=>o.value===`${item.category}|${item.filterCategory}`); fields.venueType.value=option?option.value:"Other|other";
    chooseIcon(icons[item.icon]?item.icon:(defaultIcons[item.filterCategory]||"default"));
    $("save").textContent="Update hotspot"; $("deleteSelected").hidden=false; placePicker(item.coordinates[0],item.coordinates[1]); map.flyTo({center:item.coordinates,zoom:Math.max(map.getZoom(),14),duration:600}); updatePreview(); clear(message);
  }

  function resetForm() {
    selectedIndex=null; iconWasManuallyChosen=false;
    Object.values(fields).forEach(field=>field.value=""); fields.venueType.value="Experience|experience"; fields.number.value=String(items.length+1); fields.link.value="#"; chooseIcon(defaultIcons.experience||"default");
    if (pickerMarker) { pickerMarker.remove(); pickerMarker=null; }
    $("save").textContent="Add hotspot"; $("deleteSelected").hidden=true; updatePreview();
  }

  function deleteItem(index) { if (!confirm(`Delete "${items[index].title}"?`)) return; items.splice(index,1); persist(); renderList(); renderMapMarkers(); resetForm(); show(listMessage,"Hotspot deleted."); }
  function moveItem(index,delta) { const target=index+delta; if(target<0||target>=items.length)return; [items[index],items[target]]=[items[target],items[index]]; persist(); renderList(); renderMapMarkers(); }

  function downloadJson() { const blob=new Blob([JSON.stringify(items,null,2)+"\n"],{type:"application/json;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="hotspots.json"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); show(listMessage,"Downloaded hotspots.json. Replace the existing file in GitHub."); }
  function importJson() { fileInput.value=""; fileInput.click(); }
  fileInput.addEventListener("change", async()=>{ const file=fileInput.files[0]; if(!file)return; try { const parsed=JSON.parse(await file.text()); if(!Array.isArray(parsed))throw new Error("The JSON must contain an array."); if(!confirm(`Replace the manager list with ${parsed.length} imported hotspots?`))return; items=parsed; persist(); renderList(); renderMapMarkers(); resetForm(); show(listMessage,`Imported ${items.length} hotspots.`); } catch(err){ show(listMessage,err.message||"Could not import that JSON file.","error"); } });

  async function loadInitialData() {
    try { const saved=JSON.parse(localStorage.getItem(storageKey)); if(Array.isArray(saved)){items=saved;} else throw new Error(); }
    catch { const response=await fetch("hotspots.json",{cache:"no-store"}); if(!response.ok)throw new Error(`Could not load hotspots.json (${response.status})`); items=await response.json(); }
    renderList(); renderMapMarkers(); resetForm();
  }

  buildIconPicker();
  fields.venueType.addEventListener("change",()=>{ const {filterCategory}=venueValues(); if(!iconWasManuallyChosen)chooseIcon(defaultIcons[filterCategory]||"default"); updatePreview(); });
  Object.values(fields).forEach(field=>{field.addEventListener("input",updatePreview); field.addEventListener("change",updatePreview);});
  $("save").addEventListener("click",saveItem); $("new").addEventListener("click",resetForm); $("deleteSelected").addEventListener("click",()=>{if(selectedIndex!==null)deleteItem(selectedIndex);}); $("search").addEventListener("input",renderList);
  $("downloadTop").addEventListener("click",downloadJson); $("downloadBottom").addEventListener("click",downloadJson); $("importTop").addEventListener("click",importJson); $("importBottom").addEventListener("click",importJson);
  map.on("load",loadInitialData);
})();
