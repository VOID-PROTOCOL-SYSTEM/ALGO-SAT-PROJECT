/* Original SVG caricature silhouettes: the fallback when assets/topgear/trio.jpg is missing */
window.TGsil = function () {
  return '<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">' +
    '<defs><linearGradient id="tgs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4a300"/><stop offset=".55" stop-color="#b8231c"/><stop offset="1" stop-color="#1a0d0a"/></linearGradient></defs>' +
    '<rect width="600" height="320" fill="url(#tgs)"/><circle cx="300" cy="150" r="120" fill="#ffd200" opacity=".25"/><rect y="290" width="600" height="30" fill="#0c0c0e"/>' +
    '<g fill="#0c0c0e"><circle cx="170" cy="62" r="22"/><path d="M148 56q22-30 44 0z"/><rect x="128" y="86" width="84" height="116" rx="14"/><rect x="138" y="200" width="26" height="90"/><rect x="176" y="200" width="26" height="90"/>' +
    '<circle cx="300" cy="128" r="20"/><path d="M280 122l6-22 8 14 8-18 8 16 8-12 6 22z"/><rect x="268" y="148" width="64" height="70" rx="12"/><rect x="276" y="216" width="22" height="74"/><rect x="304" y="216" width="22" height="74"/>' +
    '<circle cx="432" cy="80" r="21"/><path d="M410 78q4-34 44-24q-10 6-6 28q-10-12-38-4z"/><rect x="396" y="102" width="72" height="104" rx="13"/><rect x="404" y="204" width="24" height="86"/><rect x="436" y="204" width="24" height="86"/></g>' +
    '<g font-family="Impact,Arial Narrow,sans-serif" font-size="15" fill="#ffd200" text-anchor="middle" letter-spacing="1"><text x="170" y="312">JEZZA</text><text x="300" y="312">THE HAMSTER</text><text x="432" y="312">CAPTAIN SLOW</text></g></svg>';
};
