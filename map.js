(() => {
  const config = window.NBA_DOHA_CONFIG;
  const icons = window.NBA_DOHA_ICONS;
  const defaults = window.NBA_DOHA_DEFAULT_ICONS;
  mapboxgl.accessToken = config.mapboxToken;
  const map = new mapboxgl.Map({container:"map",style:"mapbox://styles/mapbox/standard",center:config.mapCenter,zoom:config.mapZoom,pitch:0,bearing:0,projection:"mercator",config:{basemap:{lightPreset:"night",showPointOfInterestLabels:false,showTransitLabels:false,showRoadLabels:true,showPlaceLabels:true}}});
  map.setMaxPitch(0); map.dragRotate.disable(); map.touchZoomRotate.disableRotation(); map.scrollZoom.enable();
  map.addControl(new mapboxgl.NavigationControl({showCompass:false,showZoom:true,visualizePitch:false}),"bottom-right");
  const rendered=[];
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  function renderHotspots(items){
    items.forEach(item=>{
      const wrapper=document.createElement("div"); wrapper.className="hotspot-wrapper"; wrapper.dataset.category=item.filterCategory;
      const pulse=document.createElement("span"); pulse.className="hotspot-pulse";
      const button=document.createElement("button"); button.className="hotspot"; button.type="button"; button.setAttribute("aria-label",`Open information about ${item.title}`);
      const icon=document.createElement("span"); icon.className="hotspot__icon"; const key=icons[item.icon]?item.icon:(defaults[item.filterCategory]||"default"); icon.innerHTML=icons[key];
      const number=document.createElement("span"); number.className="hotspot__number"; number.textContent=item.number;
      const label=document.createElement("span"); label.className="hotspot-label"; label.textContent=item.shortLabel || item.title;
      button.append(icon,number); wrapper.append(pulse,button,label);
      const link = item.link && item.link !== "#" ? `<a class="popup-button" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.buttonLabel||"View details")}</a>` : "";
      const popup=new mapboxgl.Popup({offset:34,closeButton:true,closeOnClick:true,focusAfterOpen:true}).setHTML(`<article><div class="popup-hero"><span class="popup-category">${esc(item.category)}</span></div><div class="popup-body"><h2>${esc(item.title)}</h2><div class="popup-time">${esc(item.time)}</div><p>${esc(item.description)}</p>${link}</div></article>`);
      new mapboxgl.Marker({element:wrapper,anchor:"center"}).setLngLat(item.coordinates).setPopup(popup).addTo(map);
      button.addEventListener("click",()=>{document.querySelectorAll(".hotspot").forEach(x=>x.classList.remove("is-active"));button.classList.add("is-active");map.flyTo({center:item.coordinates,zoom:Math.max(map.getZoom(),14.2),pitch:0,bearing:0,duration:750,essential:true});});
      popup.on("close",()=>button.classList.remove("is-active")); rendered.push({element:wrapper,category:item.filterCategory});
    });
  }
  fetch("hotspots.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(renderHotspots).catch(err=>{console.error("Could not load hotspots.json",err);});
  document.querySelectorAll(".filter-button").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".filter-button").forEach(x=>x.classList.remove("active"));button.classList.add("active");const selected=button.dataset.filter;rendered.forEach(item=>item.element.style.display=selected==="all"||item.category===selected?"flex":"none");}));
})();
