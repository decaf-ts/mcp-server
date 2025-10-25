export function renderJsDoc(template: string, context: Record<string, any>) {
  // Very small templating: replace {{key}} with context[key]
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_m, key) => {
    const parts = key.split('.');
    let v: any = context;
    for (const p of parts) {
      if (v == null) return '';
      v = v[p];
    }
    return String(v ?? '');
  });
}
