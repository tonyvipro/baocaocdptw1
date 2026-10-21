export function useDatabaseTypes(React) {
  const [types, setTypes] = React.useState([]);
  React.useEffect(() => {
    let live = true;
    const reload = async () => {
      try {
        const response = await fetch('/api/property-types', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (!response.ok) return;
        const data = await response.json();
        if (live && Array.isArray(data.data)) setTypes(data.data.filter(type => Number(type.status ?? 1) === 1));
      } catch { /* Keep the last successful SQL response during a temporary outage. */ }
    };
    reload();
    const timer = setInterval(reload, 5000);
    window.addEventListener('3tv:properties-changed', reload);
    return () => { live = false; clearInterval(timer); window.removeEventListener('3tv:properties-changed', reload); };
  }, []);
  return types;
}

export function databaseTypeOptions(jsx, types, selected) {
  const options = types.map(type => jsx.jsx('option', { value: type.name, children: type.name }, type.id));
  if (!types.some(type => type.name === selected)) options.unshift(jsx.jsx('option', { value: selected, disabled: true, children: types.length ? `${selected} (không khả dụng)` : 'Đang tải loại BĐS từ database...' }, 'current'));
  return options;
}

export function databaseTypeElements(React, types, selected) {
  const options = types.map(type => React.createElement('option', { key: type.id, value: type.name }, type.name));
  if (!types.some(type => type.name === selected)) options.unshift(React.createElement('option', { key: 'unavailable', value: selected, disabled: true }, types.length ? `${selected} (không khả dụng)` : 'Đang tải loại BĐS từ database...'));
  return options;
}
