// The administration source is absent from src. Preserve the deployed UI and
// replace its catalog code with the tested source module until it is recovered.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const assets = fileURLToPath(new URL('../dist/assets/', import.meta.url));
const filename = readdirSync(assets).find(name => /^index-[\w-]+\.js$/.test(name) && readFileSync(`${assets}/${name}`, 'utf8').includes('function Gu()'));
if (!filename) throw new Error('Expected deployed application was not found; no files changed.');
const path = `${assets}/${filename}`;
let code = readFileSync(path, 'utf8');
function replaceOnce(before, after) {
  if (!code.includes(before) || code.indexOf(before) !== code.lastIndexOf(before)) throw new Error(`Unexpected bundle structure: ${before.slice(0, 80)}`);
  code = code.replace(before, after);
}
if (!code.includes('/* catalog-repair-v1 */')) {
  const loaderStart = code.indexOf('const Ih=async()=>');
  const loaderEnd = code.indexOf(',Rh=', loaderStart);
  if (loaderStart < 0 || loaderEnd < 0) throw new Error('Catalog loader not found');
  code = code.slice(0, loaderStart) + 'const Ih=()=>loadCatalog(Ue)' + code.slice(loaderEnd);
  const filterStart = code.indexOf('$e=x.useMemo(()=>n.filter(');
  const filterEnd = code.indexOf(',Ye=()=>', filterStart);
  if (filterStart < 0 || filterEnd < 0) throw new Error('Catalog filter not found');
  code = code.slice(0, filterStart) + '$e=x.useMemo(()=>filterCatalog(n,{purpose:$,search:C,project:y,city:H,developer:q,type:Q,bedrooms:ue,price:P,area:R,sort:J}),[n,$,C,y,H,q,Q,ue,P,R,J])' + code.slice(filterEnd);
  replaceOnce('function Gu(){', 'function Gu(){const[propertyError,setPropertyError]=x.useState("");');
  replaceOnce('de=async()=>{o(!0);const D=await Ih();i(D.data||[]),h(D.source),o(!1)},ke=', 'de=async()=>{o(!0);try{const D=await Ih();i(D.data),h(D.source),setPropertyError("")}catch(error){setPropertyError(error.message)}finally{o(!1)}},catalogWatch=x.useEffect(()=>watchCatalog(de),[]),ke=');
  replaceOnce('children:[e.jsx(Kh,{activeTab:', 'children:[propertyError&&e.jsxs("div",{role:"alert",className:"p-4 bg-red-50 text-red-700",children:[propertyError,e.jsx("button",{onClick:de,className:"ml-3 underline",children:"Thử lại"})]}),e.jsx(Kh,{activeTab:');
  // Also refresh after a property is created or edited in any screen.
  code = '/* catalog-repair-v1 */import{filterCatalog,loadCatalog,watchCatalog}from"./property-catalog.js";\n' + code;
  parse(code, { sourceType: 'module' });
}
if (!code.includes('/* catalog-repair-v2 */')) {
  code = code.replace('import{filterCatalog,loadCatalog,watchCatalog}', 'import{filterCatalog,loadCatalog,watchCatalog,safePropertyList,coordinatesValid,shareListing}');
  replaceOnce('const D=localStorage.getItem("3tv_favorites");return D?JSON.parse(D):[]', 'return safePropertyList("3tv_favorites")');
  replaceOnce('const D=localStorage.getItem("3tv_recent_views");return D?JSON.parse(D):[]', 'return safePropertyList("3tv_recent_views")');
  replaceOnce('openCompare:()=>{}', 'openCompare:()=>document.getElementById("compare-drawer")?.focus()');
  replaceOnce('className:"fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-red-600 shadow-2xl p-4"', 'id:"compare-drawer",tabIndex:-1,className:"fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-red-600 shadow-2xl p-4 max-h-[70vh] overflow-y-auto"');
  const mapStart = code.indexOf('function ju({properties:');
  const mapBody = code.indexOf('return e.jsxs("div"', mapStart);
  if (mapStart < 0 || mapBody < 0) throw new Error('Map component not found');
  code = code.slice(0, mapStart) + 'function ju({properties:n=[],onSelectProperty:i}){const r=[10.7769,106.7009],c=n.filter(coordinatesValid).map(h=>({...h,mapCoords:[Number(h.lat),Number(h.lng)]}));' + code.slice(mapBody);
  replaceOnce('e.jsxs(pu,{center:r,zoom:12', 'e.jsxs(pu,{key:c.map(h=>h.code).join(","),ref:map=>{if(map&&c.length)map.fitBounds(c.map(h=>h.mapCoords),{padding:[35,35],maxZoom:15})},center:c[0]?.mapCoords||r,zoom:12');
  replaceOnce('b=_=>{_.stopPropagation();const T=`${window.location.origin}/?property=${n.code||n.id}`;navigator.clipboard&&(navigator.clipboard.writeText(T),w(!0),setTimeout(()=>w(!1),2e3))}', 'b=async _=>{_.stopPropagation();if(await shareListing(n)){w(!0);setTimeout(()=>w(!1),2e3)}}');
  replaceOnce('q=()=>{const Q=`${window.location.origin}/?property=${n.code||n.id}`;navigator.clipboard&&(navigator.clipboard.writeText(Q),b(!0),setTimeout(()=>b(!1),2500))}', 'q=async()=>{if(await shareListing(n)){b(!0);setTimeout(()=>b(!1),2500)}}');
  replaceOnce('function Gu(){const[propertyError', 'function Gu(){const sharedOpened=x.useRef(false);const[propertyError');
  replaceOnce('},dt=(D,Ne)=>', '},sharedLink=x.useEffect(()=>{if(!sharedOpened.current){const code=new URL(window.location.href).searchParams.get("property"),property=n.find(p=>p.code===code||String(p.id)===code);if(property){sharedOpened.current=true;V(property)}}},[n]),dt=(D,Ne)=>');
  code = '/* catalog-repair-v2 */\n' + code;
  parse(code, { sourceType: 'module' });
}
if (!code.includes('/* catalog-repair-v3 */')) {
  code = code.replace('watchCatalog,safePropertyList,coordinatesValid,shareListing}', 'watchCatalog,safePropertyList,coordinatesValid,shareListing,requestJson}');
  replaceOnce('try{await fetch(`/api/property-types/${S.id}`,{method:"PUT",headers:Q(!0),body:JSON.stringify(se)})}catch{}', 'await requestJson(`/api/property-types/${S.id}`,{method:"PUT",headers:Q(!0),body:JSON.stringify(se)});');
  replaceOnce('let K=Date.now();try{const Le=await fetch("/api/property-types",{method:"POST",headers:Q(!0),body:JSON.stringify(se)});if(Le.ok){const A=await Le.json();A.data&&A.data.id&&(K=A.data.id)}}catch{}', 'const result=await requestJson("/api/property-types",{method:"POST",headers:Q(!0),body:JSON.stringify(se)});const K=result.data.id;');
  replaceOnce('try{await fetch(`/api/property-types/${X.id}`,{method:"DELETE",headers:Q()})}catch{}', 'await requestJson(`/api/property-types/${X.id}`,{method:"DELETE",headers:Q()});');
  replaceOnce('catch{te("Có lỗi xảy ra, vui lòng thử lại!","error")}', 'catch(error){te(error.message||"Có lỗi xảy ra, vui lòng thử lại!","error")}');
  replaceOnce('catch{te("Không thể xóa danh mục, vui lòng thử lại!","error")}', 'catch(error){te(error.message||"Không thể xóa danh mục, vui lòng thử lại!","error")}');
  replaceOnce('if(G.data&&Array.isArray(G.data)&&G.data.length>0)', 'if(Array.isArray(G.data))');
  code = '/* catalog-repair-v3 */\n' + code;
  parse(code, { sourceType: 'module' });
}
code = code.replace('id:"compare-drawer",tabIndex:-1,className:', 'id:"compare-drawer",tabIndex:-1,style:{maxHeight:"70vh",overflowY:"auto"},className:');
parse(code, { sourceType: 'module' });
if (!code.includes('/* property-form-repair-v1 */')) {
  code = '/* property-form-repair-v1 */import{numericInputProps,validatePropertyForm}from"./property-form.js";\n' + code;
  for (const [state, handler, error] of [['o', 'w', 'f'], ['o', 'k', 'f'], ['r', 'b', 'p']]) {
    for (const field of ['price', 'area']) {
      replaceOnce(`type:"number",name:"${field}",value:${state}.${field},onChange:${handler}`, `...numericInputProps("${field}",${state}.${field},${handler},${error})`);
    }
    replaceOnce(`type:"text",name:"address",value:${state}.address,onChange:${handler}`, `type:"text",name:"address",maxLength:255,"aria-label":"Địa chỉ chi tiết",value:${state}.address,onChange:${handler}`);
  }
  replaceOnce('u(!0);try{const T=localStorage.getItem("3tv_token")||"",k=', 'const formError=validatePropertyForm(o);if(formError){f(formError);return}u(!0);try{const T=localStorage.getItem("3tv_token")||"",k=');
  replaceOnce('u(!0);try{let v=r;', 'const formError=validatePropertyForm(o);if(formError){f(formError);return}u(!0);try{let v=r;');
  replaceOnce('h(!0);try{const O={...r,price:Number(r.price)', 'const formError=validatePropertyForm(r);if(formError){p(formError);return}h(!0);try{const O={...r,price:Number(r.price)');
  replaceOnce('O.ok||(O=await fetch(`http://localhost:8080/api/properties/${n.id}`,{method:"PUT",headers:k,body:JSON.stringify(o)}));', '');
  replaceOnce('X.ok||(X=await fetch("http://localhost:8080/api/properties",{method:"POST",headers:y,body:JSON.stringify(C)}));', '');
  replaceOnce('v.ok||(v=await fetch("http://localhost:8080/api/properties",{method:"POST",headers:$,body:JSON.stringify(O)}));', '');
  parse(code, { sourceType: 'module' });
}
if (!code.includes('/* hide-without-reason-v1 */')) {
  replaceOnce('if(P.preventDefault(),S(null),u===4&&!f.trim()){S("Vui lòng chọn hoặc nhập lý do từ chối / tạm ẩn tin đăng.");return}', 'P.preventDefault();S(null);');
  code = '/* hide-without-reason-v1 */\n' + code;
  parse(code, { sourceType: 'module' });
}
code = code.replace(/from"\.\/property-form\.js(?:\?v=\d+)?"/g, 'from"./property-form.js?v=10"');
if (!code.includes('/* bulk-hide-optional-reason-v1 */')) {
  replaceOnce('if(S.preventDefault(),_(""),c===4&&!u.trim()){_("Vui lòng nhập lý do khi tạm ẩn / từ chối hàng loạt.");return}', 'S.preventDefault();_("");');
  code = '/* bulk-hide-optional-reason-v1 */\n' + code;
  parse(code, { sourceType: 'module' });
}
if (!code.includes('/* visible-history-v1 */')) {
  code = '/* visible-history-v1 */import{availableRecentViews}from"./property-catalog.js";\n' + code;
  replaceOnce('[re,z]=x.useState([]),de=', '[re,z]=x.useState([]),visibleHistory=x.useMemo(()=>availableRecentViews(W,n),[W,n]),de=');
  const start = code.indexOf('function Gu(');
  const end = code.indexOf('_c.createRoot(', start);
  let app = code.slice(start, end);
  app = app.replaceAll('W.length', 'visibleHistory.length').replaceAll('W.slice(', 'visibleHistory.slice(').replaceAll('recentViews:W', 'recentViews:visibleHistory');
  code = code.slice(0, start) + app + code.slice(end);
  parse(code, { sourceType: 'module' });
}
if (!code.includes('/* database-refresh-v1 */')) {
  replaceOnce('de=async()=>{o(!0);try{const D=await Ih();i(D.data),h(D.source),setPropertyError("")}catch(error){setPropertyError(error.message)}finally{o(!1)}}', 'de=async({silent=false}={})=>{if(!silent)o(!0);try{const D=await Ih();i(D.data),G(previous=>previous?D.data.find(p=>p.code===previous.code)||null:null),h(D.source),setPropertyError("")}catch(error){setPropertyError(error.message)}finally{if(!silent)o(!1)}}');
  replaceOnce('je=async(V=1)=>{p(!0),Y([]);try{', 'je=async(V=1,silent=false)=>{if(!silent){p(!0);Y([])}try{');
  replaceOnce('A(be.message||"Lỗi khi tải dữ liệu.","error")}finally{p(!1)}},Te=', 'A(be.message||"Lỗi khi tải dữ liệu.","error")}finally{if(!silent)p(!1)}},Te=');
  replaceOnce('x.useEffect(()=>{he()},[]),x.useEffect(()=>{n==="list"||n==="review"?je(1):n==="trash"&&Te(1)},[n,b,T,O,$,C,y]);', 'x.useEffect(()=>{he()},[]),x.useEffect(()=>{n==="list"||n==="review"?je(1):n==="trash"&&Te(1)},[n,b,T,O,$,C,y]),x.useEffect(()=>watchCatalog(()=>{if(n==="list"||n==="review"){he();je(f.current_page,true)}}),[n,b,T,O,$,C,y,f.current_page]);');
  code = '/* database-refresh-v1 */\n' + code;
  parse(code, { sourceType: 'module' });
}
if (!code.includes('/* real-session-and-sql-types-v1 */')) {
  code = '/* real-session-and-sql-types-v1 */import{loginSession,sessionUser}from"./auth-session.js";import{useDatabaseTypes,databaseTypeOptions}from"./database-types.js";\n' + code;
  let start = code.indexOf('Hh=async n=>');
  let end = code.indexOf(',zh=', start);
  if (start < 0 || end < 0) throw new Error('Login helper not found');
  code = code.slice(0, start) + 'Hh=n=>loginSession(Ue,n)' + code.slice(end);
  start = code.indexOf('$h=async()=>');
  end = code.indexOf(',Fh=', start);
  if (start < 0 || end < 0) throw new Error('Session helper not found');
  code = code.slice(0, start) + '$h=()=>sessionUser(Ue)' + code.slice(end);
  start = code.indexOf('ke=async()=>{const D=await $h();');
  end = code.indexOf(',Me=async()=>', start);
  if (start < 0 || end < 0) throw new Error('Session check not found');
  code = code.slice(0, start) + 'ke=async()=>{try{const D=await $h();if(D?.user){p(D.user);localStorage.setItem("3tv_user",JSON.stringify(D.user))}else if(u||O==="admin"){p(null);localStorage.removeItem("3tv_user");localStorage.removeItem("3tv_token");_("login");w(true)}}catch(error){setPropertyError("Không xác nhận được phiên đăng nhập. Vui lòng kiểm tra kết nối.")}},authListener=x.useEffect(()=>{const handler=()=>{p(null);localStorage.removeItem("3tv_user");localStorage.removeItem("3tv_token");_("login");w(true)};window.addEventListener("3tv:auth-required",handler);return()=>window.removeEventListener("3tv:auth-required",handler)},[])' + code.slice(end);
  replaceOnce('onOpenProfile:()=>k(!0)}),e.jsx(zi,{isOpen:T', 'onOpenProfile:()=>k(!0)}),e.jsx(yu,{isOpen:f,initialMode:b,onClose:()=>w(false),onAuthSuccess:dt}),e.jsx(zi,{isOpen:T');
  const tree = parse(code, { sourceType: 'module' });
  const replacements = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' && node.arguments?.[0]?.value === 'select' && node.arguments[1]?.type === 'ObjectExpression') {
      const props = node.arguments[1].properties;
      const named = key => props.find(p => p.key?.name === key)?.value;
      if (named('name')?.value === 'type' && named('value')?.type === 'MemberExpression' && named('children')) {
        const child = named('children');
        replacements.push([child.start, child.end, `databaseTypeOptions(e,sqlTypes,${code.slice(named('value').start,named('value').end)})`]);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object' && value.type) visit(value);
    }
  }
  visit(tree);
  if (replacements.length !== 3) throw new Error(`Expected 3 SQL type selectors, found ${replacements.length}`);
  for (const [a,b,text] of replacements.sort((a,b)=>b[0]-a[0])) code=code.slice(0,a)+text+code.slice(b);
  for (const signature of ['function Cu({isOpen:n,onClose:i,currentUser:r}){','function Mu({onSuccess:n,onCancel:i}){','function Bu({property:n,onClose:i,onSuccess:r}){']) replaceOnce(signature, signature+'const sqlTypes=useDatabaseTypes(x);');
  replaceOnce('function Au(){const[n,i]=x.useState(()=>{try{const g=localStorage.getItem("3tv_property_types");return g?JSON.parse(g):oa}catch{return oa}})', 'function Au(){const[n,i]=x.useState([])');
  const typeStart = code.indexOf('function Au(');
  start = code.indexOf('fe=async()=>',typeStart);
  end = code.indexOf(';x.useEffect(()=>{fe()},[]);',start);
  if(start<0||end<0)throw new Error('Property type loader not found');
  code=code.slice(0,start)+'fe=async({silent=false}={})=>{if(!silent)o(true);try{const data=await requestJson(`/api/property-types?_t=${Date.now()}`,{headers:Q()});if(!Array.isArray(data.data))throw new Error("Danh mục từ database không hợp lệ.");i(data.data)}catch(error){te(error.message,"error")}finally{if(!silent)o(false)}};x.useEffect(()=>{fe();return watchCatalog(fe)},[])'+code.slice(end+';x.useEffect(()=>{fe()},[])'.length);
  parse(code, { sourceType: 'module' });
}
writeFileSync(`${assets}/auth-session.js`, readFileSync(new URL('../src/utils/authSession.js', import.meta.url)));
writeFileSync(`${assets}/database-types.js`, readFileSync(new URL('../src/utils/databaseTypes.js', import.meta.url)));
writeFileSync(`${assets}/property-form.js`, readFileSync(new URL('../src/utils/propertyForm.js', import.meta.url)));
writeFileSync(`${assets}/property-catalog.js`, readFileSync(new URL('../src/utils/propertyCatalog.js', import.meta.url)));
writeFileSync(path, code);
const indexPath = new URL('../dist/index.html', import.meta.url);
const html = readFileSync(indexPath, 'utf8').replace(new RegExp(`(${filename.replaceAll('.', '\\.')})(?:\\?catalog=\\d+)?`, 'g'), '$1?catalog=12');
writeFileSync(indexPath, html);
console.log(`Updated ${filename} with the source catalog module; administration UI preserved.`);
